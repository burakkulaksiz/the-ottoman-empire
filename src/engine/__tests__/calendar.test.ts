import { compareDates, nextDate } from '../calendar';

describe('calendar', () => {
  it('advances season by season and wraps into the next year', () => {
    expect(nextDate({ year: 1453, season: 'spring' })).toEqual({
      year: 1453,
      season: 'summer',
    });
    expect(nextDate({ year: 1453, season: 'winter' })).toEqual({
      year: 1454,
      season: 'spring',
    });
  });

  it('compares dates chronologically', () => {
    const fall = { year: 1453, season: 'autumn' } as const;
    const spring = { year: 1454, season: 'spring' } as const;

    expect(compareDates(fall, spring)).toBeLessThan(0);
    expect(compareDates(spring, fall)).toBeGreaterThan(0);
    expect(compareDates(fall, { ...fall })).toBe(0);
  });
});
