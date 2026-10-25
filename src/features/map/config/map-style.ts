import type { Feature, FeatureCollection } from 'geojson';
import type { StyleSpecification } from 'maplibre-gl';

import { PROVINCE_FILL_LAYER, PROVINCE_SOURCE } from './province-style';

/** Harita başlangıçta Balkanlar–Anadolu–Orta Doğu–Kuzey Afrika'yı gösterir. */
export const MAP_CENTER: [number, number] = [34, 37];
export const MAP_INITIAL_ZOOM = 4.2;
export const MAP_MIN_ZOOM = 3;
export const MAP_MAX_ZOOM = 10;

/** [batı, güney, doğu, kuzey] — oyuncu bu sınırların dışına kaydıramaz. */
export const MAP_BOUNDS: [number, number, number, number] = [-12, 15, 62, 55];

/** Parşömen/eski harita paleti (app.css'teki temayla uyumlu). */
export const MAP_COLORS = {
  sea: '#b9c7c4',
  land: '#ecdcb3',
  coast: '#8a6d3b',
  lake: '#b9c7c4',
  graticule: '#8a6d3b',
  provinceLine: '#6b4f2a',
  highlight: '#3b2412',
  reachable: '#b8860b',
} as const;

const sourceUrl = (file: string) =>
  `${import.meta.env.BASE_URL}data/${file}`.replace(/\/{2,}/g, '/');

function graticule(): FeatureCollection {
  const features: Feature[] = [];
  for (let lon = -20; lon <= 80; lon += 10) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [lon, 5],
          [lon, 65],
        ],
      },
    });
  }
  for (let lat = 10; lat <= 60; lat += 10) {
    features.push({
      type: 'Feature',
      properties: {},
      geometry: {
        type: 'LineString',
        coordinates: [
          [-20, lat],
          [80, lat],
        ],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}

/**
 * Dış servise bağımlı olmayan, yerel GeoJSON'dan çizilen tarihi harita stili.
 * Bölge katmanları (B2) ve sınırlar (B3) bunun üzerine eklenir.
 */
export function createMapStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {
      land: { type: 'geojson', data: sourceUrl('land-region.geojson') },
      lakes: { type: 'geojson', data: sourceUrl('lakes-region.geojson') },
      graticule: { type: 'geojson', data: graticule() },
      [PROVINCE_SOURCE]: {
        type: 'geojson',
        data: sourceUrl('provinces.geojson'),
        promoteId: 'id',
      },
    },
    layers: [
      {
        id: 'sea',
        type: 'background',
        paint: { 'background-color': MAP_COLORS.sea },
      },
      {
        id: 'graticule',
        type: 'line',
        source: 'graticule',
        paint: {
          'line-color': MAP_COLORS.graticule,
          'line-opacity': 0.18,
          'line-width': 0.6,
          'line-dasharray': [2, 3],
        },
      },
      {
        id: 'land',
        type: 'fill',
        source: 'land',
        paint: { 'fill-color': MAP_COLORS.land },
      },
      {
        id: 'lakes',
        type: 'fill',
        source: 'lakes',
        paint: { 'fill-color': MAP_COLORS.lake },
      },
      {
        id: PROVINCE_FILL_LAYER,
        type: 'fill',
        source: PROVINCE_SOURCE,
        paint: { 'fill-color': 'rgba(0, 0, 0, 0)', 'fill-opacity': 0.6 },
      },
      {
        id: 'provinces-highlight',
        type: 'fill',
        source: PROVINCE_SOURCE,
        paint: {
          'fill-color': MAP_COLORS.highlight,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            0.28,
            ['boolean', ['feature-state', 'hover'], false],
            0.14,
            0,
          ],
        },
      },
      {
        id: 'provinces-line',
        type: 'line',
        source: PROVINCE_SOURCE,
        paint: {
          'line-color': MAP_COLORS.provinceLine,
          'line-opacity': 0.4,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.3, 8, 1.2],
        },
      },
      {
        id: 'provinces-reachable',
        type: 'fill',
        source: PROVINCE_SOURCE,
        paint: {
          'fill-color': MAP_COLORS.reachable,
          'fill-opacity': [
            'case',
            ['boolean', ['feature-state', 'reachable'], false],
            0.35,
            0,
          ],
        },
      },
      {
        id: 'provinces-reachable-line',
        type: 'line',
        source: PROVINCE_SOURCE,
        paint: {
          'line-color': MAP_COLORS.reachable,
          'line-dasharray': [2, 1.5],
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'reachable'], false],
            3,
            0,
          ],
        },
      },
      {
        id: 'provinces-selected-line',
        type: 'line',
        source: PROVINCE_SOURCE,
        paint: {
          'line-color': MAP_COLORS.highlight,
          'line-width': [
            'case',
            ['boolean', ['feature-state', 'selected'], false],
            2.5,
            0,
          ],
        },
      },
      {
        id: 'coast',
        type: 'line',
        source: 'land',
        paint: {
          'line-color': MAP_COLORS.coast,
          'line-opacity': 0.7,
          'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.6, 8, 1.6],
        },
      },
    ],
  };
}
