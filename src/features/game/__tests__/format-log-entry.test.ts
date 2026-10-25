import type { LogEntry } from '@/engine';

import { formatLogEntry, type LogNames } from '../lib/format-log-entry';

const names: LogNames = {
  province: (id) => `P:${id}`,
  faction: (id) => `F:${id}`,
  event: (id) => `E:${id}`,
};

const format = (entry: LogEntry) => formatLogEntry(entry, names);

describe('formatLogEntry', () => {
  it('writes the date of a new turn', () => {
    expect(
      format({
        type: 'turnStarted',
        date: { year: 1302, season: 'summer' },
        turn: 2,
      }),
    ).toBe('— Yaz 1302 —');
  });

  it('describes battles with the names of both sides and the losses', () => {
    expect(
      format({
        type: 'battleFought',
        provinceId: 'bursa',
        attackerId: 'osmanli',
        defenderId: 'bizans',
        winnerId: 'osmanli',
        attackerLosses: 120,
        defenderLosses: 480,
        turn: 3,
      }),
    ).toBe(
      'Savaş (P:bursa): F:osmanli saldırdı, F:osmanli kazandı — kayıp 120 / 480',
    );
  });

  it('describes conquest, sieges and events', () => {
    expect(
      format({
        type: 'provinceCaptured',
        provinceId: 'bursa',
        by: 'osmanli',
        from: 'bizans',
        turn: 1,
      }),
    ).toBe('P:bursa ele geçirildi (F:osmanli)');
    expect(
      format({
        type: 'siegeStarted',
        provinceId: 'bursa',
        attackerId: 'osmanli',
        turn: 1,
      }),
    ).toBe('P:bursa kuşatılıyor (F:osmanli)');
    expect(format({ type: 'eventTriggered', eventId: 'x', turn: 1 })).toBe(
      'Olay: E:x',
    );
  });

  it('hides noisy entries', () => {
    expect(
      format({
        type: 'incomeCollected',
        factionId: 'osmanli',
        amount: 3,
        turn: 1,
      }),
    ).toBeNull();
    expect(
      format({ type: 'eventResolved', eventId: 'x', choiceId: 'y', turn: 1 }),
    ).toBeNull();
  });
});
