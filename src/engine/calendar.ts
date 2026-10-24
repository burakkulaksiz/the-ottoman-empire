export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export type Season = (typeof SEASONS)[number];

/** Her tur bir mevsimdir. */
export interface GameDate {
  year: number;
  season: Season;
}

export function nextDate(date: GameDate): GameDate {
  const index = SEASONS.indexOf(date.season);
  if (index === SEASONS.length - 1) {
    return { year: date.year + 1, season: SEASONS[0] };
  }
  return { year: date.year, season: SEASONS[index + 1]! };
}

export function compareDates(a: GameDate, b: GameDate): number {
  return (
    a.year - b.year || SEASONS.indexOf(a.season) - SEASONS.indexOf(b.season)
  );
}
