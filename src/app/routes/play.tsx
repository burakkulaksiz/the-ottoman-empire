import { useEffect, useMemo, useState } from 'react';

import { APP_NAME } from '@/config/app';
import { getScenarioDefinition, loadScenario } from '@/content/scenarios';
import { PROVINCE_META } from '@/content/world/provinces';
import { objectiveProgress, type GameState } from '@/engine';
import { EventCard } from '@/features/events/components/event-card';
import { GameHud } from '@/features/game/components/game-hud';
import { GameLog } from '@/features/game/components/game-log';
import { ObjectivesPanel } from '@/features/game/components/objectives-panel';
import { ProvincePanel } from '@/features/game/components/province-panel';
import { formatDate } from '@/features/game/config/season-labels';
import { formatLogEntry } from '@/features/game/lib/format-log-entry';
import { GameMap } from '@/features/map/components/game-map';
import { useGameStore } from '@/stores/game-store';

import type { Route } from './+types/play';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Oyun · ${APP_NAME}` }];
}

export function clientLoader({ params }: Route.ClientLoaderArgs) {
  if (!getScenarioDefinition(params.scenarioId)) {
    throw new Response('Senaryo bulunamadı', { status: 404 });
  }
  return { scenarioId: params.scenarioId };
}

export default function Play({ loaderData }: Route.ComponentProps) {
  return <PlayGame key={loaderData.scenarioId} id={loaderData.scenarioId} />;
}

function PlayGame({ id }: { id: string }) {
  const start = useGameStore((s) => s.start);
  const status = useGameStore((s) => s.status);
  const game = useGameStore((s) => s.game);
  const loadError = useGameStore((s) => s.loadError);

  useEffect(() => {
    void start(id);
  }, [id, start]);

  if (status === 'error') {
    return (
      <main className="grid h-dvh place-items-center p-4 text-center">
        <p>Oyun yüklenemedi: {loadError}</p>
      </main>
    );
  }
  if (!game || game.scenarioId !== id) {
    return (
      <main className="grid h-dvh place-items-center">
        <p className="font-display text-2xl text-muted-foreground">
          Yükleniyor…
        </p>
      </main>
    );
  }
  return <GameScreen id={id} game={game} />;
}

function GameScreen({ id, game }: { id: string; game: GameState }) {
  const send = useGameStore((s) => s.send);
  const selectedId = useGameStore((s) => s.selectedProvinceId);
  const setSelectedId = useGameStore((s) => s.selectProvince);

  const scenario = getScenarioDefinition(id)!;
  // Statik dünya (adlar, renkler, hedefler) içerikten okunur; motor yalnızca
  // değişen durumu gönderir.
  const setup = useMemo(() => loadScenario(id), [id]);

  // --- Harita verisi ---
  const owners = useMemo(
    () =>
      Object.fromEntries(
        Object.values(game.provinces).map((p) => [p.id, p.ownerId]),
      ),
    [game.provinces],
  );
  const factionColors = useMemo(
    () =>
      Object.fromEntries(
        Object.values(setup.world.factions).map((f) => [f.id, f.color]),
      ),
    [setup],
  );

  // --- Paneller ---
  const objectives = useMemo(() => {
    const titles = new Map(scenario.objectives?.map((o) => [o.id, o.title]));
    return objectiveProgress(setup.world, game).map((p) => ({
      ...p,
      title: titles.get(p.id) ?? p.id,
    }));
  }, [setup, game, scenario]);

  const names = useMemo(
    () => ({
      province: (pid: string) => PROVINCE_META[pid]?.name ?? pid,
      faction: (fid: string) => setup.world.factions[fid]?.name ?? fid,
      event: (eid: string) =>
        scenario.events?.find((e) => e.id === eid)?.title ?? eid,
    }),
    [setup, scenario],
  );
  const logLines = useMemo(
    () => game.log.flatMap((entry) => formatLogEntry(entry, names) ?? []),
    [game.log, names],
  );

  const selected = selectedId ? PROVINCE_META[selectedId] : undefined;
  const ownerId = selectedId ? game.provinces[selectedId]?.ownerId : null;

  // --- Olay kartı: bekleyen ilk olay; karardan sonra sonucu gösterilir ---
  const [resolved, setResolved] = useState<{
    eventId: string;
    choiceId: string;
  } | null>(null);
  const shownEventId = resolved?.eventId ?? game.events.pending[0];
  const shownEvent = scenario.events?.find((e) => e.id === shownEventId);

  const ended = game.status.phase === 'ended';

  return (
    <main className="flex h-dvh flex-col">
      <GameHud
        scenarioName={scenario.name}
        dateLabel={formatDate(game.date)}
        turn={game.turn}
        treasury={game.factions[game.playerFactionId]?.treasury ?? 0}
        resultLabel={
          game.status.phase === 'ended'
            ? game.status.result === 'victory'
              ? 'Zafer'
              : 'Yenilgi'
            : null
        }
        canEndTurn={!ended && game.events.pending.length === 0}
        onEndTurn={() => void send({ type: 'endTurn' })}
      />

      <div className="relative flex-1">
        <GameMap
          className="absolute inset-0"
          owners={owners}
          factionColors={factionColors}
          selectedProvinceId={selectedId}
          onProvinceSelect={setSelectedId}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-3 p-3 md:flex-row md:items-start">
          <div className="flex min-h-0 flex-col gap-3 md:h-full md:justify-between">
            {objectives.length > 0 && (
              <ObjectivesPanel
                objectives={objectives}
                deadlineLabel={
                  setup.world.endDate ? formatDate(setup.world.endDate) : null
                }
              />
            )}
            <GameLog lines={logLines} />
          </div>
          {selected && (
            <div className="md:mr-12">
              <ProvincePanel
                name={selected.name}
                country={selected.country}
                ownerName={ownerId ? names.faction(ownerId) : null}
                neighborNames={selected.neighbors.map(names.province)}
              />
            </div>
          )}
        </div>

        {shownEvent && (
          <EventCard
            event={shownEvent}
            chosenId={resolved?.choiceId ?? null}
            onChoose={(choiceId) => {
              void send({
                type: 'chooseEvent',
                eventId: shownEvent.id,
                choiceId,
              });
              setResolved({ eventId: shownEvent.id, choiceId });
            }}
            onClose={() => setResolved(null)}
          />
        )}
      </div>
    </main>
  );
}
