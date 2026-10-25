import {
  createMemorySaveRepository,
  type SaveRepository,
} from '@/lib/saves/save-repository';
import { createLocalEngine } from '@/workers/engine-client';

import { createGameStore } from '../game-store';

const newStore = (saves: SaveRepository = createMemorySaveRepository()) =>
  createGameStore(createLocalEngine, saves);

describe('game store', () => {
  it('starts idle', () => {
    const state = newStore().getState();
    expect(state.status).toBe('idle');
    expect(state.game).toBeNull();
  });

  it('loads a scenario from the engine', async () => {
    const store = newStore();
    const loading = store.getState().start('kurulus-1299', { seed: 1 });
    expect(store.getState().status).toBe('loading');
    await loading;

    const { status, game, scenarioId } = store.getState();
    expect(status).toBe('ready');
    expect(scenarioId).toBe('kurulus-1299');
    expect(game?.date).toEqual({ year: 1299, season: 'spring' });
  });

  it('reports a scenario that cannot be loaded', async () => {
    const store = newStore();
    await store.getState().start('yok');

    expect(store.getState().status).toBe('error');
    expect(store.getState().loadError).toMatch(/Unknown scenario/);
    expect(store.getState().game).toBeNull();
  });

  it('applies commands and keeps the log of the last one', async () => {
    const store = newStore();
    await store.getState().start('kurulus-1299', { seed: 1 });
    await store.getState().send({ type: 'endTurn' });

    const { game, lastLog, commandError } = store.getState();
    expect(game?.date.season).toBe('summer');
    expect(lastLog.map((e) => e.type)).toContain('turnStarted');
    expect(commandError).toBeNull();
  });

  it('keeps the game and remembers why a command was rejected', async () => {
    const store = newStore();
    await store.getState().start('kurulus-1299', { seed: 1 });
    const before = store.getState().game;

    await store
      .getState()
      .send({ type: 'moveArmy', armyId: 'yok', to: 'tur-bursa' });

    expect(store.getState().commandError).toBe('unknownArmy');
    expect(store.getState().game).toBe(before);

    await store.getState().send({ type: 'endTurn' });
    expect(store.getState().commandError).toBeNull();
  });

  it('processes commands sent back to back in order', async () => {
    const store = newStore();
    await store.getState().start('kurulus-1299', { seed: 1 });

    await Promise.all([
      store.getState().send({ type: 'endTurn' }),
      store.getState().send({ type: 'endTurn' }),
      store.getState().send({ type: 'endTurn' }),
    ]);

    expect(store.getState().game?.turn).toBe(4);
  });

  it('starts a fresh game when started again', async () => {
    const store = newStore();
    await store.getState().start('kurulus-1299', { seed: 1 });
    await store.getState().send({ type: 'endTurn' });
    store.getState().selectProvince('tur-bursa');

    await store.getState().start('kurulus-1299', { seed: 1 });

    expect(store.getState().game?.turn).toBe(1);
    expect(store.getState().selectedProvinceId).toBeNull();
  });

  it('remembers the selected army', async () => {
    const store = newStore();
    await store.getState().start('kurulus-1299', { seed: 1 });
    store.getState().selectArmy('army-1');
    expect(store.getState().selectedArmyId).toBe('army-1');

    await store.getState().start('kurulus-1299', { seed: 1 });
    expect(store.getState().selectedArmyId).toBeNull();
  });

  it('remembers the selected province and can be reset', async () => {
    const store = newStore();
    await store.getState().start('kurulus-1299', { seed: 1 });
    store.getState().selectProvince('tur-bursa');
    expect(store.getState().selectedProvinceId).toBe('tur-bursa');

    store.getState().reset();
    expect(store.getState().status).toBe('idle');
    expect(store.getState().game).toBeNull();
  });
});

describe('saving and loading', () => {
  it('autosaves after every turn', async () => {
    const saves = createMemorySaveRepository();
    const store = newStore(saves);
    await store.getState().start('kurulus-1299', { seed: 1 });
    expect(await saves.list()).toEqual([]);

    await store.getState().send({ type: 'endTurn' });

    const auto = await saves.get('auto');
    expect(auto?.state).toEqual(store.getState().game);
    expect(auto?.turn).toBe(2);
    expect(store.getState().lastSave?.slot).toBe('auto');
  });

  it('does not autosave for commands that are not end of turn', async () => {
    const saves = createMemorySaveRepository();
    const store = newStore(saves);
    await store.getState().start('kurulus-1299', { seed: 1 });
    await store
      .getState()
      .send({ type: 'moveArmy', armyId: 'army-1', to: 'tur-bursa' });

    expect(await saves.list()).toEqual([]);
  });

  it('saves into a chosen slot', async () => {
    const saves = createMemorySaveRepository();
    const store = newStore(saves);
    await store.getState().start('kurulus-1299', { seed: 1 });
    await store.getState().save('slot-2');

    expect((await saves.get('slot-2'))?.state).toEqual(store.getState().game);
    expect(store.getState().lastSave?.slot).toBe('slot-2');
  });

  it('continues a saved game where it stopped', async () => {
    const saves = createMemorySaveRepository();
    const first = newStore(saves);
    await first.getState().start('kurulus-1299', { seed: 5 });
    await first.getState().send({ type: 'endTurn' });
    await first.getState().send({ type: 'endTurn' });
    await first.getState().save('slot-1');
    const saved = first.getState().game;

    // Yeni bir store (yeni oturum) kayıttan devam eder.
    const second = newStore(saves);
    await second.getState().load('slot-1');
    expect(second.getState().status).toBe('ready');
    expect(second.getState().game).toEqual(saved);

    // Motor yüklenen durumdan oynar; aynı komutlar aynı sonucu verir.
    await first.getState().send({ type: 'endTurn' });
    await second.getState().send({ type: 'endTurn' });
    expect(second.getState().game).toEqual(first.getState().game);
  });

  it('reports an empty slot', async () => {
    const store = newStore();
    await store.getState().load('slot-3');

    expect(store.getState().status).toBe('error');
    expect(store.getState().loadError).toBe('Bu yuvada kayıt yok.');
  });

  it('refuses a save that does not fit this version', async () => {
    const saves = createMemorySaveRepository();
    const source = newStore(saves);
    await source.getState().start('kurulus-1299', { seed: 1 });
    const game = source.getState().game!;
    await saves.put('slot-1', {
      ...game,
      provinces: { ...game.provinces, eski: { id: 'eski', ownerId: null } },
    });

    const store = newStore(saves);
    await store.getState().load('slot-1');

    expect(store.getState().status).toBe('error');
    expect(store.getState().loadError).toMatch(/uyumsuz/);
  });

  it('keeps playing when saving fails and says why', async () => {
    const broken: SaveRepository = {
      ...createMemorySaveRepository(),
      put: async () => {
        throw new Error('Depolama dolu');
      },
    };
    const store = newStore(broken);
    await store.getState().start('kurulus-1299', { seed: 1 });
    await store.getState().send({ type: 'endTurn' });

    expect(store.getState().game?.turn).toBe(2);
    expect(store.getState().saveError).toBe('Depolama dolu');
  });
});
