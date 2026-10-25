import { testScenario, testWorld } from 'testing/fixtures/test-scenario';

import { createGame, validateSetup } from '../create-game';
import { dispatch } from '../dispatch';
import { RULES } from '../rules';
import type { EventDef, GameState, World } from '../types';

const events: EventDef[] = [
  {
    id: 'by-date',
    trigger: { type: 'date', date: { year: 1300, season: 'summer' } },
    choices: [
      { id: 'fight', effects: [{ type: 'morale', amount: 15 }] },
      {
        id: 'pay',
        effects: [
          { type: 'treasury', amount: -4 },
          { type: 'morale', amount: -50 },
        ],
      },
    ],
  },
  {
    id: 'by-land',
    trigger: { type: 'ownsProvince', provinceId: 'bilecik' },
    choices: [{ id: 'ok', effects: [{ type: 'treasury', amount: 100 }] }],
  },
];

const world: World = { ...testWorld, events };
const start = () => createGame(testScenario, { seed: 1 });

function run(state: GameState, command: Parameters<typeof dispatch>[3]) {
  const result = dispatch(world, state, 'osmanli', command);
  if (!result.ok) throw new Error(result.error);
  return result;
}

describe('event cards', () => {
  it('start with nothing pending', () => {
    expect(start().events).toEqual({ fired: [], pending: [], choices: {} });
  });

  it('trigger when their date arrives, once', () => {
    const { state, log } = run(start(), { type: 'endTurn' });

    expect(state.events.pending).toEqual(['by-date']);
    expect(state.events.fired).toEqual(['by-date']);
    expect(log).toContainEqual({
      type: 'eventTriggered',
      eventId: 'by-date',
      turn: 2,
    });
  });

  it('block ending the turn until the player chooses', () => {
    const { state } = run(start(), { type: 'endTurn' });

    expect(dispatch(world, state, 'osmanli', { type: 'endTurn' })).toEqual({
      ok: false,
      error: 'eventPending',
    });
  });

  it('apply the effects of the chosen option and then let the game go on', () => {
    const pending = run(start(), { type: 'endTurn' }).state;
    const treasury = pending.factions.osmanli!.treasury;
    const { state, log } = run(pending, {
      type: 'chooseEvent',
      eventId: 'by-date',
      choiceId: 'pay',
    });

    expect(state.factions.osmanli?.treasury).toBe(treasury - 4);
    expect(state.armies['army-1']?.morale).toBe(
      RULES.moraleStart + RULES.moraleRecoveryHome - 50,
    );
    expect(state.events.pending).toEqual([]);
    expect(state.events.choices).toEqual({ 'by-date': 'pay' });
    expect(log).toContainEqual({
      type: 'eventResolved',
      eventId: 'by-date',
      choiceId: 'pay',
      turn: 2,
    });

    const next = run(state, { type: 'endTurn' }).state;
    expect(next.events.fired).toEqual(['by-date']);
    expect(next.turn).toBe(3);
  });

  it('only change the morale of the player armies and keep it in range', () => {
    const pending = run(start(), { type: 'endTurn' }).state;
    const { state } = run(pending, {
      type: 'chooseEvent',
      eventId: 'by-date',
      choiceId: 'fight',
    });

    expect(state.armies['army-1']?.morale).toBe(RULES.moraleMax);
    expect(state.armies['army-2']?.morale).toBe(
      pending.armies['army-2']?.morale,
    );
  });

  it('trigger when the player owns a province', () => {
    const base = start();
    const owning: GameState = {
      ...base,
      provinces: {
        ...base.provinces,
        bilecik: { id: 'bilecik', ownerId: 'osmanli' },
      },
    };
    const { state } = run(owning, { type: 'endTurn' });
    expect(state.events.pending).toEqual(['by-date', 'by-land']);
  });

  it.each([
    [{ eventId: 'by-land', choiceId: 'ok' }, 'noSuchPendingEvent'],
    [{ eventId: 'by-date', choiceId: 'nope' }, 'unknownChoice'],
  ] as const)('reject %o with %s', (args, error) => {
    const pending = run(start(), { type: 'endTurn' }).state;
    expect(
      dispatch(world, pending, 'osmanli', { type: 'chooseEvent', ...args }),
    ).toEqual({ ok: false, error });
  });

  it('can only be answered by the player', () => {
    const pending = run(start(), { type: 'endTurn' }).state;
    expect(
      dispatch(world, pending, 'bizans', {
        type: 'chooseEvent',
        eventId: 'by-date',
        choiceId: 'fight',
      }),
    ).toEqual({ ok: false, error: 'notPlayer' });
  });

  it('are validated together with the scenario', () => {
    const errors = validateSetup({
      ...testScenario,
      world: {
        ...testWorld,
        events: [
          {
            id: 'bad',
            trigger: { type: 'ownsProvince', provinceId: 'iznik' },
            choices: [],
          },
          {
            ...events[0]!,
            choices: [events[0]!.choices[0]!, events[0]!.choices[0]!],
          },
          { ...events[1]!, id: 'by-date' },
        ],
      },
    });
    expect(errors).toEqual([
      'Event "bad": unknown province "iznik"',
      'Event "bad": needs at least one choice',
      'Event "by-date": duplicate choice "fight"',
      'Event "by-date": duplicate id',
    ]);
  });
});
