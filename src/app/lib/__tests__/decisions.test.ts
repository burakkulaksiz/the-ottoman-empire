import { kurulus1299 } from '@/content/scenarios/kurulus-1299';

import { summarizeDecisions } from '../decisions';

const events = kurulus1299.events ?? [];

describe('summarizeDecisions', () => {
  it('has nothing to say before any decision', () => {
    expect(summarizeDecisions(events, {})).toEqual({
      rows: [],
      matched: 0,
      total: 0,
    });
  });

  it('marks a decision that matches history', () => {
    const summary = summarizeDecisions(events, { koyunhisar: 'savas' });

    expect(summary.total).toBe(1);
    expect(summary.matched).toBe(1);
    expect(summary.rows[0]).toMatchObject({
      eventId: 'koyunhisar',
      title: 'Koyunhisar Savaşı',
      choice: 'Meydanda karşıla',
      historicalChoice: 'Meydanda karşıla',
      matched: true,
    });
  });

  it('shows what history chose when the player chose otherwise', () => {
    const summary = summarizeDecisions(events, { 'bursa-dususu': 'yagma' });

    expect(summary.matched).toBe(0);
    expect(summary.rows[0]).toMatchObject({
      choice: 'Askerlere yağma izni ver',
      historicalChoice: 'Halka aman ver, şehri beyliğin merkezi yap',
      matched: false,
    });
  });

  it('keeps the order of the scenario and ignores unknown decisions', () => {
    const summary = summarizeDecisions(events, {
      'bursa-dususu': 'koru',
      koyunhisar: 'cekil',
      bilinmeyen: 'x',
    });

    expect(summary.rows.map((r) => r.eventId)).toEqual([
      'koyunhisar',
      'bursa-dususu',
    ]);
    expect([summary.matched, summary.total]).toEqual([1, 2]);
  });
});
