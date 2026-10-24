import { z } from 'zod';

import { SEASONS } from '@/engine';

/**
 * Bir senaryonun içerik tanımı. Okunabilir olsun diye sahiplik devlet
 * altında listelenir; `buildScenario` bunu motorun `ScenarioSetup`ına çevirir.
 */
export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Senaryo seçim ekranında gösterilen kısa tarihî özet. */
  summary: z.string().min(1),
  startDate: z.object({
    year: z.number().int(),
    season: z.enum(SEASONS),
  }),
  playerFactionId: z.string().min(1),
  factions: z.record(
    z.string(),
    z.object({
      name: z.string().min(1),
      color: z.string().regex(/^#[0-9a-f]{6}$/i),
      treasury: z.number().int().nonnegative(),
      provinces: z.array(z.string()),
      armies: z
        .array(
          z.object({
            provinceId: z.string(),
            troops: z.number().int().positive(),
          }),
        )
        .default([]),
    }),
  ),
});

export type ScenarioDefinition = z.input<typeof scenarioSchema>;
