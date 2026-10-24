import { isWinter, nextDate } from '../calendar';
import type { ExecuteContext } from '../context';
import { RULES } from '../rules';

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
};

/** Kış başında yabancı toprakta kalan ordular asker kaybeder (C1). */
export const winterAttrition: TurnPhase = ({ state, emit }) => {
  if (!isWinter(state.date.season)) return;

  for (const army of Object.values(state.armies)) {
    if (state.provinces[army.provinceId]?.ownerId === army.ownerId) continue;
    const lost = Math.floor(army.troops * RULES.winterAttritionRate);
    if (lost === 0) continue;
    army.troops -= lost;
    emit({
      type: 'winterAttrition',
      armyId: army.id,
      provinceId: army.provinceId,
      lost,
    });
  }
};

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

/** Senaryoya özel zafer koşulları C3'te eklenecek. */
export const checkGameOver: TurnPhase = ({ state, emit }) => {
  const player = state.factions[state.playerFactionId]!;
  const rivalsAlive = Object.values(state.factions).some(
    (f) => f.alive && f.id !== player.id,
  );

  if (!player.alive) {
    state.status = { phase: 'ended', result: 'defeat', reason: 'eliminated' };
  } else if (!rivalsAlive) {
    state.status = {
      phase: 'ended',
      result: 'victory',
      reason: 'lastStanding',
    };
  } else {
    return;
  }
  emit({ type: 'gameEnded', status: state.status });
};

export const TURN_PHASES: TurnPhase[] = [
  advanceCalendar,
  resetArmies,
  winterAttrition,
  collectIncome,
  eliminateFactions,
  checkGameOver,
];
