/** Oyun dengesini belirleyen sabitler; mekanikler eklendikçe büyür. */
export const RULES = {
  armyMovesPerTurn: 1,
  /**
   * Kışlak (C1): kışın ordu yalnızca kendi toprağına çekilebilir; kış başında
   * yabancı toprakta kalan ordu bu oranda asker kaybeder.
   */
  winterAttritionRate: 0.1,
} as const;
