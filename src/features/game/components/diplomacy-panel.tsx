import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

import { Panel } from './panel';

export type DiplomacyAction = {
  id: string;
  label: string;
  /** Yapılamıyorsa nedeni (düğme pasif olur). */
  disabledReason?: string;
};

export type DiplomacyRow = {
  id: string;
  name: string;
  color: string;
  relation: 'war' | 'peace' | 'alliance';
  /** Haraç durumu gibi kısa not. */
  note?: string;
  actions: DiplomacyAction[];
};

export type DiplomacyOffer = { id: string; text: string };

type DiplomacyPanelProps = {
  rows: DiplomacyRow[];
  offers: DiplomacyOffer[];
  /** Son diplomatik girişimlerin sonucu (örn. "Bizans teklifini reddetti"). */
  feedback: string[];
  onAction: (factionId: string, actionId: string) => void;
  onRespond: (offerId: string, accept: boolean) => void;
};

const RELATION_CLASSES = {
  war: 'text-destructive',
  peace: 'text-muted-foreground',
  alliance: 'text-primary',
} as const;

/** Devletlerle ilişkiler, teklifler ve diplomatik eylemler (C7). */
export function DiplomacyPanel({
  rows,
  offers,
  feedback,
  onAction,
  onRespond,
}: DiplomacyPanelProps) {
  const t = useT();
  return (
    // Teklif gelince panel açık başlasın.
    <Panel
      key={offers.length > 0 ? 'offers' : 'plain'}
      title={
        offers.length > 0
          ? t('diplomacy.titleWithOffers', { count: offers.length })
          : t('diplomacy.title')
      }
      defaultOpen={offers.length > 0}
    >
      {offers.length > 0 && (
        <ul className="mb-3 space-y-2">
          {offers.map((offer) => (
            <li key={offer.id} className="rounded-md border border-primary p-2">
              <p>{offer.text}</p>
              <div className="mt-2 flex gap-2">
                <Button size="xs" onClick={() => onRespond(offer.id, true)}>
                  {t('diplomacy.accept')}
                </Button>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => onRespond(offer.id, false)}
                >
                  {t('diplomacy.reject')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id}>
            <div className="flex items-center gap-2">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ backgroundColor: row.color }}
                aria-hidden
              />
              <span className="font-medium">{row.name}</span>
              <span
                className={`ml-auto text-xs ${RELATION_CLASSES[row.relation]}`}
              >
                {t(`diplomacy.${row.relation}`)}
              </span>
            </div>
            {row.note && (
              <p className="text-xs text-muted-foreground">{row.note}</p>
            )}
            {row.actions.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {row.actions.map((action) => (
                  <Button
                    key={action.id}
                    size="xs"
                    variant="outline"
                    disabled={Boolean(action.disabledReason)}
                    title={action.disabledReason}
                    aria-label={`${row.name}: ${action.label}`}
                    onClick={() => onAction(row.id, action.id)}
                  >
                    {action.label}
                  </Button>
                ))}
              </div>
            )}
          </li>
        ))}
      </ul>

      {feedback.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs" aria-live="polite">
          {feedback.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
