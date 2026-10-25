import type { FeatureCollection } from 'geojson';
import type { GeoJSONSource, Map as MapLibreMap, Marker } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
// MapLibre kendi Worker dosyasını import.meta.url'e göre arar; Vite bağımlılığı
// ön-paketleyince bu yol bozulur ("Worker failed to load"). Adres açıkça verilir.
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { useEffect, useRef, useState } from 'react';

import {
  createMapStyle,
  TRADE_ROUTES_SOURCE,
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
import {
  createArmyMarkerElement,
  markerOffset,
  type ArmyMarker,
} from '../lib/create-army-marker';
import {
  createPlaceMarkerElement,
  type PlaceMarker,
} from '../lib/create-place-marker';

type GameMapProps = {
  className?: string;
  /** Bölge kimliği → sahibi olan devlet (yoksa `null`). */
  owners?: Record<string, string | null>;
  /** Devlet kimliği → harita rengi. */
  factionColors?: Record<string, string>;
  selectedProvinceId?: string | null;
  /** Şehir, kale ve boğaz işaretleri. */
  places?: PlaceMarker[];
  /** Ticaret yolları (çizgi nesneleri). */
  tradeRoutes?: FeatureCollection;
  /** Haritada gösterilecek ordular. */
  armies?: ArmyMarker[];
  selectedArmyId?: string | null;
  onArmySelect?: (armyId: string) => void;
  /** Seçili ordunun gidebileceği bölgeler (vurgulanır). */
  reachableProvinceIds?: string[];
  /** Bir bölgeye tıklanınca; boş yere tıklanınca `null`. */
  onProvinceSelect?: (provinceId: string | null) => void;
  onReady?: (map: MapLibreMap) => void;
};

const NO_OWNERS: Record<string, string | null> = {};
const NO_COLORS: Record<string, string> = {};
const NO_ARMIES: ArmyMarker[] = [];
const NO_PLACES: PlaceMarker[] = [];
const NO_IDS: string[] = [];

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
  places = NO_PLACES,
  tradeRoutes,
  armies = NO_ARMIES,
  selectedArmyId = null,
  onArmySelect,
  reachableProvinceIds = NO_IDS,
  onProvinceSelect,
  onReady,
}: GameMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<MapLibreMap | null>(null);

  // Olay işleyicileri harita yeniden kurulmadan güncel kalsın.
  const callbacks = useRef({ onProvinceSelect, onArmySelect, onReady });
  useEffect(() => {
    callbacks.current = { onProvinceSelect, onArmySelect, onReady };
  }, [onProvinceSelect, onArmySelect, onReady]);
  const markerClass = useRef<typeof Marker | null>(null);

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
    void import('maplibre-gl').then((maplibre) => {
      if (cancelled) return;
      const { Map, Marker, NavigationControl } = maplibre;
      maplibre.setWorkerUrl(maplibreWorkerUrl);
      markerClass.current = Marker;
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

  useEffect(() => {
    if (!map || reachableProvinceIds.length === 0) return;
    const targets = reachableProvinceIds.map((id) => ({
      source: PROVINCE_SOURCE,
      id,
    }));
    for (const target of targets)
      map.setFeatureState(target, { reachable: true });
    return () => {
      try {
        for (const target of targets) {
          map.setFeatureState(target, { reachable: false });
        }
      } catch {
        // Harita zaten kaldırılmış.
      }
    };
  }, [map, reachableProvinceIds]);

  useEffect(() => {
    if (!map || !tradeRoutes) return;
    (map.getSource(TRADE_ROUTES_SOURCE) as GeoJSONSource | undefined)?.setData(
      tradeRoutes,
    );
  }, [map, tradeRoutes]);

  // Şehir/kale/boğaz işaretleri ordu işaretlerinden önce eklenir (altta kalır).
  useEffect(() => {
    const MarkerClass = markerClass.current;
    if (!map || !MarkerClass) return;
    const markers = places.map((place) =>
      new MarkerClass({ element: createPlaceMarkerElement(place) })
        .setLngLat(place.position)
        .addTo(map),
    );
    return () => {
      for (const marker of markers) marker.remove();
    };
  }, [map, places]);

  // Ordu işaretleri: HTML öğeleri, her değişiklikte baştan kurulur (az sayıda).
  useEffect(() => {
    const MarkerClass = markerClass.current;
    if (!map || !MarkerClass) return;
    const markers = armies.map((army) =>
      new MarkerClass({
        element: createArmyMarkerElement(
          army,
          army.id === selectedArmyId,
          (id) => callbacks.current.onArmySelect?.(id),
        ),
        offset: markerOffset(army.index, army.count),
      })
        .setLngLat(army.position)
        .addTo(map),
    );
    return () => {
      for (const marker of markers) marker.remove();
    };
  }, [map, armies, selectedArmyId]);

  return (
    // MapLibre kapsayıcısına kendi CSS'iyle `position: relative` verir; bu
    // yüzden dış yerleşim sınıfları (örn. `absolute inset-0`) sarmalayıcıda,
    // harita ise onu dolduran iç kutuda durur. Aksi hâlde yüksekliği 0 olur.
    <div className={className}>
      <div
        ref={containerRef}
        role="application"
        aria-label="Oyun haritası"
        className="h-full w-full"
      />
    </div>
  );
}
