import { ArrowLeft, Coins, Save, ScrollText, SkipForward } from 'lucide-react';
import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

type GameHudProps = {
  scenarioName: string;
  /** Zorluk ve mod, örn. "Zor · Tarihe sadık". */
  settingsLabel?: string;
  dateLabel: string;
  turn: number;
  treasury: number;
  /** Bu tur beklenen vergi geliri ve ordu maaşı gideri (akçe). */
  income: number;
  upkeep: number;
  /** Oyun bittiyse sonucu; sürüyorsa `null`. */
  resultLabel: string | null;
  canEndTurn: boolean;
  onEndTurn: () => void;
  /** Kayıt menüsünü açar/kapatır. */
  onToggleSaves: () => void;
  /** Kroniği açar (D4). */
  onOpenChronicle: () => void;
};

/** Oyun ekranının üst çubuğu: senaryo, tarih, hazine ve tur düğmesi. */
export function GameHud({
  scenarioName,
  settingsLabel,
  dateLabel,
  turn,
  treasury,
  income,
  upkeep,
  resultLabel,
  canEndTurn,
  onEndTurn,
  onToggleSaves,
  onOpenChronicle,
}: GameHudProps) {
  const t = useT();
  return (
    <header className="tezhip-rule flex flex-wrap items-center gap-x-3 gap-y-1 bg-card p-2">
      <Link to="/" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
        <ArrowLeft /> {t('common.mainMenu')}
      </Link>
      <h1 className="font-display text-lg">{scenarioName}</h1>
      {settingsLabel && (
        <span className="text-xs text-muted-foreground">{settingsLabel}</span>
      )}

      <dl className="ml-auto flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1" title={t('hud.treasuryTitle')}>
          <dt className="sr-only">{t('hud.treasury')}</dt>
          <Coins className="size-4 text-gold" aria-hidden />
          <dd>
            {treasury}{' '}
            <span
              className="text-xs text-muted-foreground"
              title={t('hud.incomeTitle')}
            >
              (+{income}
              {upkeep > 0 && ` / −${upkeep}`})
            </span>
          </dd>
        </div>
        <div>
          <dt className="sr-only">{t('hud.date')}</dt>
          <dd className="font-medium">{dateLabel}</dd>
        </div>
        <div className="text-muted-foreground">
          <dt className="inline">{t('hud.turn')} </dt>
          <dd className="inline">{turn}</dd>
        </div>
      </dl>

      {resultLabel && (
        <span className="text-sm font-semibold text-primary">
          {resultLabel}
        </span>
      )}
      <Button size="sm" variant="outline" onClick={onOpenChronicle}>
        <ScrollText /> {t('hud.chronicle')}
      </Button>
      <Button size="sm" variant="outline" onClick={onToggleSaves}>
        <Save /> {t('hud.save')}
      </Button>
      <Button size="sm" disabled={!canEndTurn} onClick={onEndTurn}>
        <SkipForward /> {t('hud.endTurn')}
      </Button>
    </header>
  );
}
