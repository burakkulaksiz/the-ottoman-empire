import Dexie, { type EntityTable } from 'dexie';

import type { GameDate, GameState } from '@/engine';

/** Otomatik kayıt ve üç elle kayıt yuvası. */
export const SAVE_SLOTS = ['auto', 'slot-1', 'slot-2', 'slot-3'] as const;
export type SaveSlotId = (typeof SAVE_SLOTS)[number];

export const SLOT_LABELS: Record<SaveSlotId, string> = {
  auto: 'Otomatik kayıt',
  'slot-1': 'Yuva 1',
  'slot-2': 'Yuva 2',
  'slot-3': 'Yuva 3',
};

export function isSaveSlot(value: string | null): value is SaveSlotId {
  return SAVE_SLOTS.includes(value as SaveSlotId);
}

/** Liste ekranı için kaydın özeti (oyun durumunun kendisi olmadan). */
export interface SaveSummary {
  slot: SaveSlotId;
  scenarioId: string;
  turn: number;
  date: GameDate;
  /** Kaydın alındığı an (ms, `Date.now()`). */
  savedAt: number;
}

export interface SaveRecord extends SaveSummary {
  state: GameState;
}

export interface SaveRepository {
  list(): Promise<SaveSummary[]>;
  get(slot: SaveSlotId): Promise<SaveRecord | null>;
  put(slot: SaveSlotId, state: GameState, savedAt?: number): Promise<void>;
  remove(slot: SaveSlotId): Promise<void>;
}

function toRecord(
  slot: SaveSlotId,
  state: GameState,
  savedAt: number,
): SaveRecord {
  return {
    slot,
    scenarioId: state.scenarioId,
    turn: state.turn,
    date: state.date,
    savedAt,
    state,
  };
}

function toSummary({ state: _state, ...summary }: SaveRecord): SaveSummary {
  return summary;
}

const bySlotOrder = (a: SaveSummary, b: SaveSummary) =>
  SAVE_SLOTS.indexOf(a.slot) - SAVE_SLOTS.indexOf(b.slot);

class SaveDatabase extends Dexie {
  saves!: EntityTable<SaveRecord, 'slot'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({ saves: 'slot' });
  }
}

/** Kayıtları tarayıcının IndexedDB'sinde tutar. Veritabanı ilk kullanımda açılır. */
export function createIndexedDbSaveRepository(
  name = 'devlet-i-aliyye',
): SaveRepository {
  let db: SaveDatabase | null = null;
  const open = () => (db ??= new SaveDatabase(name));

  return {
    async list() {
      const records = await open().saves.toArray();
      return records.map(toSummary).sort(bySlotOrder);
    },
    async get(slot) {
      return (await open().saves.get(slot)) ?? null;
    },
    async put(slot, state, savedAt = Date.now()) {
      await open().saves.put(toRecord(slot, state, savedAt));
    },
    async remove(slot) {
      await open().saves.delete(slot);
    },
  };
}

/** Testler ve IndexedDB olmayan ortamlar için bellekte tutan depo. */
export function createMemorySaveRepository(): SaveRepository {
  const records = new Map<SaveSlotId, SaveRecord>();
  return {
    async list() {
      return [...records.values()].map(toSummary).sort(bySlotOrder);
    },
    async get(slot) {
      return structuredClone(records.get(slot) ?? null);
    },
    async put(slot, state, savedAt = Date.now()) {
      records.set(slot, structuredClone(toRecord(slot, state, savedAt)));
    },
    async remove(slot) {
      records.delete(slot);
    },
  };
}

/** Uygulamanın tek kayıt deposu (IndexedDB). */
export const saveRepository = createIndexedDbSaveRepository();
