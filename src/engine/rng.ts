/**
 * Tohumlu rastgele sayı üreteci (mulberry32).
 *
 * Durum tek bir uint32 olarak `GameState.rng` içinde tutulur; böylece aynı
 * tohum ve aynı hamleler her zaman aynı oyunu üretir (tekrar oynatma,
 * hata ayıklama ve ileride çok oyunculu mod için gerekli).
 */
export interface RngHolder {
  rng: number;
}

export function random(holder: RngHolder): number {
  const state = (holder.rng + 0x6d2b79f5) >>> 0;
  holder.rng = state;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

/** `min` ve `max` dahil tam sayı. */
export function randomInt(holder: RngHolder, min: number, max: number) {
  return min + Math.floor(random(holder) * (max - min + 1));
}

export function chance(holder: RngHolder, probability: number): boolean {
  return random(holder) < probability;
}

export function pick<T>(holder: RngHolder, items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Cannot pick from an empty list');
  }
  return items[Math.floor(random(holder) * items.length)]!;
}

/** Paylaşılabilir tohum kodlarını ("osman-1299" gibi) uint32'ye çevirir. */
export function seedFromString(text: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}
