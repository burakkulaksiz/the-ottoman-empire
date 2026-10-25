import { Button } from '@/components/ui/button';

import { Panel } from './panel';

export type CourtPerson = {
  id: string;
  name: string;
  age: number;
  military: number;
  administration: number;
};

type CourtPanelProps = {
  ruler: CourtPerson;
  heirs: CourtPerson[];
  vizier: CourtPerson | null;
  candidates: CourtPerson[];
  /** 0–100 */
  stability: number;
  stabilityLabel: string;
  /** Vezir atanamıyorsa nedeni (ör. divan henüz yok). */
  vizierNote?: string;
  vizierCost: number;
  canAffordVizier: boolean;
  onAppointVizier: (personId: string) => void;
};

function Skills({ person }: { person: CourtPerson }) {
  return (
    <span className="text-xs text-muted-foreground">
      {person.age} yaş · savaş {person.military} · yönetim{' '}
      {person.administration}
    </span>
  );
}

/** Saray: hükümdar, şehzadeler, vezir ve sadakat (C8). */
export function CourtPanel({
  ruler,
  heirs,
  vizier,
  candidates,
  stability,
  stabilityLabel,
  vizierNote,
  vizierCost,
  canAffordVizier,
  onAppointVizier,
}: CourtPanelProps) {
  return (
    <Panel title="Saray" defaultOpen={false}>
      <p>
        <span className="font-medium">{ruler.name}</span>{' '}
        <Skills person={ruler} />
      </p>

      <div className="mt-2">
        <div className="flex justify-between text-xs">
          <span>Sadakat: {stabilityLabel}</span>
          <span>{stability}/100</span>
        </div>
        <div
          role="progressbar"
          aria-label="Sadakat"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={stability}
          className="mt-1 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full bg-primary"
            style={{ width: `${stability}%` }}
          />
        </div>
      </div>

      <h3 className="mt-3 font-display text-base">Şehzadeler</h3>
      {heirs.length === 0 ? (
        <p className="text-muted-foreground">Şehzade yok.</p>
      ) : (
        <ul>
          {heirs.map((heir) => (
            <li key={heir.id}>
              {heir.name} <Skills person={heir} />
            </li>
          ))}
        </ul>
      )}

      <h3 className="mt-3 font-display text-base">Vezir</h3>
      {vizier ? (
        <p>
          {vizier.name} <Skills person={vizier} />
        </p>
      ) : candidates.length > 0 ? (
        <ul className="space-y-1">
          {candidates.map((candidate) => (
            <li key={candidate.id} className="flex items-center gap-2">
              <span>
                {candidate.name} <Skills person={candidate} />
              </span>
              <Button
                size="xs"
                variant="outline"
                className="ml-auto"
                disabled={!canAffordVizier}
                title={canAffordVizier ? undefined : 'Yeterli akçe yok'}
                onClick={() => onAppointVizier(candidate.id)}
              >
                Vezir yap ({vizierCost} akçe)
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-muted-foreground">{vizierNote ?? 'Vezir yok.'}</p>
      )}
    </Panel>
  );
}
