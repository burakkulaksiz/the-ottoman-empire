import type { Terrain } from './types';

/** Oyun dengesini belirleyen sabitler; mekanikler eklendikçe büyür. */
export const RULES = {
  armyMovesPerTurn: 1,
  /**
   * Kışlak (C1): kışın ordu yalnızca kendi toprağına çekilebilir; kış başında
   * yabancı toprakta kalan ordu bu oranda asker kaybeder.
   */
  winterAttritionRate: 0.1,

  // --- Moral (C4) ---
  moraleStart: 80,
  moraleMax: 100,
  /** Kendi topraklarında tur başına moral kazancı. */
  moraleRecoveryHome: 10,
  /** Yabancı toprakta tur başına moral kaybı (ikmal sıkıntısı). */
  moraleLossAbroad: 5,
  moraleWinGain: 10,
  moraleLossPenalty: 25,

  // --- Arazi ve kale (C4) ---
  terrainDefense: {
    plain: 1,
    hills: 1.15,
    mountains: 1.3,
  } satisfies Record<Terrain, number>,
  /** Kale seviyesi başına savunma çarpanı artışı (yalnızca toprak sahibi için). */
  fortificationDefense: 0.25,
  /** Kale seviyesi başına kuşatma süresi (tur). */
  siegeTurnsPerFortLevel: 2,
  /** Topçu oranı arttıkça kuşatma kısalır: süre / (1 + oran × bu çarpan). */
  artillerySiegeSpeedup: 2,

  // --- Savaş çözümü (C5) ---
  /** Zar etkisi: her taraf gücünü 1 ± bu oran ile çarpar. */
  battleLuck: 0.15,
  /** Kaybedenin zayiat oranı: taban + (1 − güç oranı) × yayılım. */
  loserLossBase: 0.25,
  loserLossSpread: 0.35,
  /** Kazananın zayiat oranı: bu oran × güç oranı. */
  winnerLossMax: 0.25,
  // --- Zafer ve tarihe göre puan (C3) ---
  /** Tarihî sonucun bu oranı içindeki sonuç "tarihle aynı" sayılır. */
  historicalTolerance: 0.1,
} as const;

/** Morale göre güç çarpanı: 0 moral → 0,5; tam moral → 1. */
export function moraleFactor(morale: number): number {
  return 0.5 + Math.max(0, Math.min(RULES.moraleMax, morale)) / 200;
}
