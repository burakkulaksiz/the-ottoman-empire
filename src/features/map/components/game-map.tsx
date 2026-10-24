import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';

import {
  createMapStyle,
  MAP_BOUNDS,
  MAP_CENTER,
  MAP_INITIAL_ZOOM,
  MAP_MAX_ZOOM,
  MAP_MIN_ZOOM,
} from '../config/map-style';
import {
  ownerFillColor,
  PROVINCE_FILL_LAYER,
  PROVINCE_SOURCE,
} from '../config/province-style';

type GameMapProps = {
  className?: string;
  /** Bölge kimliği → sahibi olan devlet (yoksa `null`). */
  owners?: Record<string, string | null>;
  /** Devlet kimliği → harita rengi. */
  factionColors?: Record<string, string>;
  selectedProvinceId?: string | null;
  /** Bir bölgeye tıklanınca; boş yere tıklanınca `null`. */
  onProvinceSelect?: (provinceId: string | null) => void;
  onReady?: (map: MapLibreMap) => void;
};

const NO_OWNERS: Record<string, string | null> = {};
const NO_COLORS: Record<string, string> = {};

function provinceIdAt(map: MapLibreMap, point: { x: number; y: number }) {
  const feature = map.queryRenderedFeatures([point.x, point.y], {
    layers: [PROVINCE_FILL_LAYER],
  })[0];
  const id = feature?.properties?.id;
  return typeof id === 'string' ? id : null;
}

export function GameMap({
  className,
  owners = NO_OWNERS,
  factionColors = NO_COLORS,
  selectedProvinceId = null,
  onProvinceSelect,
  onReady,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  // Olay işleyicileri harita yeniden kurulmadan güncel kalsın.
  const callbacks = useRef({ onProvinceSelect, onReady });
  useEffect(() => {
    callbacks.current = { onProvinceSelect, onReady };
  }, [onProvinceSelect, onReady]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let instance: MapLibreMap | undefined;
    let cancelled = false;
    let hoveredId: string | null = null;

    const setHover = (target: MapLibreMap, id: string | null) => {
      if (id === hoveredId) return;
      if (hoveredId) {
        target.setFeatureState(
          { source: PROVINCE_SOURCE, id: hoveredId },
          { hover: false },
        );
      }
      if (id) {
        target.setFeatureState(
          { source: PROVINCE_SOURCE, id },
          { hover: true },
        );
      }
      target.getCanvas().style.cursor = id ? 'pointer' : '';
      hoveredId = id;
    };

    // MapLibre `window`'a bağlıdır; yalnızca tarayıcıda yüklenir.
    void import('maplibre-gl').then(({ Map, NavigationControl }) => {
      if (cancelled) return;
      const created = new Map({
        container,
        style: createMapStyle(),
        center: MAP_CENTER,
        zoom: MAP_INITIAL_ZOOM,
        minZoom: MAP_MIN_ZOOM,
        maxZoom: MAP_MAX_ZOOM,
        maxBounds: MAP_BOUNDS,
        dragRotate: false,
        pitchWithRotate: false,
        attributionControl: { compact: true },
      });
      created.touchZoomRotate.disableRotation();
      created.addControl(
        new NavigationControl({ showCompass: false }),
        'top-right',
      );
      created.on('mousemove', (e) =>
        setHover(created, provinceIdAt(created, e.point)),
      );
      created.on('mouseout', () => setHover(created, null));
      created.on('click', (e) =>
        callbacks.current.onProvinceSelect?.(provinceIdAt(created, e.point)),
      );
      created.once('load', () => {
        setMap(created);
        callbacks.current.onReady?.(created);
      });
      instance = created;
    });

    return () => {
      cancelled = true;
      setMap(null);
      instance?.remove();
    };
  }, []);

  useEffect(() => {
    map?.setPaintProperty(
      PROVINCE_FILL_LAYER,
      'fill-color',
      ownerFillColor(owners, factionColors),
    );
  }, [map, owners, factionColors]);

  useEffect(() => {
    if (!map || !selectedProvinceId) return;
    const target = { source: PROVINCE_SOURCE, id: selectedProvinceId };
    map.setFeatureState(target, { selected: true });
    return () => {
      try {
        map.setFeatureState(target, { selected: false });
      } catch {
        // Harita zaten kaldırılmış (unmount sırası).
      }
    };
  }, [map, selectedProvinceId]);

  return (
    <div
      ref={containerRef}
      role="application"
      aria-label="Oyun haritası"
      className={className}
    />
  );
}
