import Dexie, { type EntityTable } from 'dexie';

export interface UnlockedAchievement {
  id: string;
  /** Kazanıldığı an (ms). */
  unlockedAt: number;
  /** Hangi senaryoda kazanıldı. */
  scenarioId: string;
}

/** Başarımlar oyunlar arasında kalıcıdır (kayıt yuvalarından bağımsız). */
export interface AchievementRepository {
  list(): Promise<UnlockedAchievement[]>;
  add(records: UnlockedAchievement[]): Promise<void>;
}

class AchievementDatabase extends Dexie {
  unlocked!: EntityTable<UnlockedAchievement, 'id'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ unlocked: 'id' });
  }
}

export function createIndexedDbAchievementRepository(
  name = 'devlet-i-aliyye-achievements',
): AchievementRepository {
  let db: AchievementDatabase | null = null;
  const open = () => (db ??= new AchievementDatabase(name));
  return {
    list: () => open().unlocked.toArray(),
    async add(records) {
      // İlk kazanma anı korunur: var olan başarım üzerine yazılmaz.
      await open()
        .unlocked.bulkAdd(records)
        .catch(() => undefined);
    },
  };
}

export function createMemoryAchievementRepository(): AchievementRepository {
  const records = new Map<string, UnlockedAchievement>();
  return {
    async list() {
      return [...records.values()];
    },
    async add(list) {
      for (const record of list) {
        if (!records.has(record.id)) records.set(record.id, record);
      }
    },
  };
}

export const achievementRepository = createIndexedDbAchievementRepository();
