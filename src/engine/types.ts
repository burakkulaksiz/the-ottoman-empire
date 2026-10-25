import type { GameDate } from './calendar';
import type { Units } from './units';

export type FactionId = string;
export type ProvinceId = string;
export type ArmyId = string;

// --- Statik dünya: içerikten gelir, oyun boyunca değişmez, kayda yazılmaz ---

export type Terrain = 'plain' | 'hills' | 'mountains';

export interface ProvinceDef {
  id: ProvinceId;
  name: string;
  neighbors: ProvinceId[];
  /** Savunana bonus verir; belirtilmezse ova. Veri B4'te gelecek. */
  terrain?: Terrain;
  /** Kale seviyesi (0 = surlu yer yok); kuşatma gerektirir. Veri B4'te gelecek. */
  fortification?: number;
  /** Tur başına sağladığı akçe geliri. */
  baseTax: number;
}

export interface FactionDef {
  id: FactionId;
  name: string;
  color: string;
}

/** Oyuncunun zafer için tamamlaması gereken hedef (C3). */
export type Objective =
  | { id: string; type: 'holdProvinces'; provinces: ProvinceId[] }
  | { id: string; type: 'provinceCount'; count: number };

/** Oyuncunun sonucunun kıyaslandığı tarihî sonuç (C3). */
export interface HistoricalBenchmark {
  /** Tarihte bitiş tarihinde oyuncunun devletinin elinde olan bölgeler. */
  provinces: ProvinceId[];
}

export interface World {
  provinces: Record<ProvinceId, ProvinceDef>;
  factions: Record<FactionId, FactionDef>;
  /** Hepsi tamamlanınca oyuncu kazanır. Boşsa yalnızca hayatta kalmak sayılır. */
  objectives?: Objective[];
  /** Oyun bu tarihe gelindiğinde biter (zaman sınırı). */
  endDate?: GameDate;
  historical?: HistoricalBenchmark;
}

// --- Oyun durumu: her hamlede değişir, düz JSON olarak kaydedilir ---

export interface FactionState {
  id: FactionId;
  treasury: number;
  alive: boolean;
}

export interface ProvinceState {
  id: ProvinceId;
  ownerId: FactionId | null;
  /** Kuşatma sürüyorsa kuşatan devlet ve geçen tur sayısı. */
  siege?: { attackerId: FactionId; turns: number };
}

export interface ArmyState {
  id: ArmyId;
  ownerId: FactionId;
  provinceId: ProvinceId;
  units: Units;
  /** 0–100; savaş gücünü ve kışlaktaki toparlanmayı etkiler. */
  morale: number;
  movesLeft: number;
}

export type EndReason =
  'eliminated' | 'lastStanding' | 'objectives' | 'timeLimit';

/** Oyuncunun sonucu tarihe göre nasıl? (C3) */
export interface HistoricalScore {
  /** Oyun sonunda oyuncunun bölge sayısı. */
  provinces: number;
  /** Tarihî sonuçtaki bölge sayısı. */
  benchmark: number;
  /** 100 = tarihle aynı; üstü tarihten iyi. */
  points: number;
  verdict: 'better' | 'same' | 'worse';
}

export type GameStatus =
  | { phase: 'playing' }
  | {
      phase: 'ended';
      result: 'victory' | 'defeat';
      reason: EndReason;
      score?: HistoricalScore;
    };

export type LogPayload =
  | { type: 'turnStarted'; date: GameDate }
  | {
      type: 'armyMoved';
      factionId: FactionId;
      armyId: ArmyId;
      from: ProvinceId;
      to: ProvinceId;
    }
  | {
      type: 'winterAttrition';
      armyId: ArmyId;
      provinceId: ProvinceId;
      lost: number;
    }
  | {
      type: 'battleFought';
      provinceId: ProvinceId;
      attackerId: FactionId;
      defenderId: FactionId;
      winnerId: FactionId;
      attackerLosses: number;
      defenderLosses: number;
    }
  | { type: 'armyRetreated'; armyId: ArmyId; from: ProvinceId; to: ProvinceId }
  | { type: 'armyDestroyed'; armyId: ArmyId; factionId: FactionId }
  | { type: 'siegeStarted'; provinceId: ProvinceId; attackerId: FactionId }
  | { type: 'siegeLifted'; provinceId: ProvinceId; attackerId: FactionId }
  | {
      type: 'provinceCaptured';
      provinceId: ProvinceId;
      by: FactionId;
      from: FactionId | null;
    }
  | { type: 'incomeCollected'; factionId: FactionId; amount: number }
  | { type: 'factionEliminated'; factionId: FactionId }
  | { type: 'gameEnded'; status: Extract<GameStatus, { phase: 'ended' }> };

export type LogEntry = LogPayload & { turn: number };

export interface GameState {
  /** Kayıt formatı sürümü; format değişince artırılır (A4). */
  version: 1;
  scenarioId: string;
  seed: number;
  /** Tohumlu RNG'nin güncel durumu. */
  rng: number;
  turn: number;
  date: GameDate;
  playerFactionId: FactionId;
  status: GameStatus;
  factions: Record<FactionId, FactionState>;
  provinces: Record<ProvinceId, ProvinceState>;
  armies: Record<ArmyId, ArmyState>;
  log: LogEntry[];
  /** Deterministik id üretimi için sayaç. */
  nextId: number;
}
