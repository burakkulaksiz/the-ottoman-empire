import { Download, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

export type SaveSlotRow = {
  slot: string;
  label: string;
  /** Yuva boşsa `null`. */
  summary: { title: string; detail: string } | null;
  /** Elle kaydedilebilir mi? (Otomatik kayıt yuvası değildir.) */
  canSave: boolean;
};

type SaveSlotListProps = {
  rows: SaveSlotRow[];
  /** Verilirse "Kaydet" düğmeleri gösterilir (oyun içi). */
  onSave?: (slot: string) => void;
  /** Dolu yuvanın "Yükle" bağlantısı. */
  loadHref?: (slot: string) => string;
  /** Verilirse "Sil" düğmeleri gösterilir. */
  onDelete?: (slot: string) => void;
};

/** Kayıt yuvalarının listesi: kaydet, yükle ve sil eylemleriyle. */
export function SaveSlotList({
  rows,
  onSave,
  loadHref,
  onDelete,
}: SaveSlotListProps) {
  const t = useT();
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.slot} className="rounded-md border p-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{row.label}</span>
            {!row.summary && (
              <span className="text-xs text-muted-foreground">
                {t('saves.emptySlot')}
              </span>
            )}
          </div>
          {row.summary && (
            <p className="text-sm">
              {row.summary.title}
              <span className="block text-xs text-muted-foreground">
                {row.summary.detail}
              </span>
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            {onSave && row.canSave && (
              <Button
                size="xs"
                variant="outline"
                aria-label={t('saves.saveLabel', { slot: row.label })}
                onClick={() => onSave(row.slot)}
              >
                <Save /> {row.summary ? t('saves.overwrite') : t('saves.save')}
              </Button>
            )}
            {loadHref && row.summary && (
              <Link
                to={loadHref(row.slot)}
                aria-label={t('saves.loadLabel', { slot: row.label })}
                className={buttonVariants({ size: 'xs', variant: 'outline' })}
              >
                <Download /> {t('saves.load')}
              </Link>
            )}
            {onDelete && row.summary && (
              <Button
                size="xs"
                variant="ghost"
                aria-label={t('saves.deleteLabel', { slot: row.label })}
                onClick={() => onDelete(row.slot)}
              >
                <Trash2 /> {t('saves.delete')}
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
