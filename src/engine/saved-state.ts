import type { GameState, World } from './types';

/**
 * Kayıttan yüklenen durumun bu sürümün dünyasıyla uyumlu olup olmadığını
 * denetler. Kayıt dosyaları dışarıdan (IndexedDB, ileride bulut) geldiği için
 * motor ona güvenmeden önce bakılır. Hata yoksa boş liste döner.
 */
export function validateSavedState(world: World, state: GameState): string[] {
  const errors: string[] = [];
  const record = state as Partial<GameState> | null;

  if (!record || typeof record !== 'object') return ['State is not an object'];
  if (record.version !== 1) {
    errors.push(`Unsupported save version "${String(record.version)}"`);
  }
  for (const key of [
    'provinces',
    'factions',
    'armies',
    'events',
    'date',
    'status',
  ] as const) {
    if (!record[key] || typeof record[key] !== 'object') {
      errors.push(`Missing "${key}"`);
    }
  }
  if (typeof record.turn !== 'number' || typeof record.rng !== 'number') {
    errors.push('Missing turn or rng');
  }
  if (errors.length > 0) return errors;

  for (const id of Object.keys(state.provinces)) {
    if (!world.provinces[id]) errors.push(`Unknown province "${id}"`);
  }
  for (const id of Object.keys(world.provinces)) {
    if (!state.provinces[id]) errors.push(`Province "${id}" missing in save`);
  }
  for (const id of Object.keys(state.factions)) {
    if (!world.factions[id]) errors.push(`Unknown faction "${id}"`);
  }
  for (const army of Object.values(state.armies)) {
    if (!world.provinces[army.provinceId]) {
      errors.push(`Army "${army.id}": unknown province "${army.provinceId}"`);
    }
  }
  if (!world.factions[state.playerFactionId]) {
    errors.push(`Unknown player faction "${state.playerFactionId}"`);
  }
  return errors;
}
