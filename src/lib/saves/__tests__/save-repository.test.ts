import 'fake-indexeddb/auto';

import { loadScenario } from '@/content/scenarios';
import { createGame } from '@/engine';

import {
  createIndexedDbSaveRepository,
  createMemorySaveRepository,
  isSaveSlot,
  SAVE_SLOTS,
  type SaveRepository,
} from '../save-repository';

const game = (seed: number) =>
  createGame(loadScenario('kurulus-1299'), { seed });

describe.each([
  ['IndexedDB', () => createIndexedDbSaveRepository(`test-${Math.random()}`)],
  ['memory', () => createMemorySaveRepository()],
] as const)('%s save repository', (_name, create) => {
  let repo: SaveRepository;
  beforeEach(() => {
    repo = create();
  });

  it('starts empty', async () => {
    expect(await repo.list()).toEqual([]);
    expect(await repo.get('slot-1')).toBeNull();
  });

  it('stores a game and gives it back unchanged', async () => {
    const state = game(1);
    await repo.put('slot-1', state, 1000);

    const record = await repo.get('slot-1');
    expect(record?.state).toEqual(state);
    expect(record).toMatchObject({
      slot: 'slot-1',
      scenarioId: 'kurulus-1299',
      turn: 1,
      date: { year: 1299, season: 'spring' },
      savedAt: 1000,
    });
  });

  it('lists summaries without the game state, in slot order', async () => {
    await repo.put('slot-2', game(1));
    await repo.put('auto', game(2));

    const list = await repo.list();
    expect(list.map((s) => s.slot)).toEqual(['auto', 'slot-2']);
    expect(list[0]).not.toHaveProperty('state');
  });

  it('overwrites a slot and removes it', async () => {
    await repo.put('slot-1', game(1), 1);
    await repo.put('slot-1', game(2), 2);
    expect(await repo.list()).toHaveLength(1);
    expect((await repo.get('slot-1'))?.state.seed).toBe(2);

    await repo.remove('slot-1');
    expect(await repo.get('slot-1')).toBeNull();
  });
});

describe('slots', () => {
  it('recognises valid slot ids only', () => {
    for (const slot of SAVE_SLOTS) expect(isSaveSlot(slot)).toBe(true);
    expect(isSaveSlot('slot-9')).toBe(false);
    expect(isSaveSlot(null)).toBe(false);
  });
});
