import { loadScenario } from '@/content/scenarios';
import { ogretici1299 } from '@/content/scenarios/ogretici-1299';
import { createGame, dispatch, type GameState } from '@/engine';

import { NO_TUTORIAL_FLAGS, tutorialProgress } from '../tutorial';

const setup = loadScenario('ogretici-1299');
const steps = ogretici1299.tutorial!;
const start = () => createGame(setup, { seed: 1 });

function play(state: GameState, command: Parameters<typeof dispatch>[3]) {
  const result = dispatch(setup.world, state, 'osmanli', command);
  if (!result.ok) throw new Error(result.error);
  return result.state;
}

describe('tutorialProgress', () => {
  it('starts at the first step with nothing done', () => {
    const progress = tutorialProgress(steps, start(), NO_TUTORIAL_FLAGS);
    expect(progress.doneCount).toBe(0);
    expect(progress.current?.id).toBe('army');
  });

  it('follows what the player does in the game and in the interface', () => {
    let state = play(start(), {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'tur-sakarya',
    });
    state = play(state, {
      type: 'recruit',
      provinceId: 'tur-eskisehir',
      unit: 'akinci',
    });
    state = play(state, { type: 'endTurn' });

    const progress = tutorialProgress(steps, state, {
      armySelected: true,
      encyclopediaOpened: true,
      chronicleOpened: false,
    });
    expect(progress.steps.filter((s) => s.done).map((s) => s.id)).toEqual([
      'army',
      'sakarya',
      'recruit',
      'turn',
      'encyclopedia',
    ]);
    expect(progress.current?.id).toBe('chronicle');
  });

  it('is finished when every step is done', () => {
    const base = start();
    const done: GameState = {
      ...base,
      turn: 9,
      provinces: {
        ...base.provinces,
        'tur-sakarya': { id: 'tur-sakarya', ownerId: 'osmanli' },
        'tur-bursa': { id: 'tur-bursa', ownerId: 'osmanli' },
      },
      log: [
        {
          type: 'recruited',
          factionId: 'osmanli',
          provinceId: 'tur-bilecik',
          unit: 'akinci',
          amount: 100,
          cost: 4,
          turn: 1,
        },
      ],
    };
    const progress = tutorialProgress(steps, done, {
      armySelected: true,
      encyclopediaOpened: true,
      chronicleOpened: true,
    });
    expect(progress.current).toBeNull();
    expect(progress.doneCount).toBe(steps.length);
  });
});

describe('tutorial scenario', () => {
  it('lets the player take Bursa with the starting army', () => {
    let state = start();
    state = play(state, {
      type: 'moveArmy',
      armyId: 'army-1',
      to: 'tur-bursa',
    });
    for (
      let i = 0;
      i < 6 && state.provinces['tur-bursa']?.ownerId !== 'osmanli';
      i++
    ) {
      state = play(state, { type: 'endTurn' });
    }
    expect(state.provinces['tur-bursa']?.ownerId).toBe('osmanli');
  });
});
