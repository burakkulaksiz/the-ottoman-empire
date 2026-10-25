import { Download, Save, Trash2 } from 'lucide-react';
import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';

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
  return (
    <ul className="space-y-2">
      {rows.map((row) => (
        <li key={row.slot} className="rounded-md border p-2">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-medium">{row.label}</span>
            {!row.summary && (
              <span className="text-xs text-muted-foreground">Boş</span>
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
                aria-label={`${row.label}: kaydet`}
                onClick={() => onSave(row.slot)}
              >
                <Save /> {row.summary ? 'Üzerine yaz' : 'Kaydet'}
              </Button>
            )}
            {loadHref && row.summary && (
              <Link
                to={loadHref(row.slot)}
                aria-label={`${row.label}: yükle`}
                className={buttonVariants({ size: 'xs', variant: 'outline' })}
              >
                <Download /> Yükle
              </Link>
            )}
            {onDelete && row.summary && (
              <Button
                size="xs"
                variant="ghost"
                aria-label={`${row.label}: sil`}
                onClick={() => onDelete(row.slot)}
              >
                <Trash2 /> Sil
              </Button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
