import { getScenarioDefinition } from '@/content/scenarios';
import { formatDate } from '@/features/game/config/season-labels';
import type { SaveSlotRow } from '@/features/saves/components/save-slot-list';
import {
  SAVE_SLOTS,
  SLOT_LABELS,
  type SaveSummary,
} from '@/lib/saves/save-repository';

/** Her yuva için bir satır üretir; kaydı olmayanlar boş görünür. */
export function buildSlotRows(
  summaries: SaveSummary[],
  locale = 'tr-TR',
): SaveSlotRow[] {
  return SAVE_SLOTS.map((slot) => {
    const summary = summaries.find((s) => s.slot === slot);
    return {
      slot,
      label: SLOT_LABELS[slot],
      canSave: slot !== 'auto',
      summary: summary
        ? {
            title:
              getScenarioDefinition(summary.scenarioId)?.name ??
              summary.scenarioId,
            detail: `${formatDate(summary.date)} · Tur ${summary.turn} · ${new Date(
              summary.savedAt,
            ).toLocaleString(locale)}`,
          }
        : null,
    };
  });
}
