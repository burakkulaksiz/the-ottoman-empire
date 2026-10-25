import type { ArmyState, FactionId } from '@/engine';
import { armySize } from '@/engine';
import { formatUnits } from '@/features/game/config/unit-labels';
import type { ArmyMarker } from '@/features/map/lib/create-army-marker';

type Lookups = {
  /** Bölgenin harita üzerindeki işaret noktası [boylam, enlem]. */
  center(provinceId: string): [number, number] | undefined;
  provinceName(provinceId: string): string;
  faction(factionId: FactionId): { name: string; color: string } | undefined;
  playerFactionId: FactionId;
};

/**
 * Motordaki orduları harita işaretlerine çevirir. Aynı bölgedeki ordular
 * (id sırasıyla) yan yana dizilir; yalnızca oyuncunun orduları seçilebilir.
 */
export function buildArmyMarkers(
  armies: Record<string, ArmyState>,
  lookups: Lookups,
): ArmyMarker[] {
  const byProvince = new Map<string, ArmyState[]>();
  for (const army of Object.values(armies)) {
    const group = byProvince.get(army.provinceId) ?? [];
    group.push(army);
    byProvince.set(army.provinceId, group);
  }

  return [...byProvince].flatMap(([provinceId, group]) => {
    const position = lookups.center(provinceId);
    if (!position) return [];
    const sorted = [...group].sort((a, b) => (a.id < b.id ? -1 : 1));

    return sorted.map((army, index) => {
      const faction = lookups.faction(army.ownerId);
      return {
        id: army.id,
        position,
        color: faction?.color ?? '#6b7280',
        label: String(armySize(army.units)),
        title: `${faction?.name ?? army.ownerId} ordusu, ${lookups.provinceName(provinceId)}: ${formatUnits(army.units)}`,
        index,
        count: sorted.length,
        selectable: army.ownerId === lookups.playerFactionId,
      };
    });
  });
}
