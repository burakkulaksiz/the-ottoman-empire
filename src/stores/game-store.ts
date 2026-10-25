import { useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

import { newlyEarned } from '@/content/achievements';
import type {
  Command,
  CommandError,
  GameSettings,
  GameState,
  LogEntry,
} from '@/engine';
import {
  achievementRepository,
  type AchievementRepository,
} from '@/lib/achievements/achievement-repository';
import {
  saveRepository,
  type SaveRepository,
  type SaveSlotId,
} from '@/lib/saves/save-repository';
import {
  createDefaultEngine,
  type EngineClient,
} from '@/workers/engine-client';

export type GameStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface GameStoreState {
  status: GameStatus;
  scenarioId: string | null;
  /** Motorun son anlık görüntüsü; arayüz bunu yalnızca okur. */
  game: GameState | null;
  /** Son komutun ürettiği günlük kayıtları. */
  lastLog: LogEntry[];
  /** Son komut reddedildiyse nedeni. */
  commandError: CommandError | null;
  loadError: string | null;
  selectedProvinceId: string | null;
  /** Emir vermek için seçilen ordu (oyuncunun). */
  selectedArmyId: string | null;
  /** Son başarılı kaydın yuvası ve zamanı (arayüz geri bildirimi için). */
  lastSave: { slot: SaveSlotId; savedAt: number } | null;
  /** Kaydetme başarısız olduysa nedeni; oyun yine de devam eder. */
  saveError: string | null;
  /** Bu oturumda yeni kazanılan, henüz gösterilmemiş başarımlar (D6). */
  newAchievements: string[];
}

export interface GameStoreActions {
  /** Yeni oyun başlatır. `seed` verilmezse rastgele bir tohum seçilir. */
  start(
    scenarioId: string,
    options?: { seed?: number; settings?: Partial<GameSettings> },
  ): Promise<void>;
  /** Oyuncu komutu gönderir; komutlar sırayla işlenir. */
  send(command: Command): Promise<void>;
  /** Oyunu bir yuvaya kaydeder. */
  save(slot: SaveSlotId): Promise<void>;
  /** Bir yuvadaki kayıttan devam eder. */
  load(slot: SaveSlotId): Promise<void>;
  selectProvince(provinceId: string | null): void;
  selectArmy(armyId: string | null): void;
  /** Gösterilen başarım bildirimini kapatır. */
  dismissAchievement(id: string): void;
  reset(): void;
}

export type GameStore = GameStoreState & GameStoreActions;

const initialState: GameStoreState = {
  status: 'idle',
  scenarioId: null,
  game: null,
  lastLog: [],
  commandError: null,
  loadError: null,
  selectedProvinceId: null,
  selectedArmyId: null,
  lastSave: null,
  saveError: null,
  newAchievements: [],
};

/** Oyun kuralı değil, oyuncuya özel rastgelelik: motor dışında seçilir. */
function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

const messageOf = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/**
 * Motor (Worker) ile arayüz arasındaki köprü. Motor tek doğruluk kaynağıdır;
 * store onun anlık görüntüsünü ve seçili bölge gibi arayüz durumunu tutar.
 * Her tur sonunda oyun "otomatik kayıt" yuvasına yazılır.
 */
export function createGameStore(
  createEngine: () => EngineClient,
  saves: SaveRepository = saveRepository,
  achievements: AchievementRepository = achievementRepository,
) {
  // Daha önce kazanılan başarımlar (oyunlar arası); ilk kullanımda okunur.
  let known: Set<string> | null = null;
  const knownAchievements = async () => {
    if (!known) {
      try {
        known = new Set((await achievements.list()).map((a) => a.id));
      } catch {
        known = new Set();
      }
    }
    return known;
  };
  // Worker ilk kullanımda kurulur (import sırasında değil).
  let engine: EngineClient | null = null;
  const getEngine = () => (engine ??= createEngine());

  // Komutlar ve başlatmalar sırayla işlenir; yarış durumu oluşmaz.
  let queue: Promise<unknown> = Promise.resolve();
  const enqueue = <T>(task: () => Promise<T>) => {
    const run = queue.then(task);
    queue = run.catch(() => undefined);
    return run;
  };

  return createStore<GameStore>()(
    immer((set, get) => {
      /** Kayıt başarısız olsa bile oyun sürer; hata store'a yazılır. */
      const writeSave = async (slot: SaveSlotId, game: GameState) => {
        const savedAt = Date.now();
        try {
          await saves.put(slot, game, savedAt);
          set((s) => {
            s.lastSave = { slot, savedAt };
            s.saveError = null;
          });
        } catch (error) {
          set((s) => {
            s.saveError = messageOf(error);
          });
        }
      };

      /** Yeni kazanılan başarımları kaydeder ve bildirime ekler (D6). */
      const checkAchievements = async (game: GameState) => {
        const seen = await knownAchievements();
        const earned = newlyEarned(game, seen);
        if (earned.length === 0) return;
        for (const a of earned) seen.add(a.id);
        const unlockedAt = Date.now();
        try {
          await achievements.add(
            earned.map((a) => ({
              id: a.id,
              unlockedAt,
              scenarioId: game.scenarioId,
            })),
          );
        } catch {
          // Kalıcı kayıt başarısız olsa da bildirim gösterilir.
        }
        set((s) => {
          s.newAchievements.push(...earned.map((a) => a.id));
        });
      };

      return {
        ...initialState,

        start: (scenarioId, options) => {
          // Yükleniyor durumu hemen görünsün; motor çağrısı sıraya girer.
          set((s) => {
            Object.assign(s, initialState);
            s.status = 'loading';
            s.scenarioId = scenarioId;
          });
          return enqueue(async () => {
            try {
              const game = await getEngine().start(
                scenarioId,
                options?.seed ?? randomSeed(),
                options?.settings,
              );
              set((s) => {
                s.status = 'ready';
                s.game = game;
                s.lastLog = game.log;
              });
            } catch (error) {
              set((s) => {
                s.status = 'error';
                s.loadError = messageOf(error);
              });
            }
          });
        },

        load: (slot) => {
          set((s) => {
            Object.assign(s, initialState);
            s.status = 'loading';
          });
          return enqueue(async () => {
            try {
              const record = await saves.get(slot);
              if (!record) throw new Error('Bu yuvada kayıt yok.');
              await getEngine().load(record.scenarioId, record.state);
              set((s) => {
                s.status = 'ready';
                s.scenarioId = record.scenarioId;
                s.game = record.state;
                s.lastLog = [];
              });
            } catch (error) {
              set((s) => {
                s.status = 'error';
                s.loadError = messageOf(error);
              });
            }
          });
        },

        save: (slot) =>
          enqueue(async () => {
            const { game } = get();
            if (game) await writeSave(slot, game);
          }),

        send: (command) =>
          enqueue(async () => {
            const result = await getEngine().dispatch(command);
            set((s) => {
              if (result.ok) {
                s.game = result.state;
                s.lastLog = result.log;
                s.commandError = null;
              } else {
                s.commandError = result.error;
              }
            });
            if (result.ok && command.type === 'endTurn') {
              await writeSave('auto', result.state);
            }
            if (result.ok) await checkAchievements(result.state);
          }),

        selectProvince: (provinceId) =>
          set((s) => {
            s.selectedProvinceId = provinceId;
          }),

        selectArmy: (armyId) =>
          set((s) => {
            s.selectedArmyId = armyId;
          }),

        dismissAchievement: (id) =>
          set((s) => {
            s.newAchievements = s.newAchievements.filter((a) => a !== id);
          }),

        reset: () => set(initialState),
      };
    }),
  );
}

export type GameStoreApi = ReturnType<typeof createGameStore>;

/** Uygulamanın tek oyun store'u. */
export const gameStore = createGameStore(createDefaultEngine);

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useStore(gameStore, selector);
}
