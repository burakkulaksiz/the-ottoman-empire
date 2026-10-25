import { Check, X } from 'lucide-react';

import { Panel } from './panel';

export type DecisionPanelRow = {
  id: string;
  title: string;
  choice: string;
  historicalChoice: string;
  matched: boolean;
};

type DecisionsPanelProps = {
  rows: DecisionPanelRow[];
};

/** Karar defteri: verilen kararlar ve tarihle uyumu. Karar yoksa görünmez. */
export function DecisionsPanel({ rows }: DecisionsPanelProps) {
  if (rows.length === 0) return null;
  const matched = rows.filter((r) => r.matched).length;

  return (
    <Panel title="Kararlar" defaultOpen={false}>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-start gap-2">
            {row.matched ? (
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-label="Tarihle aynı"
              />
            ) : (
              <X
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-label="Tarihten farklı"
              />
            )}
            <span>
              <span className="font-medium">{row.title}</span>
              <span className="block text-xs">{row.choice}</span>
              {!row.matched && (
                <span className="block text-xs text-muted-foreground">
                  Tarihte: {row.historicalChoice}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Tarihle uyum: {matched}/{rows.length}
      </p>
    </Panel>
  );
}
