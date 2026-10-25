import { z } from 'zod';

import { SEASONS, UNIT_TYPES } from '@/engine';

/**
 * Bir senaryonun içerik tanımı. Okunabilir olsun diye sahiplik devlet
 * altında listelenir; `buildScenario` bunu motorun `ScenarioSetup`ına çevirir.
 */
const dateSchema = z.object({
  year: z.number().int(),
  season: z.enum(SEASONS),
});

const objectiveSchema = z.discriminatedUnion('type', [
  z.object({
    id: z.string().min(1),
    /** Oyuncuya gösterilen hedef metni. */
    title: z.string().min(1),
    type: z.literal('holdProvinces'),
    provinces: z.array(z.string()).min(1),
  }),
  z.object({
    id: z.string().min(1),
    title: z.string().min(1),
    type: z.literal('provinceCount'),
    count: z.number().int().positive(),
  }),
]);

const effectSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('treasury'), amount: z.number().int() }),
  z.object({ type: z.literal('morale'), amount: z.number().int() }),
]);

/** Tarihî olay kartı: motorun bildiği kısım (tetikleyici, etki) + metinler. */
const eventSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  trigger: z.discriminatedUnion('type', [
    z.object({ type: z.literal('date'), date: dateSchema }),
    z.object({ type: z.literal('ownsProvince'), provinceId: z.string() }),
  ]),
  choices: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        /** Seçimin oyundaki sonucunu anlatan metin. */
        outcome: z.string().min(1),
        effects: z.array(effectSchema).default([]),
      }),
    )
    .min(1),
  /** "Tarihte gerçekte ne oldu?" bölümü. */
  historical: z.object({
    note: z.string().min(1),
    /** Tarihte gerçekleşene en yakın seçenek (D2'de karşılaştırılır). */
    choiceId: z.string().min(1),
  }),
});

export type ScenarioEvent = z.input<typeof eventSchema>;

export const scenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  /** Senaryo seçim ekranında gösterilen kısa tarihî özet. */
  summary: z.string().min(1),
  startDate: dateSchema,
  /** Oyun bu tarihe gelince biter (zaman sınırı). */
  endDate: dateSchema.optional(),
  /** Hepsi tamamlanınca oyuncu kazanır; boşsa hayatta kalmak yeter. */
  objectives: z.array(objectiveSchema).default([]),
  events: z.array(eventSchema).default([]),
  /** Oyuncunun sonucunun kıyaslandığı tarihî sonuç. */
  historical: z
    .object({
      /** Tarihte endDate'te oyuncunun devletinin elindeki bölgeler. */
      provinces: z.array(z.string()).min(1),
      /** "Tarihte gerçekte ne oldu?" özeti. */
      note: z.string().min(1),
    })
    .optional(),
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
            units: z.partialRecord(
              z.enum(UNIT_TYPES),
              z.number().int().positive(),
            ),
          }),
        )
        .default([]),
    }),
  ),
});

export type ScenarioDefinition = z.input<typeof scenarioSchema>;
