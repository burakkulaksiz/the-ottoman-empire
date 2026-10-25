import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

type PanelProps = {
  title: string;
  /** Başlıkta açık mı başlasın? Kapalıyken yalnızca başlık görünür. */
  defaultOpen?: boolean;
  className?: string;
  children: ReactNode;
};

/** Haritanın üstünde yüzen, başlığına basınca daralan yan panel. */
export function Panel({
  title,
  defaultOpen = true,
  className,
  children,
}: PanelProps) {
  return (
    <details
      open={defaultOpen}
      className={cn(
        'pointer-events-auto w-full max-w-xs rounded-lg border bg-card/95 text-card-foreground shadow-md backdrop-blur-sm',
        className,
      )}
    >
      <summary className="cursor-pointer px-3 py-2 font-display text-lg select-none">
        {title}
      </summary>
      <div className="max-h-[40dvh] overflow-y-auto px-3 pb-3 text-sm">
        {children}
      </div>
    </details>
  );
}
