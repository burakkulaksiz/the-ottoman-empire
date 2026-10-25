import type { GameDate } from './calendar';
import type { Units, UnitType } from './units';

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
  /** Yapay zekâ kişiliği; yazılmazsa varsayılanlar kullanılır (C10). */
  ai?: { aggression?: number; recruitShare?: number; warlike?: number };
}

/** İki devlet arasındaki ilişki (C7). */
export type Relation = 'war' | 'peace' | 'alliance';

/** Barışın şartı: `payer` her tur `receiver`a `amount` akçe öder (haraç). */
export interface Tribute {
  payer: FactionId;
  receiver: FactionId;
  amount: number;
}

/** Yapay zekânın oyuncuya yaptığı barış teklifi (oyuncu kabul eder ya da reddeder). */
export interface Offer {
  id: string;
  from: FactionId;
  to: FactionId;
  kind: 'peace';
  /** > 0: teklif eden öder; < 0: oyuncu öder. */
  tribute: number;
}

export interface DiplomacyState {
  /** `pairKey(a, b)` → ilişki. Kaydı olmayan çift savaştadır. */
  relations: Record<string, Relation>;
  tributes: Tribute[];
  /** Bu tur yapılan teklifler (`kimden>kime`); aynı çifte tur başına bir teklif. */
  proposed: string[];
  offers: Offer[];
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

/** Olayı tetikleyen koşul (D1). Olay oyuncu için ve en fazla bir kez tetiklenir. */
export type EventTrigger =
  | { type: 'date'; date: GameDate }
  | { type: 'ownsProvince'; provinceId: ProvinceId };

/** Oyuncunun seçiminin oyuna etkisi. Metinler içerik katmanındadır. */
export type EventEffect =
  { type: 'treasury'; amount: number } | { type: 'morale'; amount: number };

export interface EventChoiceDef {
  id: string;
  effects: EventEffect[];
}

export interface EventDef {
  id: string;
  trigger: EventTrigger;
  choices: EventChoiceDef[];
}

export interface World {
  provinces: Record<ProvinceId, ProvinceDef>;
  factions: Record<FactionId, FactionDef>;
  /** Hepsi tamamlanınca oyuncu kazanır. Boşsa yalnızca hayatta kalmak sayılır. */
  objectives?: Objective[];
  /** Oyun bu tarihe gelindiğinde biter (zaman sınırı). */
  endDate?: GameDate;
  historical?: HistoricalBenchmark;
  /** Tarihî olay kartları (D1). */
  events?: EventDef[];
  /** Mini quiz soruları ve doğru seçenekleri (D5); metinler içerikte. */
  quizzes?: { id: string; answer: number }[];
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
  /** Bu tur verilen devşirme emri sayısı (her tur sıfırlanır). */
  recruited?: number;
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
  | { type: 'eventTriggered'; eventId: string }
  | { type: 'eventResolved'; eventId: string; choiceId: string }
  | {
      type: 'recruited';
      factionId: FactionId;
      provinceId: ProvinceId;
      unit: UnitType;
      amount: number;
      cost: number;
    }
  | { type: 'upkeepPaid'; factionId: FactionId; amount: number }
  | { type: 'troopsUnpaid'; factionId: FactionId; shortfall: number }
  | { type: 'warDeclared'; by: FactionId; target: FactionId }
  | { type: 'peaceMade'; a: FactionId; b: FactionId; tribute: number }
  | { type: 'allianceFormed'; a: FactionId; b: FactionId }
  | {
      type: 'proposalRefused';
      from: FactionId;
      to: FactionId;
      kind: 'peace' | 'alliance';
    }
  | {
      type: 'offerMade';
      offerId: string;
      from: FactionId;
      to: FactionId;
      tribute: number;
    }
  | { type: 'offerRejected'; offerId: string; from: FactionId }
  | {
      type: 'tributePaid';
      payer: FactionId;
      receiver: FactionId;
      amount: number;
    }
  | { type: 'rulerDied'; name: string; age: number }
  | { type: 'newRuler'; name: string; age: number }
  | { type: 'successionStruggle'; winner: string; rivals: string[] }
  | { type: 'heirBorn'; name: string }
  | { type: 'vizierAppointed'; name: string }
  | { type: 'vizierDied'; name: string }
  | { type: 'janissaryRevolt'; factionId: FactionId }
  | {
      type: 'revolt';
      provinceId: ProvinceId;
      kind: 'rebellion' | 'celali';
    }
  | { type: 'quizAnswered'; quizId: string; correct: boolean; reward: number }
  | { type: 'incomeCollected'; factionId: FactionId; amount: number }
  | { type: 'factionEliminated'; factionId: FactionId }
  | { type: 'gameEnded'; status: Extract<GameStatus, { phase: 'ended' }> };

export type LogEntry = LogPayload & { turn: number };

export type Difficulty = 'easy' | 'normal' | 'hard';

/** Oyun başında seçilen ayarlar (C10); oyun boyunca değişmez, kayda yazılır. */
export interface GameSettings {
  difficulty: Difficulty;
  /**
   * Tarihe sadık mod: rakipler tarihî rollerinin dışına çıkmaz (kendiliğinden
   * savaş açmaz, saldırmaz, yalnızca kendini savunur); olay kartlarında
   * tarihte seçilen seçenek gösterilir. Öğrenmeye odaklı oynanış.
   */
  historicalMode: boolean;
}

/** Sarayda bir kişi: hükümdar, şehzade veya vezir (C8). */
export interface Person {
  id: string;
  name: string;
  /** Doğum yılı; yaş tarihten hesaplanır. */
  born: number;
  /** 1–5: savaşçılık (ileride ordu komutası). */
  military: number;
  /** 1–5: yönetim; sadakati ve geliri artırır. */
  administration: number;
  /** `false`: tahtta hak iddia etmez (taht kavgasına katılmaz). */
  claimsThrone?: boolean;
}

/** Oyuncu devletinin sarayı ve iç siyaseti (C8). */
export interface CourtState {
  ruler: Person;
  heirs: Person[];
  vizier: Person | null;
  /** Vezirlik için adaylar (divan kurulduktan sonra, vezir yokken). */
  candidates: Person[];
  /** 0–100: sadakat/istikrar. Düşükse isyan çıkar, gelir azalır. */
  stability: number;
  /** Yeni doğan şehzadelere ve adaylara verilecek adlar. */
  names: string[];
}

/** Olay kartlarının durumu (D1). */
export interface EventsState {
  /** Tetiklenmiş (bekleyen veya çözülmüş) olaylar. */
  fired: string[];
  /** Oyuncunun karar vermesini bekleyen olaylar. */
  pending: string[];
  /** Olay → seçilen seçenek. */
  choices: Record<string, string>;
}

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
  events: EventsState;
  diplomacy: DiplomacyState;
  settings: GameSettings;
  /** Yalnızca sarayı tanımlanmış senaryolarda (oyuncu devleti için). */
  court?: CourtState;
  /** Cevaplanan quizler: soru → doğru mu? (D5) */
  quizzes?: { answered: Record<string, boolean> };
  log: LogEntry[];
  /** Deterministik id üretimi için sayaç. */
  nextId: number;
}
