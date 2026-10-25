import { getScenarioDefinition } from '@/content/scenarios';
import { formatDate } from '@/features/game/config/season-labels';
import type { SaveSlotRow } from '@/features/saves/components/save-slot-list';
import { tTr, type Translate } from '@/lib/i18n';
import {
  SAVE_SLOTS,
  type SaveSlotId,
  type SaveSummary,
} from '@/lib/saves/save-repository';

/** "Otomatik kayıt", "Yuva 1" … (çevrilmiş). */
export function slotLabel(slot: SaveSlotId, t: Translate = tTr): string {
  return slot === 'auto'
    ? t('saves.slotAuto')
    : t('saves.slot', { n: slot.replace('slot-', '') });
}

/** Her yuva için bir satır üretir; kaydı olmayanlar boş görünür. */
export function buildSlotRows(
  summaries: SaveSummary[],
  t: Translate = tTr,
  locale = 'tr-TR',
): SaveSlotRow[] {
  return SAVE_SLOTS.map((slot) => {
    const summary = summaries.find((s) => s.slot === slot);
    return {
      slot,
      label: slotLabel(slot, t),
      canSave: slot !== 'auto',
      summary: summary
        ? {
            title:
              getScenarioDefinition(summary.scenarioId)?.name ??
              summary.scenarioId,
            detail: t('saves.detail', {
              date: formatDate(summary.date, t),
              turn: summary.turn,
              savedAt: new Date(summary.savedAt).toLocaleString(locale),
            }),
          }
        : null,
    };
  });
}
