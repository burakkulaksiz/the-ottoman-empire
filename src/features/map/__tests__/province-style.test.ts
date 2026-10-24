import { ownerFillColor } from '../config/province-style';

describe('ownerFillColor', () => {
  const colors = { osmanli: '#b91c1c', bizans: '#7e22ce' };

  it('stays transparent while nobody owns a province', () => {
    expect(ownerFillColor({}, colors)).toBe('rgba(0, 0, 0, 0)');
    expect(ownerFillColor({ a: null }, colors)).toBe('rgba(0, 0, 0, 0)');
  });

  it('groups provinces by their owner colour', () => {
    const expr = ownerFillColor(
      { a: 'osmanli', b: 'bizans', c: 'osmanli', d: null },
      colors,
    );
    expect(expr).toEqual([
      'match',
      ['get', 'id'],
      ['a', 'c'],
      '#b91c1c',
      ['b'],
      '#7e22ce',
      'rgba(0, 0, 0, 0)',
    ]);
  });

  it('ignores owners without a known colour', () => {
    expect(ownerFillColor({ a: 'bilinmeyen' }, colors)).toBe(
      'rgba(0, 0, 0, 0)',
    );
  });
});
