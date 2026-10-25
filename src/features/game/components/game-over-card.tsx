import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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

const VERDICT_LABELS = {
  better: 'Tarihten daha iyi bir sonuç',
  same: 'Tarihle aynı düzeyde bir sonuç',
  worse: 'Tarihten daha kötü bir sonuç',
} as const;

/** Oyun sonu: sonuç, tarihe göre puan, karar uyumu ve gerçekte olanlar. */
export function GameOverCard({ content, onDismiss }: GameOverCardProps) {
  const { result, reason, score, decisions, historicalNote } = content;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
      className="absolute inset-0 z-20 grid place-items-center bg-foreground/40 p-4"
    >
      <Card className="max-h-full w-full max-w-lg overflow-y-auto">
        <CardHeader>
          <CardTitle id="game-over-title" className="font-display text-3xl">
            {result === 'victory' ? 'Zafer' : 'Yenilgi'}
          </CardTitle>
          <p className="text-muted-foreground">{reason}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {score && (
            <section>
              <h3 className="font-display text-lg">Tarihe göre sonucun</h3>
              <p>
                {VERDICT_LABELS[score.verdict]}: {score.provinces} bölge,
                tarihte {score.benchmark} ({score.points} puan).
              </p>
            </section>
          )}
          {decisions && decisions.total > 0 && (
            <section>
              <h3 className="font-display text-lg">Kararların</h3>
              <p>
                {decisions.total} karardan {decisions.matched} tanesinde
                tarihteki gibi davrandın.
              </p>
            </section>
          )}
          {historicalNote && (
            <section className="rounded-lg bg-muted p-3">
              <h3 className="font-display text-lg">
                Tarihte gerçekte ne oldu?
              </h3>
              <p className="mt-1 text-sm">{historicalNote}</p>
            </section>
          )}
        </CardContent>

        <CardFooter className="justify-end gap-2">
          <Button variant="outline" onClick={onDismiss}>
            Haritaya bak
          </Button>
          <Link to="/scenarios" className={buttonVariants()}>
            Yeni Oyun
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
