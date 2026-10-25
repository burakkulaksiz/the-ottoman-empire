import { Button } from '@/components/ui/button';
import type { Units } from '@/engine';
import { useT } from '@/hooks/use-t';

import { formatUnits } from '../config/unit-labels';

import { Panel } from './panel';

type ArmyPanelProps = {
  factionName: string;
  provinceName: string;
  units: Units;
  /** 0–100 */
  morale: number;
  movesLeft: number;
  /** Gidilebilecek bölgeler (haritada vurgulanır; buradan da seçilebilir). */
  destinations: { id: string; name: string }[];
  onMove: (provinceId: string) => void;
  onCancel: () => void;
};

/** Seçili ordunun durumu ve emir verme ipucu. */
export function ArmyPanel({
  factionName,
  provinceName,
  units,
  morale,
  movesLeft,
  destinations,
  onMove,
  onCancel,
}: ArmyPanelProps) {
  const t = useT();
  return (
    <Panel title={t('army.title', { faction: factionName })}>
      <p className="text-muted-foreground">{provinceName}</p>
      <p className="mt-2">{formatUnits(units, t)}</p>

      <div className="mt-2">
        <div className="flex justify-between text-xs">
          <span>{t('army.morale')}</span>
          <span>{morale}/100</span>
        </div>
        <div
          role="progressbar"
          aria-label={t('army.morale')}
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
          destinations.length > 0 ? (
            <>
              {t('army.marchHint')}
              <span className="mt-1 flex flex-wrap gap-1">
                {destinations.map((d) => (
                  <Button
                    key={d.id}
                    size="xs"
                    variant="outline"
                    aria-label={t('army.marchTo', { province: d.name })}
                    onClick={() => onMove(d.id)}
                  >
                    {d.name}
                  </Button>
                ))}
              </span>
            </>
          ) : (
            t('army.noDestination')
          )
        ) : (
          t('army.noMoves')
        )}
      </p>

      <Button variant="outline" size="sm" className="mt-3" onClick={onCancel}>
        {t('army.deselect')}
      </Button>
    </Panel>
  );
}
