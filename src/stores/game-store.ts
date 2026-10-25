import { useStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { createStore } from 'zustand/vanilla';

import type { Command, CommandError, GameState, LogEntry } from '@/engine';
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
}

export interface GameStoreActions {
  /** Yeni oyun başlatır. `seed` verilmezse rastgele bir tohum seçilir. */
  start(scenarioId: string, options?: { seed?: number }): Promise<void>;
  /** Oyuncu komutu gönderir; komutlar sırayla işlenir. */
  send(command: Command): Promise<void>;
  selectProvince(provinceId: string | null): void;
  selectArmy(armyId: string | null): void;
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
};

/** Oyun kuralı değil, oyuncuya özel rastgelelik: motor dışında seçilir. */
function randomSeed() {
  return crypto.getRandomValues(new Uint32Array(1))[0]!;
}

/**
 * Motor (Worker) ile arayüz arasındaki köprü. Motor tek doğruluk kaynağıdır;
 * store onun anlık görüntüsünü ve seçili bölge gibi arayüz durumunu tutar.
 */
export function createGameStore(createEngine: () => EngineClient) {
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
    immer((set) => ({
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
            );
            set((s) => {
              s.status = 'ready';
              s.game = game;
              s.lastLog = game.log;
            });
          } catch (error) {
            set((s) => {
              s.status = 'error';
              s.loadError =
                error instanceof Error ? error.message : String(error);
            });
          }
        });
      },

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
        }),

      selectProvince: (provinceId) =>
        set((s) => {
          s.selectedProvinceId = provinceId;
        }),

      selectArmy: (armyId) =>
        set((s) => {
          s.selectedArmyId = armyId;
        }),

      reset: () => set(initialState),
    })),
  );
}

export type GameStoreApi = ReturnType<typeof createGameStore>;

/** Uygulamanın tek oyun store'u. */
export const gameStore = createGameStore(createDefaultEngine);

export function useGameStore<T>(selector: (state: GameStore) => T): T {
  return useStore(gameStore, selector);
}
