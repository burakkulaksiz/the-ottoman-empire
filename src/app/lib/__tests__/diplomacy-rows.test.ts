import { loadScenario } from '@/content/scenarios';
import { createGame, dispatch, RULES, type GameState } from '@/engine';

import {
  buildDiplomacyRows,
  buildOffers,
  diplomacyCommand,
  TRIBUTE_OFFER,
} from '../diplomacy-rows';

const setup = loadScenario('kurulus-1299');
const start = () => createGame(setup, { seed: 1 });

describe('buildDiplomacyRows', () => {
  it('lists every other living state with its relation', () => {
    const rows = buildDiplomacyRows(setup.world, start());

    expect(rows.map((r) => r.id)).not.toContain('osmanli');
    expect(rows.find((r) => r.id === 'bizans')).toMatchObject({
      name: 'Bizans İmparatorluğu',
      relation: 'war',
    });
    expect(rows.find((r) => r.id === 'germiyan')?.relation).toBe('peace');
  });

  it('offers peace in war and alliance or war in peace', () => {
    const rows = buildDiplomacyRows(setup.world, start());

    expect(
      rows.find((r) => r.id === 'bizans')?.actions.map((a) => a.id),
    ).toEqual(['peace', 'peace-pay', 'peace-demand']);
    expect(
      rows.find((r) => r.id === 'germiyan')?.actions.map((a) => a.id),
    ).toEqual(['alliance', 'war']);
  });

  it('explains why an action cannot be taken', () => {
    const state = start();
    const poor: GameState = {
      ...state,
      factions: {
        ...state.factions,
        osmanli: { ...state.factions.osmanli!, treasury: RULES.dowry - 1 },
      },
    };
    const alliance = buildDiplomacyRows(setup.world, poor)
      .find((r) => r.id === 'germiyan')
      ?.actions.find((a) => a.id === 'alliance');
    expect(alliance?.disabledReason).toBe('Yeterli akçe yok');
  });

  it('notes tributes the player pays or receives', () => {
    const state = start();
    const paying: GameState = {
      ...state,
      diplomacy: {
        ...state.diplomacy,
        tributes: [
          { payer: 'osmanli', receiver: 'germiyan', amount: 3 },
          { payer: 'karesi', receiver: 'osmanli', amount: 2 },
        ],
      },
    };
    const rows = buildDiplomacyRows(setup.world, paying);
    expect(rows.find((r) => r.id === 'germiyan')?.note).toBe(
      'Her tur 3 akçe haraç ödüyorsun.',
    );
    expect(rows.find((r) => r.id === 'karesi')?.note).toBe(
      'Her tur 2 akçe haraç alıyorsun.',
    );
  });
});

describe('diplomacyCommand', () => {
  it('turns panel actions into engine commands', () => {
    expect(diplomacyCommand('bizans', 'peace-pay')).toEqual({
      type: 'proposePeace',
      target: 'bizans',
      tribute: TRIBUTE_OFFER,
    });
    expect(diplomacyCommand('bizans', 'peace-demand')).toEqual({
      type: 'proposePeace',
      target: 'bizans',
      tribute: -TRIBUTE_OFFER,
    });
    expect(diplomacyCommand('germiyan', 'war')).toEqual({
      type: 'declareWar',
      target: 'germiyan',
    });
    expect(diplomacyCommand('germiyan', 'yok')).toBeNull();
  });
});

describe('buildOffers', () => {
  it('describes the offers of other states with their terms', () => {
    const result = dispatch(setup.world, start(), 'bizans', {
      type: 'proposePeace',
      target: 'osmanli',
      tribute: 4,
    });
    if (!result.ok) throw new Error(result.error);

    expect(buildOffers(setup.world, result.state)).toEqual([
      {
        id: result.state.diplomacy.offers[0]!.id,
        text: 'Bizans İmparatorluğu barış teklif ediyor; her tur sana 4 akçe haraç ödeyecek.',
      },
    ]);
  });
});
