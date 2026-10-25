import type { SaveSummary } from '@/lib/saves/save-repository';

import { buildSlotRows } from '../slot-rows';

const summary = (slot: SaveSummary['slot']): SaveSummary => ({
  slot,
  scenarioId: 'kurulus-1299',
  turn: 8,
  date: { year: 1300, season: 'winter' },
  savedAt: Date.UTC(2026, 9, 25, 12, 0),
});

describe('buildSlotRows', () => {
  it('always lists every slot and leaves unused ones empty', () => {
    const rows = buildSlotRows([summary('slot-2')]);

    expect(rows.map((r) => r.slot)).toEqual([
      'auto',
      'slot-1',
      'slot-2',
      'slot-3',
    ]);
    expect(rows.map((r) => r.summary === null)).toEqual([
      true,
      true,
      false,
      true,
    ]);
  });

  it('describes a save with scenario, date and turn', () => {
    const [, , filled] = buildSlotRows([summary('slot-2')]);

    expect(filled?.summary?.title).toBe('1299 · Kuruluş');
    expect(filled?.summary?.detail).toContain('Kış 1300 · Tur 8');
  });

  it('does not allow manual saves into the automatic slot', () => {
    const rows = buildSlotRows([]);
    expect(rows.find((r) => r.slot === 'auto')?.canSave).toBe(false);
    expect(rows.find((r) => r.slot === 'slot-1')?.canSave).toBe(true);
  });

  it('falls back to the scenario id for unknown scenarios', () => {
    const [auto] = buildSlotRows([{ ...summary('auto'), scenarioId: 'eski' }]);
    expect(auto?.summary?.title).toBe('eski');
  });
});
