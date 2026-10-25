import { createGame, type GameState } from '@/engine';

import {
  ACHIEVEMENTS,
  historicalChoicesOf,
  newlyEarned,
} from '../achievements';
import { ENTRIES } from '../encyclopedia/entries';
import { loadScenario, SCENARIOS } from '../scenarios';
import { formatCitation, getSource, SOURCES } from '../sources';

describe('sources', () => {
  it('have unique ids', () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('back every written encyclopedia entry with known sources', () => {
    for (const entry of ENTRIES) {
      expect(entry.sources.length, entry.id).toBeGreaterThan(0);
      for (const citation of entry.sources) {
        expect(
          getSource(citation.source),
          `${entry.id}: ${citation.source}`,
        ).toBeDefined();
      }
    }
  });

  it('back historical notes and the chronicle of every scenario', () => {
    for (const scenario of SCENARIOS) {
      for (const event of scenario.events ?? []) {
        expect(event.historical.sources?.length, event.id).toBeGreaterThan(0);
        for (const c of event.historical.sources ?? []) {
          expect(getSource(c.source)).toBeDefined();
        }
      }
      for (const item of scenario.chronicle ?? []) {
        expect(item.sources?.length, `${item.year}`).toBeGreaterThan(0);
        for (const c of item.sources ?? []) {
          expect(getSource(c.source)).toBeDefined();
        }
      }
    }
  });

  it('format citations with the part that is cited', () => {
    expect(
      formatCitation({ source: 'tdv-ia', locator: '“Tımar” maddesi' }),
    ).toBe('Türkiye Diyanet Vakfı, TDV İslâm Ansiklopedisi (“Tımar” maddesi)');
    expect(formatCitation({ source: 'pachymeres' })).toBe(
      'Georgios Pachymeres, Syngraphikai Historiai (Tarih)',
    );
    expect(formatCitation({ source: 'yok' })).toBe('yok');
  });
});

describe('achievements', () => {
  const setup = loadScenario('kurulus-1299');
  const start = (): GameState => createGame(setup, { seed: 1 });

  it('have unique ids, a title and a description', () => {
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      expect(a.title.length).toBeGreaterThan(0);
      expect(a.description.length).toBeGreaterThan(0);
    }
  });

  it('are not earned at the start of a game', () => {
    expect(newlyEarned(start(), new Set())).toEqual([]);
  });

  it('know which choices history made', () => {
    expect(historicalChoicesOf('kurulus-1299')).toEqual({
      koyunhisar: 'savas',
      'bursa-dususu': 'koru',
    });
  });

  it('reward deciding as history did, once, and faithfully twice', () => {
    const base = start();
    const one: GameState = {
      ...base,
      events: { ...base.events, choices: { koyunhisar: 'savas' } },
    };
    expect(newlyEarned(one, new Set()).map((a) => a.id)).toEqual([
      'tarihin-izinde',
    ]);

    const both: GameState = {
      ...base,
      events: {
        ...base.events,
        choices: { koyunhisar: 'savas', 'bursa-dususu': 'koru' },
      },
    };
    expect(
      newlyEarned(both, new Set(['tarihin-izinde'])).map((a) => a.id),
    ).toEqual(['tarihe-sadik']);

    const mixed: GameState = {
      ...base,
      events: {
        ...base.events,
        choices: { koyunhisar: 'savas', 'bursa-dususu': 'yagma' },
      },
    };
    expect(newlyEarned(mixed, new Set()).map((a) => a.id)).not.toContain(
      'tarihe-sadik',
    );
  });

  it('reward taking Bursa and a victory with a better result than history', () => {
    const base = start();
    const won: GameState = {
      ...base,
      provinces: {
        ...base.provinces,
        'tur-bursa': { id: 'tur-bursa', ownerId: 'osmanli' },
      },
      status: {
        phase: 'ended',
        result: 'victory',
        reason: 'objectives',
        score: { provinces: 5, benchmark: 3, points: 167, verdict: 'better' },
      },
    };
    expect(newlyEarned(won, new Set()).map((a) => a.id)).toEqual(
      expect.arrayContaining(['bursa', 'zafer', 'tarihten-iyi']),
    );
  });

  it('skip what is already known', () => {
    const base = start();
    const vizier: GameState = {
      ...base,
      court: {
        ...base.court!,
        vizier: {
          id: 'v',
          name: 'Halil',
          born: 1260,
          military: 1,
          administration: 5,
        },
      },
    };
    expect(newlyEarned(vizier, new Set()).map((a) => a.id)).toEqual(['vezir']);
    expect(newlyEarned(vizier, new Set(['vezir']))).toEqual([]);
  });
});
