import { ArrowLeft } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import {
  DEFAULT_SCENARIO_ID,
  getScenarioDefinition,
  loadScenario,
} from '@/content/scenarios';
import { PROVINCE_META } from '@/content/world/provinces';
import { createGame, seedFromString, type Season } from '@/engine';
import { GameMap } from '@/features/map/components/game-map';

import type { Route } from './+types/play';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Oyun · ${APP_NAME}` }];
}

const SEASON_LABELS: Record<Season, string> = {
  spring: 'İlkbahar',
  summer: 'Yaz',
  autumn: 'Sonbahar',
  winter: 'Kış',
};

export default function Play() {
  // Geçici: motor–arayüz köprüsü (A3) gelene kadar oyun burada kurulur.
  const { setup, game } = useMemo(() => {
    const setup = loadScenario(DEFAULT_SCENARIO_ID);
    return {
      setup,
      game: createGame(setup, { seed: seedFromString(DEFAULT_SCENARIO_ID) }),
    };
  }, []);
  const scenario = getScenarioDefinition(DEFAULT_SCENARIO_ID);

  const owners = useMemo(
    () =>
      Object.fromEntries(
        Object.values(game.provinces).map((p) => [p.id, p.ownerId]),
      ),
    [game],
  );
  const factionColors = useMemo(
    () =>
      Object.fromEntries(
        Object.values(setup.world.factions).map((f) => [f.id, f.color]),
      ),
    [setup],
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = selectedId ? PROVINCE_META[selectedId] : undefined;
  const ownerId = selectedId ? game.provinces[selectedId]?.ownerId : null;
  const owner = ownerId ? setup.world.factions[ownerId] : undefined;

  return (
    <main className="flex h-dvh flex-col">
      <header className="flex items-center gap-2 border-b p-2">
        <Link
          to="/"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft /> Ana Menü
        </Link>
        <h1 className="font-display text-lg">{scenario?.name}</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {SEASON_LABELS[game.date.season]} {game.date.year}
        </span>
      </header>
      <div className="relative flex-1">
        <GameMap
          className="absolute inset-0"
          owners={owners}
          factionColors={factionColors}
          selectedProvinceId={selectedId}
          onProvinceSelect={setSelectedId}
        />
        {selected && (
          <aside className="absolute bottom-4 left-4 max-w-xs rounded-lg border bg-card/95 p-3 text-card-foreground shadow-md">
            <h2 className="font-display text-xl">{selected.name}</h2>
            <p className="text-sm text-muted-foreground">
              {selected.country} · {owner?.name ?? 'Sahipsiz'}
            </p>
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
