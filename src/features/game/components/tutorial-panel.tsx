import { Check, Circle } from 'lucide-react';

import { Panel } from './panel';

export type TutorialPanelStep = {
  id: string;
  title: string;
  text: string;
  done: boolean;
};

type TutorialPanelProps = {
  steps: TutorialPanelStep[];
  /** Sıradaki adım; hepsi bittiyse `null`. */
  currentId: string | null;
};

/** Öğretici rehberi (D7): sıradaki adımın açıklaması ve tüm adımlar. */
export function TutorialPanel({ steps, currentId }: TutorialPanelProps) {
  const current = steps.find((s) => s.id === currentId);
  const done = steps.filter((s) => s.done).length;

  return (
    <Panel title={`Rehber (${done}/${steps.length})`}>
      {current ? (
        <div className="rounded-md bg-primary/10 p-2" aria-live="polite">
          <p className="font-medium">{current.title}</p>
          <p>{current.text}</p>
        </div>
      ) : (
        <p className="rounded-md bg-primary/10 p-2 font-medium">
          Tebrikler! Öğreticiyi tamamladın. Artık 1299 Kuruluş senaryosuna
          hazırsın.
        </p>
      )}
      <ol className="mt-2 space-y-1">
        {steps.map((step) => (
          <li
            key={step.id}
            className={`flex items-center gap-2 ${
              step.id === currentId ? 'font-medium' : ''
            }`}
          >
            {step.done ? (
              <Check
                className="size-4 shrink-0 text-primary"
                aria-label="Tamamlandı"
              />
            ) : (
              <Circle
                className="size-4 shrink-0 text-muted-foreground"
                aria-label="Bekliyor"
              />
            )}
            {step.title}
          </li>
        ))}
      </ol>
    </Panel>
  );
}
