import { pick, random, randomInt, seedFromString } from '../rng';

describe('rng', () => {
  it('produces the same sequence for the same seed', () => {
    const a = { rng: 42 };
    const b = { rng: 42 };
    const seqA = Array.from({ length: 5 }, () => random(a));
    const seqB = Array.from({ length: 5 }, () => random(b));

    expect(seqA).toEqual(seqB);
    expect(a.rng).toBe(b.rng);
  });

  it('produces different sequences for different seeds', () => {
    expect(random({ rng: 1 })).not.toBe(random({ rng: 2 }));
  });

  it('stays within [0, 1)', () => {
    const holder = { rng: 7 };
    for (let i = 0; i < 1000; i++) {
      const value = random(holder);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('randomInt includes both bounds', () => {
    const holder = { rng: 3 };
    const seen = new Set<number>();
    for (let i = 0; i < 500; i++) seen.add(randomInt(holder, 1, 6));

    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6]);
  });

  it('pick throws on an empty list', () => {
    expect(() => pick({ rng: 1 }, [])).toThrow();
  });

  it('seedFromString is stable and spreads inputs', () => {
    expect(seedFromString('osman-1299')).toBe(seedFromString('osman-1299'));
    expect(seedFromString('osman-1299')).not.toBe(seedFromString('osman-1300'));
  });
});
