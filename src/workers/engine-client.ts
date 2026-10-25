import { wrap, type Remote } from 'comlink';

import { createEngineApi, type EngineApi } from './engine-api';

/** Motora asenkron erişim; Worker'da da, aynı iş parçacığında da aynı biçim. */
export type EngineClient = Remote<EngineApi>;

/** Motoru aynı iş parçacığında çalıştırır (test ve Worker olmayan ortamlar). */
export function createLocalEngine(): EngineClient {
  const api = createEngineApi();
  return {
    start: async (...args) => api.start(...args),
    load: async (...args) => api.load(...args),
    dispatch: async (...args) => api.dispatch(...args),
  } as EngineClient;
}

/** Motoru bir Web Worker'da çalıştırır. */
export function createWorkerEngine(): EngineClient {
  const worker = new Worker(new URL('./engine.worker.ts', import.meta.url), {
    type: 'module',
  });
  return wrap<EngineApi>(worker);
}

/** Tarayıcıda Worker, başka yerde yerel motor. */
export function createDefaultEngine(): EngineClient {
  return typeof Worker === 'undefined'
    ? createLocalEngine()
    : createWorkerEngine();
}
