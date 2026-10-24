import {
  createMapStyle,
  MAP_BOUNDS,
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
} from '../config/map-style';

describe('createMapStyle', () => {
  const style = createMapStyle();

  it('only references sources that are declared', () => {
    for (const layer of style.layers) {
      if ('source' in layer && layer.source) {
        expect(style.sources).toHaveProperty(layer.source);
      }
    }
  });

  it('uses unique layer ids and draws the sea first', () => {
    const ids = style.layers.map((l) => l.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[0]).toBe('sea');
  });

  it('does not depend on external services', () => {
    expect(JSON.stringify(style)).not.toMatch(/https?:\/\//);
  });
});

describe('map view limits', () => {
  it('starts inside the bounds and the zoom range', () => {
    const [w, s, e, n] = MAP_BOUNDS;
    expect(MAP_CENTER[0]).toBeGreaterThan(w);
    expect(MAP_CENTER[0]).toBeLessThan(e);
    expect(MAP_CENTER[1]).toBeGreaterThan(s);
    expect(MAP_CENTER[1]).toBeLessThan(n);
    expect(MAP_INITIAL_ZOOM).toBeGreaterThanOrEqual(MAP_MIN_ZOOM);
    expect(MAP_INITIAL_ZOOM).toBeLessThanOrEqual(MAP_MAX_ZOOM);
  });
});
