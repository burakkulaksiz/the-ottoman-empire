import { Button } from '@/components/ui/button';
import type { Units } from '@/engine';

import { formatUnits } from '../config/unit-labels';

import { Panel } from './panel';

type ArmyPanelProps = {
  factionName: string;
  provinceName: string;
  units: Units;
  /** 0–100 */
  morale: number;
  movesLeft: number;
  /** Gidilebilecek bölgelerin adları (haritada vurgulanır). */
  destinationNames: string[];
  onCancel: () => void;
};

/** Seçili ordunun durumu ve emir verme ipucu. */
export function ArmyPanel({
  factionName,
  provinceName,
  units,
  morale,
  movesLeft,
  destinationNames,
  onCancel,
}: ArmyPanelProps) {
  return (
    <Panel title={`${factionName} ordusu`}>
      <p className="text-muted-foreground">{provinceName}</p>
      <p className="mt-2">{formatUnits(units)}</p>

      <div className="mt-2">
        <div className="flex justify-between text-xs">
          <span>Moral</span>
          <span>{morale}/100</span>
        </div>
        <div
          role="progressbar"
          aria-label="Moral"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={morale}
          className="mt-1 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full bg-primary" style={{ width: `${morale}%` }} />
        </div>
      </div>

      <p className="mt-2">
        {movesLeft > 0 ? (
          destinationNames.length > 0 ? (
            <>
              Haritada vurgulanan bir bölgeye tıklayarak yürüt:{' '}
              <span className="font-medium">{destinationNames.join(', ')}</span>
            </>
          ) : (
            'Şu an gidebileceği bölge yok (kışın yalnızca kendi toprağına çekilebilir).'
          )
        ) : (
          'Bu tur hareket hakkı kalmadı.'
        )}
      </p>

      <Button variant="outline" size="sm" className="mt-3" onClick={onCancel}>
        Seçimi kaldır
      </Button>
    </Panel>
  );
}
