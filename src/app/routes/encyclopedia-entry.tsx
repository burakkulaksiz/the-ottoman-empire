import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { CATEGORY_LABELS, getEntry } from '@/content/encyclopedia/entries';
import { formatCitation } from '@/content/sources';
import { EntryView } from '@/features/encyclopedia/components/entry-view';

import type { Route } from './+types/encyclopedia-entry';

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (!getEntry(params.entryId)) {
    throw new Response('Madde bulunamadı', { status: 404 });
  }
  return { entryId: params.entryId };
}

export function meta({ data }: Route.MetaArgs) {
  const entry = data ? getEntry(data.entryId) : undefined;
  return [{ title: `${entry?.title ?? 'Madde'} · ${APP_NAME}` }];
}

export default function EncyclopediaEntryPage({
  loaderData,
}: Route.ComponentProps) {
  const navigate = useNavigate();
  const entry = getEntry(loaderData.entryId)!;
  const related = entry.related.flatMap((id) => {
    const target = getEntry(id);
    return target ? [{ id, title: target.title }] : [];
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-4 pt-8">
      <Link
        to="/encyclopedia"
        className={buttonVariants({ variant: 'ghost', size: 'sm' })}
      >
        <ArrowLeft /> Ansiklopedi
      </Link>
      <EntryView
        headingLevel={1}
        entry={{
          ...entry,
          categoryLabel: CATEGORY_LABELS[entry.category],
          sources: entry.sources.map(formatCitation),
        }}
        related={related}
        onRelated={(id) => void navigate(`/encyclopedia/${id}`)}
      />
    </main>
  );
}
