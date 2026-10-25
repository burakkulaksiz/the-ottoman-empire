import { useT } from '@/hooks/use-t';

import { Panel } from './panel';

type GameLogProps = {
  /** Eskiden yeniye sıralı, biçimlendirilmiş satırlar. */
  lines: string[];
  /** En fazla kaç son satır gösterilsin. */
  limit?: number;
};

/** Son olayların kısa günlüğü (D4'teki kronikten ayrı, anlık özet). */
export function GameLog({ lines, limit = 30 }: GameLogProps) {
  const recent = lines.slice(-limit).reverse();
  const t = useT();

  return (
    <Panel title={t('panels.log')} defaultOpen={false}>
      {recent.length === 0 ? (
        <p className="text-muted-foreground">{t('panels.logEmpty')}</p>
      ) : (
        <ol className="space-y-1">
          {recent.map((line, index) => (
            <li key={`${recent.length - index}-${line}`}>{line}</li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
