import { Link } from 'react-router';

import { TezhipDivider } from '@/components/ornament';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useT } from '@/hooks/use-t';

export type GameOverContent = {
  result: 'victory' | 'defeat';
  /** Sonucun nedeni, örn. "Hedeflerin tamamlandı". */
  reason: string;
  /** Oyuncunun sonucu tarihle kıyaslanmışsa. */
  score?: {
    provinces: number;
    benchmark: number;
    points: number;
    verdict: 'better' | 'same' | 'worse';
  };
  /** Karar anlarında tarihle uyum; hiç karar verilmediyse `undefined`. */
  decisions?: { matched: number; total: number };
  /** "Tarihte gerçekte ne oldu?" özeti. */
  historicalNote?: string;
};

type GameOverCardProps = {
  content: GameOverContent;
  /** Haritaya geri dönüp oyun sonucunu incelemek için. */
  onDismiss: () => void;
};

/** Oyun sonu: sonuç, tarihe göre puan, karar uyumu ve gerçekte olanlar. */
export function GameOverCard({ content, onDismiss }: GameOverCardProps) {
  const { result, reason, score, decisions, historicalNote } = content;
  const t = useT();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="absolute inset-0 z-20 grid place-items-center bg-foreground/40 p-4"
    >
      <Card className="tezhip-frame max-h-full w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <CardTitle id="game-over-title" className="font-display text-3xl">
            {t(result === 'victory' ? 'common.victory' : 'common.defeat')}
          </CardTitle>
          <TezhipDivider />
          <p className="text-muted-foreground">{reason}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {score && (
            <section>
              <h3 className="font-display text-lg">
                {t('gameOver.yourResult')}
              </h3>
              <p>
                {t('gameOver.score', {
                  verdict: t(`gameOver.${score.verdict}`),
                  provinces: score.provinces,
                  benchmark: score.benchmark,
                  points: score.points,
                })}
              </p>
            </section>
          )}
          {decisions && decisions.total > 0 && (
            <section>
              <h3 className="font-display text-lg">
                {t('gameOver.yourDecisions')}
              </h3>
              <p>
                {t('gameOver.decisions', {
                  total: decisions.total,
                  matched: decisions.matched,
                })}
              </p>
            </section>
          )}
          {historicalNote && (
            <section className="rounded-lg bg-muted p-3">
              <h3 className="font-display text-lg">
                {t('event.whatHappened')}
              </h3>
              <p className="mt-1 text-sm">{historicalNote}</p>
            </section>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={onDismiss}>
            {t('gameOver.lookAtMap')}
          </Button>
          <Link to="/scenarios" className={buttonVariants()}>
            {t('gameOver.newGame')}
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
