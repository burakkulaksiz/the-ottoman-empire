import type { ArmyState } from '@/engine';

import { buildArmyMarkers } from '../army-markers';

const army = (
  id: string,
  ownerId: string,
  provinceId: string,
  units: ArmyState['units'],
): [string, ArmyState] => [
  id,
  { id, ownerId, provinceId, units, morale: 80, movesLeft: 1 },
];

const lookups = {
  center: (id: string): [number, number] | undefined =>
    id === 'a' ? [30, 40] : id === 'b' ? [31, 41] : undefined,
  provinceName: (id: string) => id.toUpperCase(),
  faction: (id: string) =>
    id === 'osmanli'
      ? { name: 'Osmanlı Beyliği', color: '#b91c1c' }
      : id === 'bizans'
        ? { name: 'Bizans', color: '#7e22ce' }
        : undefined,
  playerFactionId: 'osmanli',
};

describe('buildArmyMarkers', () => {
  it('draws one marker per army at the province centre with troop count', () => {
    const markers = buildArmyMarkers(
      Object.fromEntries([
        army('army-1', 'osmanli', 'a', { sipahi: 600, akinci: 400 }),
      ]),
      lookups,
    );

    expect(markers).toEqual([
      {
        id: 'army-1',
        position: [30, 40],
        color: '#b91c1c',
        label: '1000',
        title: 'Osmanlı Beyliği ordusu, A: Akıncı 400 · Sipahi 600',
        index: 0,
        count: 1,
        selectable: true,
      },
    ]);
  });

  it('lines up armies sharing a province and only lets the player pick its own', () => {
    const markers = buildArmyMarkers(
      Object.fromEntries([
        army('army-2', 'bizans', 'a', { sipahi: 10 }),
        army('army-1', 'osmanli', 'a', { sipahi: 20 }),
        army('army-3', 'osmanli', 'b', { sipahi: 30 }),
      ]),
      lookups,
    );

    const inA = markers.filter((m) => m.position[0] === 30);
    expect(inA.map((m) => [m.id, m.index, m.count, m.selectable])).toEqual([
      ['army-1', 0, 2, true],
      ['army-2', 1, 2, false],
    ]);
    expect(markers.find((m) => m.id === 'army-3')?.count).toBe(1);
  });

  it('skips armies in provinces without a known position', () => {
    const markers = buildArmyMarkers(
      Object.fromEntries([army('army-1', 'osmanli', 'x', { sipahi: 1 })]),
      lookups,
    );
    expect(markers).toEqual([]);
  });

  it('uses a neutral colour for unknown factions', () => {
    const [marker] = buildArmyMarkers(
      Object.fromEntries([army('army-1', 'yok', 'a', { sipahi: 1 })]),
      lookups,
    );
    expect(marker?.color).toBe('#6b7280');
  });
});
