import type { UnitType, Units } from '@/engine';
import { UNIT_TYPES } from '@/engine';
import { tTr, type Translate } from '@/lib/i18n';

export function unitLabel(unit: UnitType, t: Translate = tTr): string {
  return t(`units.${unit}`);
}

/** "Akıncı 400 · Sipahi 600" gibi; birlik sırası sabittir. */
export function formatUnits(units: Units, t: Translate = tTr): string {
  return (
    UNIT_TYPES.filter((type) => (units[type] ?? 0) > 0)
      .map((type) => `${unitLabel(type, t)} ${units[type]}`)
      .join(' · ') || t('army.noUnits')
  );
}
