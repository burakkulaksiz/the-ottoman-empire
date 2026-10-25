import type { ScenarioEvent } from '@/content/scenarios/scenario-schema';

/** Karar defterindeki bir satır: oyuncunun seçimi ve tarihle karşılaştırması. */
export interface DecisionRow {
  eventId: string;
  title: string;
  /** Oyuncunun seçtiği seçeneğin metni. */
  choice: string;
  /** Tarihte gerçekleşene en yakın seçeneğin metni. */
  historicalChoice: string;
  /** Oyuncu tarihteki gibi mi karar verdi? */
  matched: boolean;
}

export interface DecisionSummary {
  rows: DecisionRow[];
  matched: number;
  total: number;
}

/**
 * Verilen kararları (olay → seçenek) senaryodaki tarihî seçimlerle kıyaslar.
 * Satırlar senaryodaki olay sırasındadır; henüz karar verilmemişler yer almaz.
 */
export function summarizeDecisions(
  events: readonly ScenarioEvent[],
  choices: Readonly<Record<string, string>>,
): DecisionSummary {
  const rows = events.flatMap((event): DecisionRow[] => {
    const chosenId = choices[event.id];
    const chosen = event.choices.find((c) => c.id === chosenId);
    if (!chosen) return [];
    const historical = event.choices.find(
      (c) => c.id === event.historical.choiceId,
    );
    return [
      {
        eventId: event.id,
        title: event.title,
        choice: chosen.label,
        historicalChoice: historical?.label ?? '',
        matched: chosen.id === event.historical.choiceId,
      },
    ];
  });

  return {
    rows,
    matched: rows.filter((r) => r.matched).length,
    total: rows.length,
  };
}
