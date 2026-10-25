import type { FeatureCollection } from 'geojson';
import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { ACHIEVEMENTS } from '@/content/achievements';
import {
  CATEGORY_LABELS,
  getEntry,
  placeEntryId,
} from '@/content/encyclopedia/entries';
import { getQuiz, nextQuiz } from '@/content/quizzes';
import { getScenarioDefinition, loadScenario } from '@/content/scenarios';
import { formatCitation } from '@/content/sources';
import { PLACES, placesIn } from '@/content/world/places';
import { PROVINCE_META } from '@/content/world/provinces';
import { terrainOf } from '@/content/world/terrain';
import { routePath, TRADE_ROUTES } from '@/content/world/trade-routes';
import {
  ageOf,
  incomeOf,
  RULES,
  stabilityLevel,
  legalMoves,
  objectiveProgress,
  recruitOptions,
  upkeepOf,
  type CommandError,
  type GameState,
  type Person,
  type UnitType,
} from '@/engine';
import { EncyclopediaDrawer } from '@/features/encyclopedia/components/encyclopedia-drawer';
import { EventCard } from '@/features/events/components/event-card';
import { ArmyPanel } from '@/features/game/components/army-panel';
import { ChronicleCard } from '@/features/game/components/chronicle-card';
import { CourtPanel } from '@/features/game/components/court-panel';
import { DecisionsPanel } from '@/features/game/components/decisions-panel';
import { DiplomacyPanel } from '@/features/game/components/diplomacy-panel';
import { GameHud } from '@/features/game/components/game-hud';
import { GameLog } from '@/features/game/components/game-log';
import { GameOverCard } from '@/features/game/components/game-over-card';
import { ObjectivesPanel } from '@/features/game/components/objectives-panel';
import { Panel } from '@/features/game/components/panel';
import { ProvincePanel } from '@/features/game/components/province-panel';
import { TutorialPanel } from '@/features/game/components/tutorial-panel';
import { endReasonLabel } from '@/features/game/config/end-reasons';
import { formatDate } from '@/features/game/config/season-labels';
import { unitLabel } from '@/features/game/config/unit-labels';
import { formatLogEntry } from '@/features/game/lib/format-log-entry';
import { GameMap } from '@/features/map/components/game-map';
import { QuizCard } from '@/features/quiz/components/quiz-card';
import { SaveSlotList } from '@/features/saves/components/save-slot-list';
import { useT } from '@/hooks/use-t';
import { LOCALE_TAGS, type MessageKey } from '@/lib/i18n';
import {
  isSaveSlot,
  saveRepository,
  type SaveSlotId,
  type SaveSummary,
} from '@/lib/saves/save-repository';
import { useGameStore } from '@/stores/game-store';
import { useLocale } from '@/stores/locale-store';

import { buildArmyMarkers } from '../lib/army-markers';
import { buildChronicle } from '../lib/chronicle';
import { summarizeDecisions } from '../lib/decisions';
import {
  buildDiplomacyRows,
  buildOffers,
  diplomacyCommand,
} from '../lib/diplomacy-rows';
import { settingsFromSearch, settingsLabel } from '../lib/game-settings';
import { buildSlotRows, slotLabel } from '../lib/slot-rows';
import {
  NO_TUTORIAL_FLAGS,
  tutorialProgress,
  type TutorialFlags,
} from '../lib/tutorial';

import type { Route } from './+types/play';

/** Devşirme düğmesi pasifken gösterilen neden (çeviri anahtarı). */
const RECRUIT_ERRORS: Partial<Record<CommandError, MessageKey>> = {
  notEnoughGold: 'recruitErrors.notEnoughGold',
  recruitLimit: 'recruitErrors.recruitLimit',
  besieged: 'recruitErrors.besieged',
  notOwner: 'recruitErrors.notOwner',
  eventPending: 'recruitErrors.eventPending',
};

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

function courtPerson(person: Person, year: number) {
  return {
    id: person.id,
    name: person.name,
    age: ageOf(person, year),
    military: person.military,
    administration: person.administration,
  };
}

function PlayGame({ id }: { id: string }) {
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('slot');
  const slot = isSaveSlot(requested) ? requested : null;
  const { difficulty, historicalMode } = settingsFromSearch(searchParams);

  const start = useGameStore((s) => s.start);
  const load = useGameStore((s) => s.load);
  const status = useGameStore((s) => s.status);
  const game = useGameStore((s) => s.game);
  const loadError = useGameStore((s) => s.loadError);
  const t = useT();

  // `?slot=` varsa kayıttan devam edilir, yoksa yeni oyun başlar.
  useEffect(() => {
    void (slot
      ? load(slot)
      : start(id, { settings: { difficulty, historicalMode } }));
  }, [id, slot, start, load, difficulty, historicalMode]);

  if (status === 'error') {
    return (
      <main className="grid h-dvh place-items-center p-4 text-center">
        <div className="flex flex-col items-center gap-4">
          <p>{t('errors.gameLoadFailed', { reason: loadError ?? '' })}</p>
          <Link to="/" className={buttonVariants()}>
            {t('common.mainMenu')}
          </Link>
        </div>
      </main>
    );
  }
  if (!game || (!slot && game.scenarioId !== id)) {
    return (
      <main className="grid h-dvh place-items-center">
        <p className="font-display text-2xl text-muted-foreground">
          {t('common.loading')}
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
  const t = useT();
  const locale = useLocale();

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
      buildArmyMarkers(
        game.armies,
        {
          center: (pid) => PROVINCE_META[pid]?.center,
          provinceName: (pid) => PROVINCE_META[pid]?.name ?? pid,
          faction: (fid) => setup.world.factions[fid],
          playerFactionId: game.playerFactionId,
        },
        t,
      ),
    [game.armies, game.playerFactionId, setup, t],
  );

  // Şehir/kale/boğaz işaretleri ve ticaret yolları (değişmez içerik).
  const placeMarkers = useMemo(
    () =>
      PLACES.map((p) => ({
        id: p.id,
        name: p.name,
        position: p.position,
        kind: p.kind,
        fortification: p.fortification ?? 0,
        title: p.fortification
          ? t('panels.placeFortified', { name: p.name, level: p.fortification })
          : p.name,
      })),
    [t],
  );
  const tradeRoutes = useMemo<FeatureCollection>(
    () => ({
      type: 'FeatureCollection',
      features: TRADE_ROUTES.map((route) => ({
        type: 'Feature',
        properties: { id: route.id, name: route.name },
        geometry: { type: 'LineString', coordinates: routePath(route) },
      })),
    }),
    [],
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
    const own = army.ownerId === game.playerFactionId;
    selectArmy(own ? armyId : null);
    if (own) markTutorial('armySelected');
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
    () => game.log.flatMap((entry) => formatLogEntry(entry, names, t) ?? []),
    [game.log, names, t],
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

  // --- Devşirme: yalnızca oyuncunun kendi bölgelerinde ---
  const recruit =
    selectedId &&
    ownerId === game.playerFactionId &&
    game.status.phase !== 'ended'
      ? {
          options: recruitOptions(
            setup.world,
            game,
            game.playerFactionId,
            selectedId,
          ).map((o) => ({
            unit: o.unit,
            label: unitLabel(o.unit, t),
            cost: o.cost,
            disabledReason: o.error
              ? t(RECRUIT_ERRORS[o.error] ?? 'recruitErrors.notOwner')
              : undefined,
          })),
          onRecruit: (unit: string) =>
            void send({
              type: 'recruit',
              provinceId: selectedId,
              unit: unit as UnitType,
            }),
        }
      : undefined;

  // --- Olay kartı: bekleyen ilk olay; karardan sonra sonucu gösterilir ---
  const [resolved, setResolved] = useState<{
    eventId: string;
    choiceId: string;
  } | null>(null);
  const shownEventId = resolved?.eventId ?? game.events.pending[0];
  const shownEvent = scenario.events?.find((e) => e.id === shownEventId);

  const ended = game.status.phase === 'ended';

  // --- Karar defteri ve oyun sonu ---
  const decisions = useMemo(
    () => summarizeDecisions(scenario.events ?? [], game.events.choices),
    [scenario, game.events.choices],
  );
  const [gameOverDismissed, setGameOverDismissed] = useState(false);

  // --- Öğretici (D7): arayüzde yapılan adımlar burada izlenir ---
  const [tutorialFlags, setTutorialFlags] =
    useState<TutorialFlags>(NO_TUTORIAL_FLAGS);
  const markTutorial = (flag: keyof TutorialFlags) =>
    setTutorialFlags((f) => (f[flag] ? f : { ...f, [flag]: true }));
  const tutorial = scenario.tutorial
    ? tutorialProgress(scenario.tutorial, game, tutorialFlags)
    : null;

  // --- Başarım bildirimi (D6) ---
  const newAchievements = useGameStore((s) => s.newAchievements);
  const dismissAchievement = useGameStore((s) => s.dismissAchievement);
  const toast = ACHIEVEMENTS.find((a) => a.id === newAchievements[0]);

  // --- Bilgi yarışması (D5): her ilkbahar bir soru; geçilebilir ---
  const [quizState, setQuizState] = useState<{
    id: string;
    chosen: number | null;
  } | null>(null);
  const [quizSkippedTurn, setQuizSkippedTurn] = useState<number | null>(null);
  const offeredQuiz =
    game.status.phase === 'playing' &&
    game.turn > 1 &&
    game.date.season === 'spring' &&
    game.events.pending.length === 0 &&
    quizSkippedTurn !== game.turn
      ? nextQuiz(game)
      : undefined;
  const shownQuiz = quizState ? getQuiz(quizState.id) : offeredQuiz;

  // --- Kronik (D4) ---
  const [chronicleOpen, setChronicleOpen] = useState(false);

  // --- Ansiklopedi (D3): haritadan ayrılmadan açılır ---
  const [entryId, setEntryId] = useState<string | null>(null);
  const entry = entryId ? getEntry(entryId) : undefined;
  const openEntry = (id: string) => {
    setEntryId(id);
    markTutorial('encyclopediaOpened');
  };

  // --- Diplomasi ---
  const lastLog = useGameStore((s) => s.lastLog);
  const diplomacyFeedback = useMemo(
    () =>
      lastLog
        .filter((e) =>
          [
            'warDeclared',
            'peaceMade',
            'allianceFormed',
            'proposalRefused',
            'offerRejected',
          ].includes(e.type),
        )
        .flatMap((e) => formatLogEntry(e, names, t) ?? []),
    [lastLog, names, t],
  );

  return (
    <main className="flex h-dvh flex-col">
      <GameHud
        scenarioName={scenario.name}
        settingsLabel={settingsLabel(game.settings, t)}
        dateLabel={formatDate(game.date, t)}
        turn={game.turn}
        treasury={game.factions[game.playerFactionId]?.treasury ?? 0}
        income={incomeOf(setup.world, game, game.playerFactionId)}
        upkeep={upkeepOf(game, game.playerFactionId)}
        resultLabel={
          game.status.phase === 'ended'
            ? t(
                game.status.result === 'victory'
                  ? 'common.victory'
                  : 'common.defeat',
              )
            : null
        }
        canEndTurn={!ended && game.events.pending.length === 0}
        onEndTurn={() => void send({ type: 'endTurn' })}
        onToggleSaves={() => setSavesOpen((open) => !open)}
        onOpenChronicle={() => {
          setChronicleOpen(true);
          markTutorial('chronicleOpened');
        }}
      />

      <div className="relative flex-1">
        <GameMap
          className="absolute inset-0"
          owners={owners}
          factionColors={factionColors}
          selectedProvinceId={selectedId}
          onProvinceSelect={handleProvinceSelect}
          places={placeMarkers}
          onPlaceSelect={(placeId) => openEntry(placeEntryId(placeId))}
          tradeRoutes={tradeRoutes}
          armies={armyMarkers}
          selectedArmyId={selectedArmyId}
          onArmySelect={handleArmySelect}
          reachableProvinceIds={destinations}
        />

        <div className="pointer-events-none absolute inset-0 flex flex-col justify-between gap-3 p-3 md:flex-row md:items-start">
          <div className="flex min-h-0 flex-col gap-3 md:h-full md:justify-between">
            {tutorial && (
              <TutorialPanel
                steps={tutorial.steps}
                currentId={tutorial.current?.id ?? null}
              />
            )}
            {objectives.length > 0 && (
              <ObjectivesPanel
                objectives={objectives}
                deadlineLabel={
                  setup.world.endDate
                    ? formatDate(setup.world.endDate, t)
                    : null
                }
              />
            )}
            {savesOpen && (
              <Panel title={t('panels.saveMenu')}>
                <SaveSlotList
                  rows={buildSlotRows(saves, t, LOCALE_TAGS[locale])}
                  onSave={(slot) => void save(slot as SaveSlotId)}
                  loadHref={(slot) => `/play/${id}?slot=${slot}`}
                />
                {saveError ? (
                  <p role="alert" className="mt-2 text-destructive">
                    {t('panels.saveFailed', { reason: saveError })}
                  </p>
                ) : (
                  lastSave && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t('panels.lastSave', {
                        slot: slotLabel(lastSave.slot, t),
                        time: new Date(lastSave.savedAt).toLocaleTimeString(
                          LOCALE_TAGS[locale],
                        ),
                      })}
                    </p>
                  )
                )}
              </Panel>
            )}
            {game.court && (
              <CourtPanel
                ruler={courtPerson(game.court.ruler, game.date.year)}
                heirs={game.court.heirs.map((h) =>
                  courtPerson(h, game.date.year),
                )}
                vizier={
                  game.court.vizier
                    ? courtPerson(game.court.vizier, game.date.year)
                    : null
                }
                candidates={game.court.candidates.map((c) =>
                  courtPerson(c, game.date.year),
                )}
                stability={Math.round(game.court.stability)}
                stabilityLabel={t(
                  `court.${stabilityLevel(game.court.stability)}`,
                )}
                vizierNote={
                  game.date.year < RULES.court.divanFrom
                    ? t('court.noDivan')
                    : t('court.candidatesInSpring')
                }
                vizierCost={RULES.court.vizierCost}
                canAffordVizier={
                  (game.factions[game.playerFactionId]?.treasury ?? 0) >=
                  RULES.court.vizierCost
                }
                onAppointVizier={(personId) =>
                  void send({ type: 'appointVizier', personId })
                }
              />
            )}
            <DiplomacyPanel
              rows={buildDiplomacyRows(setup.world, game, t)}
              offers={buildOffers(setup.world, game, t)}
              feedback={diplomacyFeedback}
              onAction={(target, actionId) => {
                const command = diplomacyCommand(target, actionId);
                if (command) void send(command);
              }}
              onRespond={(offerId, accept) =>
                void send({ type: 'respondOffer', offerId, accept })
              }
            />
            <DecisionsPanel
              rows={decisions.rows.map((r) => ({ id: r.eventId, ...r }))}
            />
            <GameLog lines={logLines} />
          </div>
          <div className="flex flex-col gap-3 md:mr-12">
            {entry && (
              <EncyclopediaDrawer
                entryId={entry.id}
                entry={{
                  ...entry,
                  categoryLabel: CATEGORY_LABELS[entry.category],
                  sources: entry.sources.map(formatCitation),
                }}
                related={entry.related.flatMap((id) => {
                  const target = getEntry(id);
                  return target ? [{ id, title: target.title }] : [];
                })}
                onRelated={openEntry}
                onClose={() => setEntryId(null)}
              />
            )}
            {selectedArmy && (
              <ArmyPanel
                factionName={names.faction(selectedArmy.ownerId)}
                provinceName={names.province(selectedArmy.provinceId)}
                units={selectedArmy.units}
                morale={selectedArmy.morale}
                movesLeft={selectedArmy.movesLeft}
                destinations={destinations.map((id) => ({
                  id,
                  name: names.province(id),
                }))}
                onMove={(provinceId) => handleProvinceSelect(provinceId)}
                onCancel={() => selectArmy(null)}
              />
            )}
            {selected && (
              <ProvincePanel
                name={selected.name}
                country={selected.country}
                ownerName={ownerId ? names.faction(ownerId) : null}
                neighborNames={selected.neighbors.map(names.province)}
                terrainLabel={
                  selectedId ? t(`terrain.${terrainOf(selectedId)}`) : undefined
                }
                fortification={
                  setup.world.provinces[selectedId!]?.fortification ?? 0
                }
                places={
                  selectedId
                    ? placesIn(selectedId).map((p) => ({
                        id: p.id,
                        name: p.name,
                      }))
                    : []
                }
                onPlaceSelect={(placeId) => openEntry(placeEntryId(placeId))}
                armies={armiesHere}
                onSelectArmy={handleArmySelect}
                recruit={recruit}
              />
            )}
          </div>
        </div>

        {game.status.phase === 'ended' && !gameOverDismissed && (
          <GameOverCard
            content={{
              result: game.status.result,
              reason: endReasonLabel(game.status.reason, t),
              score: game.status.score,
              decisions,
              historicalNote: scenario.historical?.note,
            }}
            onDismiss={() => setGameOverDismissed(true)}
          />
        )}
        {toast && (
          <div
            role="status"
            className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3 rounded-lg border border-gold bg-card px-4 py-2 shadow-lg"
          >
            <span className="font-display text-lg">
              {t('panels.achievement', { title: toast.title })}
            </span>
            <span className="text-sm text-muted-foreground">
              {toast.description}
            </span>
            <button
              type="button"
              aria-label={t('panels.dismiss')}
              className="text-muted-foreground hover:text-foreground"
              onClick={() => dismissAchievement(toast.id)}
            >
              ×
            </button>
          </div>
        )}
        {shownQuiz && !shownEvent && (
          <QuizCard
            quiz={shownQuiz}
            chosen={quizState?.chosen ?? null}
            reward={RULES.quizReward}
            onChoose={(choice) => {
              setQuizState({ id: shownQuiz.id, chosen: choice });
              // İlkbahar başına tek soru: cevaptan sonra yenisi gelmez.
              setQuizSkippedTurn(game.turn);
              void send({ type: 'answerQuiz', quizId: shownQuiz.id, choice });
            }}
            onSkip={() => setQuizSkippedTurn(game.turn)}
            onReadMore={() => {
              openEntry(shownQuiz.entryId);
              setQuizState(null);
            }}
            onClose={() => setQuizState(null)}
          />
        )}
        {chronicleOpen && (
          <ChronicleCard
            rows={buildChronicle(game, scenario, names, t)}
            onClose={() => setChronicleOpen(false)}
          />
        )}
        {shownEvent && (
          <EventCard
            event={shownEvent}
            chosenId={resolved?.choiceId ?? null}
            revealHistorical={game.settings.historicalMode}
            sources={(shownEvent.historical.sources ?? []).map(formatCitation)}
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
