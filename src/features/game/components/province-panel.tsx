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
  armies: ProvinceArmyRow[];
  onSelectArmy: (armyId: string) => void;
};

/** Seçilen bölgenin özeti ve içindeki ordular. Şehir ayrıntıları B4'te. */
export function ProvincePanel({
  name,
  country,
  ownerName,
  neighborNames,
  armies,
  onSelectArmy,
}: ProvincePanelProps) {
  return (
    <Panel title={name}>
      <p className="text-muted-foreground">
        {country} · {ownerName ?? 'Sahipsiz'}
      </p>
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
