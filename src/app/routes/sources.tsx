import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { ENTRIES } from '@/content/encyclopedia/entries';
import {
  SOURCE_KIND_LABELS,
  SOURCES,
  type SourceKind,
} from '@/content/sources';
import { useT } from '@/hooks/use-t';

import type { Route } from './+types/sources';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Kaynakça · ${APP_NAME}` }];
}

const KINDS = Object.keys(SOURCE_KIND_LABELS) as SourceKind[];

/** Bir kaynağa atıf yapan ansiklopedi maddeleri. */
function citedBy(sourceId: string) {
  return ENTRIES.filter(
    (e) =>
      e.category !== 'place' && e.sources.some((c) => c.source === sourceId),
  );
}

export default function Sources() {
  const t = useT();
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 pt-8">
      <header className="flex items-center gap-3">
        <Link
          to="/encyclopedia"
          aria-label={t('encyclopedia.title')}
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl">{t('encyclopedia.bibliography')}</h1>
      </header>

      <p className="text-sm text-muted-foreground">
        {t('encyclopedia.bibliographyIntro')}
      </p>

      {KINDS.map((kind) => {
        const sources = SOURCES.filter((s) => s.kind === kind);
        if (sources.length === 0) return null;
        return (
          <section key={kind}>
            <h2 className="font-display text-xl">{SOURCE_KIND_LABELS[kind]}</h2>
            <ul className="mt-2 space-y-3">
              {sources.map((source) => {
                const entries = citedBy(source.id);
                return (
                  <li key={source.id} id={source.id}>
                    <p>
                      <span className="font-medium">{source.author}</span>,{' '}
                      <cite>{source.title}</cite>
                      {source.publisher && `, ${source.publisher}`}
                      {source.year && `, ${source.year}`}.
                      {source.url && (
                        <>
                          {' '}
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary underline-offset-4 hover:underline"
                          >
                            {source.url}
                          </a>
                        </>
                      )}
                    </p>
                    {source.note && (
                      <p className="text-sm text-muted-foreground">
                        {source.note}
                      </p>
                    )}
                    {entries.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Atıf yapan maddeler:{' '}
                        {entries.map((e, i) => (
                          <span key={e.id}>
                            {i > 0 && ', '}
                            <Link
                              to={`/encyclopedia/${e.id}`}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              {e.title}
                            </Link>
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}
