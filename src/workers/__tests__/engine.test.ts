import { expose, wrap } from 'comlink';

import { createEngineApi, type EngineApi } from '../engine-api';
import { createLocalEngine } from '../engine-client';

describe('engine api', () => {
  it('starts a scenario and plays commands on the running game', () => {
    const api = createEngineApi();
    const state = api.start('kurulus-1299', 1);

    expect(state.scenarioId).toBe('kurulus-1299');
    expect(state.date).toEqual({ year: 1299, season: 'spring' });

    const result = api.dispatch({ type: 'endTurn' });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.state.date.season).toBe('summer');

    // Bir sonraki komut yeni durumdan devam eder.
    const second = api.dispatch({ type: 'endTurn' });
    expect(second.ok && second.state.date.season).toBe('autumn');
  });

  it('reports rejected commands without changing the game', () => {
    const api = createEngineApi();
    api.start('kurulus-1299', 1);

    expect(
      api.dispatch({ type: 'moveArmy', armyId: 'yok', to: 'tur-bursa' }),
    ).toEqual({ ok: false, error: 'unknownArmy' });
    const result = api.dispatch({ type: 'endTurn' });
    expect(result.ok && result.state.turn).toBe(2);
  });

  it('refuses commands before a game exists and unknown scenarios', () => {
    const api = createEngineApi();
    expect(() => api.dispatch({ type: 'endTurn' })).toThrow(/no running game/);
    expect(() => api.start('yok', 1)).toThrow(/Unknown scenario/);
  });

  it('continues a loaded game', () => {
    const first = createEngineApi();
    const started = first.start('kurulus-1299', 7);
    const advanced = first.dispatch({ type: 'endTurn' });
    if (!advanced.ok) throw new Error(advanced.error);

    const second = createEngineApi();
    second.load('kurulus-1299', advanced.state);
    const next = second.dispatch({ type: 'endTurn' });
    expect(next.ok && next.state.turn).toBe(started.turn + 2);
  });

  it('is deterministic for the same seed', () => {
    const play = () => {
      const api = createEngineApi();
      api.start('kurulus-1299', 42);
      for (let i = 0; i < 6; i++) api.dispatch({ type: 'endTurn' });
      const last = api.dispatch({ type: 'endTurn' });
      return last.ok ? last.state : null;
    };
    expect(play()).toEqual(play());
  });
});

describe('engine client', () => {
  it('local engine answers like the api, asynchronously', async () => {
    const engine = createLocalEngine();
    const state = await engine.start('kurulus-1299', 1);
    const result = await engine.dispatch({ type: 'endTurn' });

    expect(state.turn).toBe(1);
    expect(result.ok && result.state.turn).toBe(2);
  });

  it('works through Comlink and structured clone like the Web Worker does', async () => {
    // Worker'daki iletişimin aynısı: iki uç arasında MessagePort.
    const { port1, port2 } = new MessageChannel();
    expose(createEngineApi(), port1);
    const remote = wrap<EngineApi>(port2);

    try {
      const state = await remote.start('kurulus-1299', 1);
      const result = await remote.dispatch({ type: 'endTurn' });
      const local = createEngineApi();
      local.start('kurulus-1299', 1);

      expect(state).toEqual(local.start('kurulus-1299', 1));
      expect(result).toEqual(local.dispatch({ type: 'endTurn' }));
    } finally {
      port1.close();
      port2.close();
    }
  });
});
