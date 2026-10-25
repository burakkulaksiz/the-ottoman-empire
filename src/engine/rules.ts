import type { Difficulty, Terrain } from './types';

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
  // --- Ekonomi (C6) ---
  /** Tek devşirme emriyle gelen asker sayısı. */
  recruitBatch: 100,
  /** Bir bölgede tur başına en fazla kaç devşirme emri verilebilir. */
  recruitOrdersPerProvince: 3,
  /** Maaşı ödenmeyen ordunun tur başına moral kaybı. */
  unpaidMoraleLoss: 15,
  /** Maaşı ödenmeyen ordudan tur başına kaçan asker oranı. */
  unpaidDesertionRate: 0.05,

  // --- Diplomasi (C7) ---
  /** Haraç teklifinin tur başına 1 akçesi, savaş gücü olarak kaç puan sayılır? */
  tributeWeight: 100,
  /** Tur başına en fazla haraç (akçe). */
  maxTribute: 20,
  /** Barışa razı olmak için: kendi gücü ≤ teklif edenin gücü × bu oran. */
  peaceAcceptRatio: 1.3,
  /** Evlilik ittifakının çeyizi (akçe); kabul edene geçer. */
  dowry: 15,
  /** Yapay zekâ kendi gücü rakibin bu oranının altındaysa barış ister. */
  aiPeaceThreshold: 0.7,
  /** Yapay zekâ rakibinden bu kat güçlüyse savaş ilan etmeyi düşünür. */
  aiWarAdvantage: 2,

  // --- İç siyaset (C8) ---
  court: {
    adultAge: 16,
    /** Bu yaştan sonra her yıl ölüm olasılığı artar. */
    deathAgeStart: 50,
    /** (yaş − başlangıç) / bu değer = yıllık ölüm olasılığı. */
    deathAgeSpan: 100,
    maxDeathChance: 0.5,
    birthChance: 0.25,
    fatherMaxAge: 55,
    maxHeirs: 6,
    /** Vezir atanabilecek ilk yıl. TODO(kaynak): ilk vezirlik için tarih doğrulanmalı. */
    divanFrom: 1320,
    vizierCost: 20,
    /** Vezirin yönetim puanı başına gelir artışı. */
    vizierIncomeBonus: 0.02,
    /** Celali isyanlarının görüldüğü dönem. TODO(kaynak) */
    celaliFrom: 1590,
    baseStability: 45,
    rulerAdminWeight: 4,
    vizierAdminWeight: 3,
    /** Sadakatin tur başına hedefe yaklaşma hızı. */
    stabilityDrift: 2,
    /** Bu sadakatte gelir değişmez; ±incomeSpan sadakat geliri ±%100 oynatır. */
    neutralStability: 60,
    incomeSpan: 200,
    uneasyThreshold: 45,
    revoltThreshold: 30,
    revoltRelief: 5,
    successionStruggleLoss: 25,
    minorHeirLoss: 20,
    noHeirLoss: 30,
    battleLostLoss: 3,
    provinceLostLoss: 4,
    provinceWonGain: 2,
    unpaidLoss: 10,
    janissaryRevoltLoss: 15,
  },

  // --- Mini quiz (D5) ---
  /** Doğru cevabın akçe ödülü. */
  quizReward: 5,
  /** Doğru cevabın sadakate katkısı (saray varsa). */
  quizStability: 2,

  // --- Zorluk (C10) ---
  difficulty: {
    /** Oyuncu kolay: daha çok gelir, temkinli ve yavaş büyüyen rakipler. */
    easy: {
      playerIncome: 1.25,
      aiAggressionBonus: 0.4,
      aiRecruitScale: 0.5,
      aiWarlikeScale: 0.5,
    },
    normal: {
      playerIncome: 1,
      aiAggressionBonus: 0,
      aiRecruitScale: 1,
      aiWarlikeScale: 1,
    },
    /** Zor: daha az gelir, daha atak, daha çok devşiren, savaşçı rakipler. */
    hard: {
      playerIncome: 0.9,
      aiAggressionBonus: -0.3,
      aiRecruitScale: 1.6,
      aiWarlikeScale: 2,
    },
  } satisfies Record<
    Difficulty,
    {
      playerIncome: number;
      aiAggressionBonus: number;
      aiRecruitScale: number;
      aiWarlikeScale: number;
    }
  >,

  // --- Zafer ve tarihe göre puan (C3) ---
  /** Tarihî sonucun bu oranı içindeki sonuç "tarihle aynı" sayılır. */
  historicalTolerance: 0.1,
} as const;

/** Morale göre güç çarpanı: 0 moral → 0,5; tam moral → 1. */
export function moraleFactor(morale: number): number {
  return 0.5 + Math.max(0, Math.min(RULES.moraleMax, morale)) / 200;
}
