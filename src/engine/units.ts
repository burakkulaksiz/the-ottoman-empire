/**
 * Birlik sınıfları (C4). Adlar Osmanlı terimleridir; diğer devletlerde aynı
 * sınıfın karşılığı kullanılır (ör. Bizans ağır süvarisi = `sipahi`).
 * Donanma, deniz bölgeleri (B4) gelene kadar bilerek yoktur.
 */
export const UNIT_TYPES = [
  'akinci',
  'sipahi',
  'yaya',
  'yeniceri',
  'topcu',
] as const;

export type UnitType = (typeof UNIT_TYPES)[number];

/** Bir ordudaki birlik sayıları. */
export type Units = Partial<Record<UnitType, number>>;

export interface UnitDef {
  /** Saldırı gücü (asker başına, denge değeri). */
  attack: number;
  /** Savunma gücü (asker başına, denge değeri). */
  defense: number;
  /** Bu yıldan önce kurulamaz; senaryo doğrulaması denetler. */
  minYear: number;
}

/**
 * TODO(kaynak): `minYear` değerleri yaklaşık; yaya (Orhan dönemi), yeniçeri
 * (I. Murad dönemi) ve topçu için kaynaklarla doğrulanmalı (D6).
 */
export const UNIT_DEFS: Record<UnitType, UnitDef> = {
  akinci: { attack: 1.2, defense: 0.6, minYear: 1299 },
  sipahi: { attack: 2, defense: 1.4, minYear: 1299 },
  yaya: { attack: 1, defense: 1.2, minYear: 1330 },
  yeniceri: { attack: 2, defense: 2.2, minYear: 1363 },
  topcu: { attack: 3, defense: 1, minYear: 1400 },
};

export function unitEntries(units: Units): [UnitType, number][] {
  return UNIT_TYPES.flatMap((type) => {
    const count = units[type] ?? 0;
    return count > 0 ? [[type, count] as [UnitType, number]] : [];
  });
}

export function armySize(units: Units): number {
  return unitEntries(units).reduce((sum, [, count]) => sum + count, 0);
}

/** Ordudaki topçuların oranı; kuşatmayı hızlandırır. */
export function artilleryShare(units: Units): number {
  const size = armySize(units);
  return size === 0 ? 0 : (units.topcu ?? 0) / size;
}

/** Her birlik türünün `keep` oranını (aşağı yuvarlayarak) korur. */
export function scaleUnits(units: Units, keep: number): Units {
  const scaled: Units = {};
  for (const [type, count] of unitEntries(units)) {
    const left = Math.floor(count * keep);
    if (left > 0) scaled[type] = left;
  }
  return scaled;
}
