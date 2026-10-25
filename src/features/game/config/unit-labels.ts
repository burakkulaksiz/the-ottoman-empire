import type { UnitType, Units } from '@/engine';
import { UNIT_TYPES } from '@/engine';

export const UNIT_LABELS: Record<UnitType, string> = {
  akinci: 'Akıncı',
  sipahi: 'Sipahi',
  yaya: 'Yaya',
  yeniceri: 'Yeniçeri',
  topcu: 'Topçu',
};

/** "Sipahi 600 · Akıncı 400" gibi; birlik sırası sabittir. */
export function formatUnits(units: Units): string {
  return (
    UNIT_TYPES.filter((type) => (units[type] ?? 0) > 0)
      .map((type) => `${UNIT_LABELS[type]} ${units[type]}`)
      .join(' · ') || 'Birlik yok'
  );
}
