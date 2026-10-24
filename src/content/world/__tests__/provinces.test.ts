import { validateWorld } from '@/engine';

import { createProvinceDefs, PROVINCE_META } from '../provinces';

describe('province data', () => {
  const provinces = createProvinceDefs();

  it('forms a consistent, symmetric adjacency graph', () => {
    expect(validateWorld({ provinces, factions: {} })).toEqual([]);
  });

  it('knows real neighbours across modern country borders', () => {
    const edirne = provinces['tur-edirne'];
    expect(edirne?.neighbors).toContain('tur-kirklareli');
    expect(edirne?.neighbors).toContain('bgr-yambol');
  });

  it('does not make provinces separated by sea adjacent by themselves', () => {
    expect(provinces['tur-istanbul']?.neighbors).not.toContain('tur-canakkale');
  });

  it('merges over-fine countries into a single province', () => {
    expect(PROVINCE_META['mkd']?.name).toBe('Makedonya');
    expect(PROVINCE_META['kos']?.country).toBe('Kosova');
  });

  it('has a single connected land mass besides the islands', () => {
    const seen = new Set<string>();
    const stack = ['tur-bursa'];
    while (stack.length) {
      const id = stack.pop()!;
      if (seen.has(id)) continue;
      seen.add(id);
      stack.push(...(provinces[id]?.neighbors ?? []));
    }
    const unreached = Object.keys(provinces).filter((id) => !seen.has(id));
    expect(unreached.sort()).toEqual([
      'cyp',
      'grc-crete',
      'grc-ionian-islands',
      'grc-north-aegean',
      'grc-south-aegean',
    ]);
  });
});
