import { Check, Circle } from 'lucide-react';

import { useT } from '@/hooks/use-t';

import { Panel } from './panel';

export type ObjectiveRow = {
  id: string;
  title: string;
  done: boolean;
  current: number;
  target: number;
};

type ObjectivesPanelProps = {
  objectives: ObjectiveRow[];
  /** Örn. "İlkbahar 1330"; zaman sınırı yoksa `null`. */
  deadlineLabel: string | null;
};

export function ObjectivesPanel({
  objectives,
  deadlineLabel,
}: ObjectivesPanelProps) {
  const t = useT();
  return (
    <Panel title={t('panels.objectives')}>
      <ul className="space-y-1">
        {objectives.map((o) => (
          <li key={o.id} className="flex items-start gap-2">
            {o.done ? (
              <Check
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-label={t('panels.done')}
              />
            ) : (
              <Circle
                className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                aria-label={t('panels.inProgress')}
              />
            )}
            <span>
              {o.title}{' '}
              <span className="text-muted-foreground">
                ({o.current}/{o.target})
              </span>
            </span>
          </li>
        ))}
      </ul>
      {deadlineLabel && (
        <p className="mt-2 text-xs text-muted-foreground">
          {t('panels.deadline', { date: deadlineLabel })}
        </p>
      )}
    </Panel>
  );
}
