import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { getScenarioDefinition, loadScenario } from '@/content/scenarios';
import { PROVINCE_META } from '@/content/world/provinces';
import { legalMoves, objectiveProgress, type GameState } from '@/engine';
import { EventCard } from '@/features/events/components/event-card';
import { ArmyPanel } from '@/features/game/components/army-panel';
import { GameHud } from '@/features/game/components/game-hud';
import { GameLog } from '@/features/game/components/game-log';
import { ObjectivesPanel } from '@/features/game/components/objectives-panel';
import { Panel } from '@/features/game/components/panel';
import { ProvincePanel } from '@/features/game/components/province-panel';
import { formatDate } from '@/features/game/config/season-labels';
import { formatLogEntry } from '@/features/game/lib/format-log-entry';
import { GameMap } from '@/features/map/components/game-map';
import { SaveSlotList } from '@/features/saves/components/save-slot-list';
import {
  isSaveSlot,
  saveRepository,
  SLOT_LABELS,
  type SaveSlotId,
  type SaveSummary,
} from '@/lib/saves/save-repository';
import { useGameStore } from '@/stores/game-store';

import { buildArmyMarkers } from '../lib/army-markers';
import { buildSlotRows } from '../lib/slot-rows';

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
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('slot');
  const slot = isSaveSlot(requested) ? requested : null;

  const start = useGameStore((s) => s.start);
  const load = useGameStore((s) => s.load);
  const status = useGameStore((s) => s.status);
  const game = useGameStore((s) => s.game);
  const loadError = useGameStore((s) => s.loadError);

  // `?slot=` varsa kayıttan devam edilir, yoksa yeni oyun başlar.
  useEffect(() => {
    void (slot ? load(slot) : start(id));
  }, [id, slot, start, load]);

  if (status === 'error') {
    return (
      <main className="grid h-dvh place-items-center p-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <p>Oyun yüklenemedi: {loadError}</p>
          <Link to="/" className={buttonVariants()}>
            Ana Menü
          </Link>
        </div>
      </main>
    );
  }
  if (!game || (!slot && game.scenarioId !== id)) {
    return (
      <main className="grid h-dvh place-items-center">
        <p className="font-display text-2xl text-muted-foreground">
          Yükleniyor…
        </p>
      </main>
    );
  }
  return <GameScreen id={game.scenarioId} game={game} />;
}

function GameScreen({ id, game }: { id: string; game: GameState }) {
  const send = useGameStore((s) => s.send);
  const selectedId = useGameStore((s) => s.selectedProvinceId);
  const selectProvince = useGameStore((s) => s.selectProvince);
  const selectedArmyId = useGameStore((s) => s.selectedArmyId);
  const selectArmy = useGameStore((s) => s.selectArmy);
  const save = useGameStore((s) => s.save);
  const lastSave = useGameStore((s) => s.lastSave);
  const saveError = useGameStore((s) => s.saveError);

  // --- Kayıt menüsü ---
  const [savesOpen, setSavesOpen] = useState(false);
  const [saves, setSaves] = useState<SaveSummary[]>([]);
  useEffect(() => {
    if (!savesOpen) return;
    let cancelled = false;
    saveRepository
      .list()
      .then((list) => !cancelled && setSaves(list))
      .catch(() => !cancelled && setSaves([]));
    return () => {
      cancelled = true;
    };
  }, [savesOpen, lastSave]);

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
  const armyMarkers = useMemo(
    () =>
      buildArmyMarkers(game.armies, {
        center: (pid) => PROVINCE_META[pid]?.center,
        provinceName: (pid) => PROVINCE_META[pid]?.name ?? pid,
        faction: (fid) => setup.world.factions[fid],
        playerFactionId: game.playerFactionId,
      }),
    [game.armies, game.playerFactionId, setup],
  );

  // --- Emir verme: ordu seç, vurgulanan komşuya tıkla ---
  const selectedArmy = selectedArmyId ? game.armies[selectedArmyId] : undefined;
  const destinations = useMemo(
    () => (selectedArmy ? legalMoves(setup.world, game, selectedArmy.id) : []),
    [setup, game, selectedArmy],
  );

  function handleProvinceSelect(provinceId: string | null) {
    if (selectedArmy && provinceId && destinations.includes(provinceId)) {
      void send({ type: 'moveArmy', armyId: selectedArmy.id, to: provinceId });
    }
    selectArmy(null);
    selectProvince(provinceId);
  }

  function handleArmySelect(armyId: string) {
    const army = game.armies[armyId];
    if (!army) return;
    selectProvince(army.provinceId);
    selectArmy(army.ownerId === game.playerFactionId ? armyId : null);
  }

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
  const armiesHere = Object.values(game.armies)
    .filter((a) => a.provinceId === selectedId)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .map((a) => ({
      id: a.id,
      factionName: names.faction(a.ownerId),
      units: a.units,
      morale: a.morale,
      mine: a.ownerId === game.playerFactionId,
      selected: a.id === selectedArmyId,
    }));

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
        onToggleSaves={() => setSavesOpen((open) => !open)}
      />

      <div className="relative flex-1">
        <GameMap
          className="absolute inset-0"
          owners={owners}
          factionColors={factionColors}
          selectedProvinceId={selectedId}
          onProvinceSelect={handleProvinceSelect}
          armies={armyMarkers}
          selectedArmyId={selectedArmyId}
          onArmySelect={handleArmySelect}
          reachableProvinceIds={destinations}
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
            {savesOpen && (
              <Panel title="Kayıt">
                <SaveSlotList
                  rows={buildSlotRows(saves)}
                  onSave={(slot) => void save(slot as SaveSlotId)}
                  loadHref={(slot) => `/play/${id}?slot=${slot}`}
                />
                {saveError ? (
                  <p role="alert" className="mt-2 text-destructive">
                    Kaydedilemedi: {saveError}
                  </p>
                ) : (
                  lastSave && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Son kayıt: {SLOT_LABELS[lastSave.slot]},{' '}
                      {new Date(lastSave.savedAt).toLocaleTimeString('tr-TR')}
                    </p>
                  )
                )}
              </Panel>
            )}
            <GameLog lines={logLines} />
          </div>
          <div className="flex flex-col gap-3 md:mr-12">
            {selectedArmy && (
              <ArmyPanel
                factionName={names.faction(selectedArmy.ownerId)}
                provinceName={names.province(selectedArmy.provinceId)}
                units={selectedArmy.units}
                morale={selectedArmy.morale}
                movesLeft={selectedArmy.movesLeft}
                destinationNames={destinations.map(names.province)}
                onCancel={() => selectArmy(null)}
              />
            )}
            {selected && (
              <ProvincePanel
                name={selected.name}
                country={selected.country}
                ownerName={ownerId ? names.faction(ownerId) : null}
                neighborNames={selected.neighbors.map(names.province)}
                armies={armiesHere}
                onSelectArmy={handleArmySelect}
              />
            )}
          </div>
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
