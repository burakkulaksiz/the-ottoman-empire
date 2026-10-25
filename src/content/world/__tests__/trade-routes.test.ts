import { PLACES } from '../places';
import { routePath, TRADE_ROUTES } from '../trade-routes';

describe('trade routes', () => {
  it('only pass through known places and have unique ids', () => {
    const ids = TRADE_ROUTES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const route of TRADE_ROUTES) {
      expect(route.via.length).toBeGreaterThanOrEqual(2);
      for (const placeId of route.via) {
        expect(
          PLACES.map((p) => p.id),
          `${route.id}: ${placeId}`,
        ).toContain(placeId);
      }
    }
  });

  it('draw through the positions of their places in order', () => {
    const route = TRADE_ROUTES.find((r) => r.id === 'ipek-yolu-trabzon')!;
    expect(routePath(route)).toEqual([
      [46.2919, 38.0792],
      [41.2769, 39.9],
      [39.7168, 41.0027],
    ]);
  });

  it('refuses a route through an unknown place', () => {
    expect(() =>
      routePath({ id: 'x', name: 'x', via: ['istanbul', 'atlantis'] }),
    ).toThrow(/unknown place "atlantis"/);
  });
});
