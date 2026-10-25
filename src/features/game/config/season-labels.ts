import type { GameDate, Season } from '@/engine';
import { tTr, type Translate } from '@/lib/i18n';

/** Mevsimin adı (çevrilmiş). */
export function seasonLabel(season: Season, t: Translate = tTr): string {
  return t(`seasons.${season}`);
}

/** "İlkbahar 1299" / "Spring 1299". */
export function formatDate(date: GameDate, t: Translate = tTr): string {
  return `${seasonLabel(date.season, t)} ${date.year}`;
}
