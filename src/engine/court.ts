import type { Draft } from 'immer';

import type {
  CommandError,
  ValidationArgs,
  ActionCommand,
} from './commands/types';
import type { ExecuteContext } from './context';
import { random, randomInt } from './rng';
import { RULES } from './rules';
import type { CourtState, FactionId, GameState, Person } from './types';

type AppointVizier = Extract<ActionCommand, { type: 'appointVizier' }>;

export const ageOf = (person: Person, year: number) => year - person.born;

/** Sadakat (istikrar) etiketleri arayüz için eşiklere göre. */
export function stabilityLevel(
  stability: number,
): 'stable' | 'uneasy' | 'unrest' {
  if (stability < RULES.court.revoltThreshold) return 'unrest';
  if (stability < RULES.court.uneasyThreshold) return 'uneasy';
  return 'stable';
}

/**
 * Oyuncunun sarayı varsa sadakati `delta` kadar değiştirir (0–100 arası).
 * Savaş, fetih, maaş gibi olayların yerinde çağrılır.
 */
export function adjustStability(
  state: Draft<GameState>,
  factionId: FactionId,
  delta: number,
) {
  if (!state.court || factionId !== state.playerFactionId) return;
  state.court.stability = Math.max(
    0,
    Math.min(100, state.court.stability + delta),
  );
}

/** Sadakat ve vezirin gelire etkisi (oyuncu için çarpan). */
export function courtIncomeFactor(court: CourtState | undefined): number {
  if (!court) return 1;
  const stability =
    1 +
    (court.stability - RULES.court.neutralStability) / RULES.court.incomeSpan;
  const vizier = court.vizier
    ? 1 + court.vizier.administration * RULES.court.vizierIncomeBonus
    : 1;
  return stability * vizier;
}

/** Sadakatin her tur yaklaştığı değer: hükümdar ve vezirin yönetim becerisi. */
export function stabilityTarget(court: CourtState): number {
  return (
    RULES.court.baseStability +
    court.ruler.administration * RULES.court.rulerAdminWeight +
    (court.vizier?.administration ?? 0) * RULES.court.vizierAdminWeight
  );
}

function deathChance(age: number): number {
  return Math.min(
    RULES.court.maxDeathChance,
    Math.max(0, (age - RULES.court.deathAgeStart) / RULES.court.deathAgeSpan),
  );
}

function newPerson(
  state: Draft<GameState>,
  court: Draft<CourtState>,
  born: number,
): Person {
  const name =
    court.names.length > 0
      ? court.names[randomInt(state, 0, court.names.length - 1)]!
      : 'Bey';
  return {
    id: `person-${state.nextId++}`,
    name,
    born,
    military: randomInt(state, 1, 5),
    administration: randomInt(state, 1, 5),
  };
}

/**
 * Veraset (C8): yetişkin taht hakkı iddia eden şehzadelerden en büyüğü tahta
 * çıkar; birden fazla iddiacı varsa taht kavgası sadakati sarsar ve
 * kaybedenler saraydan uzaklaşır. Şehzade yoksa bir akraba geçer.
 */
function succession(context: ExecuteContext, court: Draft<CourtState>) {
  const { state, emit } = context;
  const year = state.date.year;
  const old = court.ruler;
  emit({ type: 'rulerDied', name: old.name, age: ageOf(old, year) });

  const byAge = [...court.heirs].sort((a, b) => a.born - b.born);
  const claimants = byAge.filter(
    (h) => h.claimsThrone !== false && ageOf(h, year) >= RULES.court.adultAge,
  );

  let heir: Person;
  if (claimants.length > 0) {
    heir = claimants[0]!;
    if (claimants.length > 1) {
      const rivals = claimants.slice(1);
      court.heirs = court.heirs.filter(
        (h) => !rivals.some((r) => r.id === h.id),
      );
      court.stability = Math.max(
        0,
        court.stability - RULES.court.successionStruggleLoss,
      );
      emit({
        type: 'successionStruggle',
        winner: heir.name,
        rivals: rivals.map((r) => r.name),
      });
    }
  } else if (byAge.length > 0) {
    heir = byAge[0]!;
    court.stability = Math.max(0, court.stability - RULES.court.minorHeirLoss);
  } else {
    heir = newPerson(state, court, year - 30);
    court.stability = Math.max(0, court.stability - RULES.court.noHeirLoss);
  }

  court.heirs = court.heirs.filter((h) => h.id !== heir.id);
  court.ruler = { ...heir };
  delete court.ruler.claimsThrone;
  emit({ type: 'newRuler', name: heir.name, age: ageOf(heir, year) });
}

/** Tur aşaması: ölüm, doğum, vezir adayları, sadakat ve isyanlar. */
export function advanceCourt(context: ExecuteContext) {
  const { state, emit } = context;
  const court = state.court;
  if (!court || state.status.phase === 'ended') return;
  const year = state.date.year;

  // Yılda bir (ilkbaharda): hükümdar ve vezirin ölümü, şehzade doğumu.
  if (state.date.season === 'spring') {
    if (random(state) < deathChance(ageOf(court.ruler, year))) {
      succession(context, court);
    }
    if (
      court.vizier &&
      random(state) < deathChance(ageOf(court.vizier, year))
    ) {
      emit({ type: 'vizierDied', name: court.vizier.name });
      court.vizier = null;
    }
    const rulerAge = ageOf(court.ruler, year);
    if (
      rulerAge >= RULES.court.adultAge &&
      rulerAge <= RULES.court.fatherMaxAge &&
      court.heirs.length < RULES.court.maxHeirs &&
      random(state) < RULES.court.birthChance
    ) {
      const child = newPerson(state, court, year);
      court.heirs.push(child);
      emit({ type: 'heirBorn', name: child.name });
    }
    if (!court.vizier && year >= RULES.court.divanFrom) {
      court.candidates = [0, 1].map(() =>
        newPerson(state, court, year - randomInt(state, 35, 55)),
      );
    }
  }

  // Sadakat hedefe doğru yavaşça kayar.
  const target = stabilityTarget(court);
  const step = RULES.court.stabilityDrift;
  court.stability =
    court.stability < target
      ? Math.min(target, court.stability + step)
      : Math.max(target, court.stability - step);

  // İsyan: sadakat eşiğin altındaysa, ordusuz bir bölge elden çıkabilir.
  if (court.stability < RULES.court.revoltThreshold) {
    const chanceOfRevolt =
      (RULES.court.revoltThreshold - court.stability) / 100;
    if (random(state) < chanceOfRevolt) {
      const garrisoned = new Set(
        Object.values(state.armies)
          .filter((a) => a.ownerId === state.playerFactionId)
          .map((a) => a.provinceId),
      );
      const exposed = Object.values(state.provinces)
        .filter(
          (p) => p.ownerId === state.playerFactionId && !garrisoned.has(p.id),
        )
        .map((p) => p.id)
        .sort();
      if (exposed.length > 0) {
        const provinceId = exposed[randomInt(state, 0, exposed.length - 1)]!;
        state.provinces[provinceId]!.ownerId = null;
        delete state.provinces[provinceId]!.siege;
        court.stability = Math.min(
          100,
          court.stability + RULES.court.revoltRelief,
        );
        emit({
          type: 'revolt',
          provinceId,
          kind: year >= RULES.court.celaliFrom ? 'celali' : 'rebellion',
        });
      }
    }
  }
}

export function validateAppointVizier({
  state,
  factionId,
  command,
}: ValidationArgs<AppointVizier>): CommandError | null {
  if (factionId !== state.playerFactionId) return 'notPlayer';
  const court = state.court;
  if (!court) return 'noCourt';
  if (state.date.year < RULES.court.divanFrom) return 'notYet';
  if (!court.candidates.some((c) => c.id === command.personId)) {
    return 'noSuchCandidate';
  }
  if ((state.factions[factionId]?.treasury ?? 0) < RULES.court.vizierCost) {
    return 'notEnoughGold';
  }
  return null;
}

export function executeAppointVizier(
  { state, emit }: ExecuteContext,
  factionId: FactionId,
  command: AppointVizier,
) {
  const court = state.court!;
  const vizier = court.candidates.find((c) => c.id === command.personId)!;
  state.factions[factionId]!.treasury -= RULES.court.vizierCost;
  court.vizier = { ...vizier };
  court.candidates = [];
  emit({ type: 'vizierAppointed', name: vizier.name });
}
