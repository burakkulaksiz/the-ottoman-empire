import { ArrowLeft, Coins, Save, SkipForward } from 'lucide-react';
import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';

type GameHudProps = {
  scenarioName: string;
  dateLabel: string;
  turn: number;
  treasury: number;
  /** Oyun bittiyse sonucu; sürüyorsa `null`. */
  resultLabel: string | null;
  canEndTurn: boolean;
  onEndTurn: () => void;
  /** Kayıt menüsünü açar/kapatır. */
  onToggleSaves: () => void;
};

/** Oyun ekranının üst çubuğu: senaryo, tarih, hazine ve tur düğmesi. */
export function GameHud({
  scenarioName,
  dateLabel,
  turn,
  treasury,
  resultLabel,
  canEndTurn,
  onEndTurn,
  onToggleSaves,
}: GameHudProps) {
  return (
    <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-card p-2">
      <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        <ArrowLeft /> Ana Menü
      </Link>
      <h1 className="font-display text-lg">{scenarioName}</h1>

      <dl className="ml-auto flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1" title="Hazine (akçe)">
          <dt className="sr-only">Hazine</dt>
          <Coins className="size-4 text-gold" aria-hidden />
          <dd>{treasury}</dd>
        </div>
        <div>
          <dt className="sr-only">Tarih</dt>
          <dd className="font-medium">{dateLabel}</dd>
        </div>
        <div className="text-muted-foreground">
          <dt className="inline">Tur </dt>
          <dd className="inline">{turn}</dd>
        </div>
      </dl>

      {resultLabel && (
        <span className="text-sm font-semibold text-primary">
          {resultLabel}
        </span>
      )}
      <Button size="sm" variant="outline" onClick={onToggleSaves}>
        <Save /> Kaydet
      </Button>
      <Button size="sm" disabled={!canEndTurn} onClick={onEndTurn}>
        <SkipForward /> Turu Bitir
      </Button>
    </header>
  );
}
