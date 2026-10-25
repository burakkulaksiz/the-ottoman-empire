import type { GameDate, Season } from '@/engine';

export const SEASON_LABELS: Record<Season, string> = {
  spring: 'İlkbahar',
  summer: 'Yaz',
  autumn: 'Sonbahar',
  winter: 'Kış',
};

export function formatDate(date: GameDate): string {
  return `${SEASON_LABELS[date.season]} ${date.year}`;
}
