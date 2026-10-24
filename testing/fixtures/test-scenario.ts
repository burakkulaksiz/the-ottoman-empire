import type { ScenarioSetup, World } from '@/engine';

/**
 * Testler için küçük bir dünya (1300 civarı Söğüt çevresi).
 *
 *   kutahya ── sogut ── bilecik
 *                │         │
 *              inegol ─── bursa
 */
export const testWorld: World = {
  provinces: {
    sogut: {
      id: 'sogut',
      name: 'Söğüt',
      neighbors: ['bilecik', 'inegol', 'kutahya'],
      baseTax: 2,
    },
    bilecik: {
      id: 'bilecik',
      name: 'Bilecik',
      neighbors: ['sogut', 'bursa'],
      baseTax: 3,
    },
    inegol: {
      id: 'inegol',
      name: 'İnegöl',
      neighbors: ['sogut', 'bursa'],
      baseTax: 2,
    },
    bursa: {
      id: 'bursa',
      name: 'Bursa',
      neighbors: ['bilecik', 'inegol'],
      baseTax: 8,
    },
    kutahya: {
      id: 'kutahya',
      name: 'Kütahya',
      neighbors: ['sogut'],
      baseTax: 5,
    },
  },
  factions: {
    osmanli: { id: 'osmanli', name: 'Osmanlı Beyliği', color: '#b91c1c' },
    bizans: { id: 'bizans', name: 'Bizans', color: '#7e22ce' },
    germiyan: { id: 'germiyan', name: 'Germiyanoğulları', color: '#15803d' },
  },
};

export const testScenario: ScenarioSetup = {
  id: 'test',
  world: testWorld,
  startDate: { year: 1300, season: 'spring' },
  playerFactionId: 'osmanli',
  factions: {
    osmanli: { treasury: 10 },
    bizans: { treasury: 50 },
    germiyan: { treasury: 20 },
  },
  provinceOwners: {
    sogut: 'osmanli',
    bilecik: 'bizans',
    inegol: 'bizans',
    bursa: 'bizans',
    kutahya: 'germiyan',
  },
  armies: [
    { ownerId: 'osmanli', provinceId: 'sogut', troops: 1000 },
    { ownerId: 'bizans', provinceId: 'bursa', troops: 3000 },
    { ownerId: 'germiyan', provinceId: 'kutahya', troops: 2000 },
  ],
};
