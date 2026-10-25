import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import {
  CATEGORY_LABELS,
  searchEntries,
  type EntryCategory,
} from '@/content/encyclopedia/entries';

import type { Route } from './+types/encyclopedia';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Ansiklopedi · ${APP_NAME}` }];
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as EntryCategory[];

export default function Encyclopedia() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<EntryCategory | undefined>();
  const entries = searchEntries(query, category);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 pt-8">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Ana Menü"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl">Ansiklopedi</h1>
        <Link
          to="/sources"
          className={buttonVariants({ variant: 'link', size: 'sm' })}
        >
          Kaynakça
        </Link>
      </header>

      <div className="flex flex-col gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Madde ara: Osman, tımar, Bursa…"
          aria-label="Madde ara"
          className="rounded-md border bg-card px-3 py-2"
        />
        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Kategori"
        >
          <Button
            size="sm"
            variant={category ? 'outline' : 'default'}
            aria-pressed={!category}
            onClick={() => setCategory(undefined)}
          >
            Tümü
          </Button>
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={category === c ? 'default' : 'outline'}
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
            >
              {CATEGORY_LABELS[c]}
            </Button>
          ))}
        </div>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground">Aramana uygun madde yok.</p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                to={`/encyclopedia/${entry.id}`}
                className="block px-4 py-3 hover:bg-muted"
              >
                <span className="font-display text-lg">{entry.title}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  {CATEGORY_LABELS[entry.category]}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {entry.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-muted-foreground">
        Maddeler genel kabul gören bilgilere dayanır; kaynakça eklenmesi ve
        tarihçi denetimi sürüyor.
      </p>
    </main>
  );
}
