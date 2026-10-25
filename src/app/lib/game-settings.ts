import type { Difficulty, GameSettings } from '@/engine';
import { tTr, type Translate } from '@/lib/i18n';

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** Adres satırındaki `?difficulty=hard&historical=1` ayarlarını okur. */
export function settingsFromSearch(params: URLSearchParams): GameSettings {
  const raw = params.get('difficulty');
  const difficulty = DIFFICULTIES.includes(raw as Difficulty)
    ? (raw as Difficulty)
    : 'normal';
  return { difficulty, historicalMode: params.get('historical') === '1' };
}

/** Ayarları oyun adresinin sorgu kısmına çevirir (varsayılanlar yazılmaz). */
export function settingsToSearch(settings: GameSettings): string {
  const params = new URLSearchParams();
  if (settings.difficulty !== 'normal') {
    params.set('difficulty', settings.difficulty);
  }
  if (settings.historicalMode) params.set('historical', '1');
  const query = params.toString();
  return query ? `?${query}` : '';
}

/** Üst çubukta gösterilen kısa ayar etiketi. */
export function settingsLabel(
  settings: GameSettings,
  t: Translate = tTr,
): string {
  return [
    t(`difficulty.${settings.difficulty}`),
    settings.historicalMode ? t('difficulty.historicalShort') : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
