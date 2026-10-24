import { ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { PROVINCE_META } from '@/content/world/provinces';
import { GameMap } from '@/features/map/components/game-map';

import type { Route } from './+types/play';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Oyun · ${APP_NAME}` }];
}

export default function Play() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? PROVINCE_META[selectedId] : undefined;

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b p-2">
        <Link
          to="/"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft /> Ana Menü
        </Link>
      </header>
      <div className="relative flex-1">
        <GameMap
          className="absolute inset-0"
          selectedProvinceId={selectedId}
          onProvinceSelect={setSelectedId}
        />
        {selected && (
          <aside className="absolute bottom-4 left-4 max-w-xs rounded-lg border bg-card/95 p-3 text-card-foreground shadow-md">
            <h2 className="font-display text-xl">{selected.name}</h2>
            <p className="text-sm text-muted-foreground">{selected.country}</p>
            <p className="mt-2 text-sm">
              <span className="font-medium">Komşular: </span>
              {selected.neighbors
                .map((id) => PROVINCE_META[id]?.name ?? id)
                .join(', ') || 'yok (ada)'}
            </p>
          </aside>
        )}
      </div>
    </main>
  );
}
