import { loadScenario } from '@/content/scenarios';
import {
  createGame,
  dispatch,
  heuristicAi,
  validateSavedState,
  type Command,
  type DispatchResult,
  type GameState,
  type ScenarioSetup,
} from '@/engine';

/**
 * Motorun arayüze açtığı yüzey. Web Worker içinde Comlink ile, testlerde ve
 * Worker olmayan ortamlarda doğrudan çağrılır; ikisinde de aynı kod çalışır.
 *
 * Dünya (statik) ve güncel oyun durumu burada tutulur; arayüze her komuttan
 * sonra yeni durumun anlık görüntüsü döner.
 */
export interface EngineApi {
  /** Senaryoyu yükleyip yeni bir oyun başlatır. */
  start(scenarioId: string, seed: number): GameState;
  /** Kayıttan devam: senaryonun dünyasını yükler, durumu olduğu gibi alır. */
  load(scenarioId: string, state: GameState): void;
  /** Oyuncunun komutunu motora iletir. */
  dispatch(command: Command): DispatchResult;
}

export function createEngineApi(): EngineApi {
  let setup: ScenarioSetup | null = null;
  let state: GameState | null = null;

  return {
    start(scenarioId, seed) {
      setup = loadScenario(scenarioId);
      state = createGame(setup, { seed });
      return state;
    },

    load(scenarioId, loaded) {
      const next = loadScenario(scenarioId);
      const errors = validateSavedState(next.world, loaded);
      if (errors.length > 0) {
        throw new Error(`Kayıt bu sürümle uyumsuz: ${errors[0]}`);
      }
      setup = next;
      state = loaded;
    },

    dispatch(command) {
      if (!setup || !state) throw new Error('Engine has no running game');
      const result = dispatch(
        setup.world,
        state,
        state.playerFactionId,
        command,
        { ai: heuristicAi },
      );
      if (result.ok) state = result.state;
      return result;
    },
  };
}
