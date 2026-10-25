import { isWinter, nextDate } from '../calendar';
import type { ExecuteContext } from '../context';
import { upkeepOf } from '../economy';
import { triggerEvents } from '../events';
import { RULES } from '../rules';
import { advanceSieges } from '../siege';
import type { EndReason } from '../types';
import { armySize, UNIT_DEFS, unitEntries, type Units } from '../units';
import { allObjectivesMet, historicalScore, isTimeUp } from '../victory';

/** Tur sonunda sırayla çalışan adımlar. Yeni mekanikler buraya eklenir. */
export type TurnPhase = (context: ExecuteContext) => void;

export const advanceCalendar: TurnPhase = ({ state, emit }) => {
  state.turn += 1;
  state.date = nextDate(state.date);
  emit({ type: 'turnStarted', date: state.date });
};

export const resetArmies: TurnPhase = ({ state }) => {
  for (const army of Object.values(state.armies)) {
    army.movesLeft = RULES.armyMovesPerTurn;
  }
  for (const province of Object.values(state.provinces)) {
    delete province.recruited;
  }
};

/** Kış başında yabancı toprakta kalan ordular asker kaybeder (C1). */
/** Ordu kendi topraklarında toparlanır, yabancı toprakta moral kaybeder (C4). */
export const adjustMorale: TurnPhase = ({ state }) => {
  for (const army of Object.values(state.armies)) {
    const home = state.provinces[army.provinceId]?.ownerId === army.ownerId;
    army.morale = home
      ? Math.min(RULES.moraleMax, army.morale + RULES.moraleRecoveryHome)
      : Math.max(0, army.morale - RULES.moraleLossAbroad);
  }
};

/** Kış başında yabancı toprakta kalan ordular asker kaybeder (C1). */
export const winterAttrition: TurnPhase = ({ state, emit }) => {
  if (!isWinter(state.date.season)) return;

  for (const army of Object.values(state.armies)) {
    if (state.provinces[army.provinceId]?.ownerId === army.ownerId) continue;
    const before = armySize(army.units);
    const kept: Units = {};
    for (const [type, count] of unitEntries(army.units)) {
      kept[type] = count - Math.floor(count * RULES.winterAttritionRate);
    }
    army.units = kept;
    const lost = before - armySize(kept);
    if (lost === 0) continue;
    emit({
      type: 'winterAttrition',
      armyId: army.id,
      provinceId: army.provinceId,
      lost,
    });
  }
};

/** Süren kuşatmaları ilerletir (C4). */
export const resolveSieges: TurnPhase = (context) => advanceSieges(context);

export const collectIncome: TurnPhase = ({ world, state, emit }) => {
  const income: Record<string, number> = {};
  for (const province of Object.values(state.provinces)) {
    if (!province.ownerId) continue;
    income[province.ownerId] =
      (income[province.ownerId] ?? 0) + world.provinces[province.id]!.baseTax;
  }

  for (const faction of Object.values(state.factions)) {
    const amount = income[faction.id] ?? 0;
    if (!faction.alive || amount === 0) continue;
    faction.treasury += amount;
    emit({ type: 'incomeCollected', factionId: faction.id, amount });
  }
};

/**
 * Kapıkulu maaşları (C6): ödenemezse ordunun morali düşer ve maaşlı
 * birlikten asker kaçar. Tımarlı sipahi ve akıncı hazineden maaş almaz.
 */
export const payUpkeep: TurnPhase = ({ state, emit }) => {
  for (const faction of Object.values(state.factions)) {
    if (!faction.alive) continue;
    const due = upkeepOf(state, faction.id);
    if (due === 0) continue;

    const paid = Math.min(faction.treasury, due);
    faction.treasury -= paid;
    if (paid > 0)
      emit({ type: 'upkeepPaid', factionId: faction.id, amount: paid });
    if (paid === due) continue;

    emit({
      type: 'troopsUnpaid',
      factionId: faction.id,
      shortfall: due - paid,
    });
    for (const army of Object.values(state.armies)) {
      if (army.ownerId !== faction.id) continue;
      const kept: Units = { ...army.units };
      let salaried = false;
      for (const [type, count] of unitEntries(army.units)) {
        if (UNIT_DEFS[type].upkeep === 0) continue;
        salaried = true;
        kept[type] = count - Math.floor(count * RULES.unpaidDesertionRate);
      }
      if (!salaried) continue;
      army.units = kept;
      army.morale = Math.max(0, army.morale - RULES.unpaidMoraleLoss);
    }
  }
};

/** Ne toprağı ne ordusu kalan devlet tarih sahnesinden çekilir. */
export const eliminateFactions: TurnPhase = ({ state, emit }) => {
  const provinces = Object.values(state.provinces);
  const armies = Object.values(state.armies);

  for (const faction of Object.values(state.factions)) {
    if (!faction.alive) continue;
    const hasProvince = provinces.some((p) => p.ownerId === faction.id);
    const hasArmy = armies.some((a) => a.ownerId === faction.id);
    if (!hasProvince && !hasArmy) {
      faction.alive = false;
      emit({ type: 'factionEliminated', factionId: faction.id });
    }
  }
};

/**
 * Oyun sonu (C3): devlet yıkılırsa yenilgi; hedefler tamamlanırsa ya da son
 * ayakta kalan olursa zafer; zaman sınırında hedefi olan senaryoda yenilgi,
 * hedefi olmayan (hayatta kalma) senaryoda zafer.
 */
export const checkGameOver: TurnPhase = ({ world, state, emit }) => {
  const player = state.factions[state.playerFactionId]!;
  const rivalsAlive = Object.values(state.factions).some(
    (f) => f.alive && f.id !== player.id,
  );
  const hasObjectives = (world.objectives ?? []).length > 0;

  let result: 'victory' | 'defeat';
  let reason: EndReason;
  if (!player.alive) {
    [result, reason] = ['defeat', 'eliminated'];
  } else if (allObjectivesMet(world, state)) {
    [result, reason] = ['victory', 'objectives'];
  } else if (!rivalsAlive) {
    [result, reason] = ['victory', 'lastStanding'];
  } else if (isTimeUp(world, state)) {
    [result, reason] = [hasObjectives ? 'defeat' : 'victory', 'timeLimit'];
  } else {
    return;
  }

  const status = {
    phase: 'ended' as const,
    result,
    reason,
    score: player.alive ? historicalScore(world, state) : undefined,
  };
  state.status = status;
  emit({ type: 'gameEnded', status });
};

export const TURN_PHASES: TurnPhase[] = [
  advanceCalendar,
  resetArmies,
  adjustMorale,
  winterAttrition,
  resolveSieges,
  collectIncome,
  payUpkeep,
  eliminateFactions,
  checkGameOver,
  triggerEvents,
];
