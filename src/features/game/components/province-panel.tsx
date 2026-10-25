import { Button } from '@/components/ui/button';
import type { Units } from '@/engine';

import { formatUnits } from '../config/unit-labels';

import { Panel } from './panel';

export type ProvinceArmyRow = {
  id: string;
  factionName: string;
  units: Units;
  morale: number;
  /** Oyuncunun ordusu mu (seçilebilir)? */
  mine: boolean;
  selected: boolean;
};

type ProvincePanelProps = {
  name: string;
  country: string;
  ownerName: string | null;
  neighborNames: string[];
  /** "Ova", "Dağlık" gibi; savunana bonus verir. */
  terrainLabel?: string;
  /** Kale seviyesi (0 = yok): savunana bonus verir, kuşatmayı uzatır. */
  fortification?: number;
  /** Bölgedeki şehir ve kaleler; adlarına basınca ansiklopedi açılır. */
  places?: { id: string; name: string }[];
  onPlaceSelect?: (placeId: string) => void;
  armies: ProvinceArmyRow[];
  onSelectArmy: (armyId: string) => void;
  /** Oyuncunun bölgesinde devşirme seçenekleri (yoksa bölüm görünmez). */
  recruit?: {
    options: RecruitRow[];
    onRecruit: (unit: string) => void;
  };
};

export type RecruitRow = {
  unit: string;
  label: string;
  /** 100 askerin bedeli (akçe). */
  cost: number;
  /** Devşirilemiyorsa nedeni (düğme pasif olur). */
  disabledReason?: string;
};

/** Seçilen bölgenin özeti ve içindeki ordular. Şehir ayrıntıları B4'te. */
export function ProvincePanel({
  name,
  country,
  ownerName,
  neighborNames,
  terrainLabel,
  fortification = 0,
  places = [],
  onPlaceSelect,
  armies,
  onSelectArmy,
  recruit,
}: ProvincePanelProps) {
  return (
    <Panel title={name}>
      <p className="text-muted-foreground">
        {country} · {ownerName ?? 'Sahipsiz'}
      </p>
      {(terrainLabel || fortification > 0) && (
        <p className="mt-2">
          {terrainLabel && (
            <>
              <span className="font-medium">Arazi: </span>
              {terrainLabel}
            </>
          )}
          {terrainLabel && fortification > 0 && ' · '}
          {fortification > 0 && (
            <>
              <span className="font-medium">Kale seviyesi: </span>
              {fortification}
            </>
          )}
        </p>
      )}
      {places.length > 0 && (
        <p className="mt-2">
          <span className="font-medium">Şehirler: </span>
          {places.map((place, index) => (
            <span key={place.id}>
              {index > 0 && ', '}
              {onPlaceSelect ? (
                <button
                  type="button"
                  className="text-primary underline-offset-4 hover:underline"
                  onClick={() => onPlaceSelect(place.id)}
                >
                  {place.name}
                </button>
              ) : (
                place.name
              )}
            </span>
          ))}
        </p>
      )}
      <p className="mt-2">
        <span className="font-medium">Komşular: </span>
        {neighborNames.join(', ') || 'yok (ada)'}
      </p>

      <h3 className="mt-3 font-display text-base">Ordular</h3>
      {armies.length === 0 ? (
        <p className="text-muted-foreground">Bu bölgede ordu yok.</p>
      ) : (
        <ul className="mt-1 space-y-1">
          {armies.map((army) => (
            <li key={army.id}>
              {army.mine ? (
                <button
                  type="button"
                  aria-pressed={army.selected}
                  onClick={() => onSelectArmy(army.id)}
                  className="w-full rounded-md border px-2 py-1 text-left hover:bg-muted aria-pressed:border-primary aria-pressed:bg-muted"
                >
                  <ArmyRow army={army} />
                </button>
              ) : (
                <div className="rounded-md border border-dashed px-2 py-1">
                  <ArmyRow army={army} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {recruit && recruit.options.length > 0 && (
        <>
          <h3 className="mt-3 font-display text-base">Devşirme</h3>
          <ul className="mt-1 space-y-1">
            {recruit.options.map((option) => (
              <li key={option.unit}>
                <Button
                  size="xs"
                  variant="outline"
                  disabled={Boolean(option.disabledReason)}
                  title={option.disabledReason}
                  onClick={() => recruit.onRecruit(option.unit)}
                >
                  {option.label} +100 ({option.cost} akçe)
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </Panel>
  );
}

function ArmyRow({ army }: { army: ProvinceArmyRow }) {
  return (
    <>
      <span className="font-medium">{army.factionName}</span>
      <span className="block text-xs text-muted-foreground">
        {formatUnits(army.units)} · moral {army.morale}
      </span>
    </>
  );
}
