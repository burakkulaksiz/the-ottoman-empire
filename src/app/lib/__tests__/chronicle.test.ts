import { loadScenario } from '@/content/scenarios';
import { kurulus1299 } from '@/content/scenarios/kurulus-1299';
import { createGame, dispatch, type GameState, type LogEntry } from '@/engine';

import { buildChronicle, dateOfTurn } from '../chronicle';

const names = {
  province: (id: string) => `P:${id}`,
  faction: (id: string) => `F:${id}`,
  event: (id: string) => `E:${id}`,
};

const setup = loadScenario('kurulus-1299');

function at(year: number, log: LogEntry[] = []): GameState {
  const base = createGame(setup, { seed: 1 });
  return { ...base, date: { year, season: 'spring' }, log };
}

describe('dateOfTurn', () => {
  it('counts one season per turn from the start', () => {
    const start = { year: 1299, season: 'spring' } as const;
    expect(dateOfTurn(start, 1)).toEqual(start);
    expect(dateOfTurn(start, 2)).toEqual({ year: 1299, season: 'summer' });
    expect(dateOfTurn(start, 5)).toEqual({ year: 1300, season: 'spring' });
  });
});

describe('buildChronicle', () => {
  it('only shows real history up to the year reached in the game', () => {
    const rows = buildChronicle(at(1302), kurulus1299, names);
    const years = rows.filter((r) => r.history.length > 0).map((r) => r.year);
    expect(years).toEqual([1299, 1302]);
    expect(rows.find((r) => r.year === 1302)?.history[0]?.date).toBe(
      'Temmuz 1302',
    );
  });

  it('records what the player did, by year, next to history', () => {
    // 13. tur = 1302 ilkbahar.
    const log: LogEntry[] = [
      {
        type: 'provinceCaptured',
        provinceId: 'tur-bursa',
        by: 'osmanli',
        from: 'bizans',
        turn: 13,
      },
      {
        type: 'battleFought',
        provinceId: 'tur-kocaeli',
        attackerId: 'osmanli',
        defenderId: 'bizans',
        winnerId: 'bizans',
        attackerLosses: 1,
        defenderLosses: 1,
        turn: 13,
      },
      {
        type: 'eventResolved',
        eventId: 'koyunhisar',
        choiceId: 'savas',
        turn: 14,
      },
    ];
    const row = buildChronicle(at(1302, log), kurulus1299, names).find(
      (r) => r.year === 1302,
    );

    expect(row?.played.map((p) => p.text)).toEqual([
      'P:tur-bursa ele geçirildi.',
      'P:tur-kocaeli savaşı kaybedildi.',
      'Koyunhisar Savaşı: Meydanda karşıla.',
    ]);
    expect(row?.played[0]?.date).toBe('İlkbahar 1302');
    expect(row?.history).toHaveLength(1);
  });

  it('leaves out what other states did among themselves', () => {
    const log: LogEntry[] = [
      {
        type: 'provinceCaptured',
        provinceId: 'tur-mugla',
        by: 'karaman',
        from: 'mentese',
        turn: 2,
      },
      { type: 'warDeclared', by: 'karaman', target: 'hamid', turn: 2 },
    ];
    const rows = buildChronicle(at(1299, log), kurulus1299, names);
    expect(rows.flatMap((r) => r.played)).toEqual([]);
  });

  it('works with a real game log', () => {
    let state = createGame(setup, { seed: 3 });
    const result = dispatch(setup.world, state, 'osmanli', {
      type: 'declareWar',
      target: 'germiyan',
    });
    if (!result.ok) throw new Error(result.error);
    state = result.state;

    const rows = buildChronicle(state, kurulus1299, names);
    expect(rows[0]?.played.map((p) => p.text)).toContain(
      'F:germiyan devletine savaş ilan edildi.',
    );
  });
});
