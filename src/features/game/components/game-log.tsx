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

  return (
    <Panel title="Günlük" defaultOpen={false}>
      {recent.length === 0 ? (
        <p className="text-muted-foreground">Henüz bir şey olmadı.</p>
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
