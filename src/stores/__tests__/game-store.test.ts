import { createLocalEngine } from '@/workers/engine-client';

import { createGameStore } from '../game-store';

const newStore = () => createGameStore(createLocalEngine);

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
