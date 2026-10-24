import type { GameDate } from './calendar';

export type FactionId = string;
export type ProvinceId = string;
export type ArmyId = string;

// --- Statik dünya: içerikten gelir, oyun boyunca değişmez, kayda yazılmaz ---

export interface ProvinceDef {
  id: ProvinceId;
  name: string;
  neighbors: ProvinceId[];
  /** Tur başına sağladığı akçe geliri. */
  baseTax: number;
}

export interface FactionDef {
  id: FactionId;
  name: string;
  color: string;
}

export interface World {
  provinces: Record<ProvinceId, ProvinceDef>;
  factions: Record<FactionId, FactionDef>;
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
}

export interface ArmyState {
  id: ArmyId;
  ownerId: FactionId;
  provinceId: ProvinceId;
  troops: number;
  movesLeft: number;
}

export type EndReason = 'eliminated' | 'lastStanding';

export type GameStatus =
  | { phase: 'playing' }
  | { phase: 'ended'; result: 'victory' | 'defeat'; reason: EndReason };

export type LogPayload =
  | { type: 'turnStarted'; date: GameDate }
  | {
      type: 'armyMoved';
      factionId: FactionId;
      armyId: ArmyId;
      from: ProvinceId;
      to: ProvinceId;
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
