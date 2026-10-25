import { cn } from '@/lib/utils';

/**
 * Tezhip süslemeleri (E3). Klasik Osmanlı tezhibindeki sekiz köşeli yıldız
 * (iki kare) ve altın/lâciverd renklerden esinlenmiş, sade SVG'ler.
 */
export function Rosette({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn('size-4 shrink-0', className)}
    >
      <g className="fill-gold">
        <rect x="5" y="5" width="14" height="14" />
        <rect x="5" y="5" width="14" height="14" transform="rotate(45 12 12)" />
      </g>
      <circle cx="12" cy="12" r="3.2" className="fill-lapis" />
    </svg>
  );
}

/** Ortasında gül olan, iki yana incelen altın çizgi. */
export function TezhipDivider({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('flex w-full items-center gap-2', className)}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold" />
      <Rosette className="size-3" />
      <Rosette />
      <Rosette className="size-3" />
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold" />
    </div>
  );
}

/**
 * "Devlet-i Âliyye" başlığının Osmanlıca yazımı (hat). Ekran okuyucular için
 * gizlidir; asıl başlık hemen ardından Latin harfleriyle gelir.
 */
export function OttomanTitle({ className }: { className?: string }) {
  return (
    <p
      lang="ota"
      dir="rtl"
      aria-hidden="true"
      className={cn(
        'font-hat text-5xl leading-tight font-bold text-gold drop-shadow-sm',
        className,
      )}
    >
      دولت علیه
    </p>
  );
}
