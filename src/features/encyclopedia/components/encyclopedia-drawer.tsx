import { BookOpen, X } from 'lucide-react';
import { Link } from 'react-router';

import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

import { EntryView, type EntryViewContent } from './entry-view';

type EncyclopediaDrawerProps = {
  entryId: string;
  entry: EntryViewContent;
  related: { id: string; title: string }[];
  onRelated: (id: string) => void;
  onClose: () => void;
};

/** Oyun içinde, haritadan ayrılmadan açılan ansiklopedi maddesi (D3). */
export function EncyclopediaDrawer({
  entryId,
  entry,
  related,
  onRelated,
  onClose,
}: EncyclopediaDrawerProps) {
  const t = useT();
  return (
    <aside
      aria-label={t('encyclopedia.title')}
      className="pointer-events-auto w-full max-w-sm rounded-lg border bg-card/95 p-4 text-sm text-card-foreground shadow-lg backdrop-blur-sm"
    >
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        <BookOpen className="size-4" aria-hidden />
        <span>{t('encyclopedia.title')}</span>
        <Button
          size="icon-xs"
          variant="ghost"
          className="ml-auto"
          aria-label={t('common.close')}
          onClick={onClose}
        >
          <X />
        </Button>
      </div>
      <div className="max-h-[50dvh] overflow-y-auto">
        <EntryView entry={entry} related={related} onRelated={onRelated} />
      </div>
      <Link
        to={`/encyclopedia/${entryId}`}
        target="_blank"
        className="mt-3 inline-block text-xs text-primary underline-offset-4 hover:underline"
      >
        {t('encyclopedia.openFull')}
      </Link>
    </aside>
  );
}
