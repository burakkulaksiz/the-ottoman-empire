import type { Difficulty, GameSettings } from '@/engine';

export const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: 'Kolay',
  normal: 'Normal',
  hard: 'Zor',
};

export const DIFFICULTY_HINTS: Record<Difficulty, string> = {
  easy: 'Daha çok gelir; temkinli ve yavaş büyüyen rakipler.',
  normal: 'Dengeli.',
  hard: 'Daha az gelir; atak, çok devşiren ve savaş açmaya hevesli rakipler.',
};

export const HISTORICAL_MODE_HINT =
  'Rakipler kendiliğinden savaş açmaz ve saldırmaz, yalnızca kendini savunur; olay kartlarında tarihte seçilen seçenek gösterilir. Öğrenmeye odaklı oynanış.';

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
export function settingsLabel(settings: GameSettings): string {
  return [
    DIFFICULTY_LABELS[settings.difficulty],
    settings.historicalMode ? 'Tarihe sadık' : null,
  ]
    .filter(Boolean)
    .join(' · ');
}
