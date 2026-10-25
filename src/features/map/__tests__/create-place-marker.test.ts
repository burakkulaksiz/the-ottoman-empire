import {
  createPlaceMarkerElement,
  type PlaceMarker,
} from '../lib/create-place-marker';

const city: PlaceMarker = {
  id: 'bursa',
  name: 'Bursa',
  position: [29.07, 40.18],
  kind: 'city',
  fortification: 1,
};

describe('createPlaceMarkerElement', () => {
  it('names the place and mentions its fortification level', () => {
    const el = createPlaceMarkerElement(city);
    expect(el.title).toBe('Bursa (kale seviyesi 1)');
    expect(el.getAttribute('aria-label')).toBe('Bursa (kale seviyesi 1)');
  });

  it('draws unfortified towns, fortresses and straits differently', () => {
    const town = createPlaceMarkerElement({ ...city, fortification: 0 });
    const fort = createPlaceMarkerElement(city);
    const great = createPlaceMarkerElement({ ...city, fortification: 3 });
    const strait = createPlaceMarkerElement({
      ...city,
      kind: 'strait',
      fortification: 0,
    });

    expect(town.title).toBe('Bursa');
    expect(town.className).toContain('rounded-full');
    expect(fort.className).not.toContain('rounded-full');
    expect(great.className).toContain('size-4');
    expect(strait.className).toContain('rotate-45');
  });
});
