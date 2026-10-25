import type {
  ActionCommand,
  CommandError,
  ValidationArgs,
} from './commands/types';
import type { ExecuteContext } from './context';
import { RULES } from './rules';
import type { FactionId, GameState, Relation } from './types';
import { UNIT_DEFS, unitEntries } from './units';

type Diplomatic = Pick<GameState, 'diplomacy'>;

/** İki devletin sırasız çift anahtarı. */
export function pairKey(a: FactionId, b: FactionId): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

/** Kayıtlı ilişki yoksa savaş sayılır (diplomasi tanımlamayan senaryolar). */
export function relationBetween(
  state: Diplomatic,
  a: FactionId,
  b: FactionId,
): Relation {
  if (a === b) return 'alliance';
  return state.diplomacy.relations[pairKey(a, b)] ?? 'war';
}

export function isHostile(
  state: Diplomatic,
  a: FactionId,
  b: FactionId,
): boolean {
  return relationBetween(state, a, b) === 'war';
}

/** Ordulardaki askerlerin saldırı + savunma toplamı: devletin kaba gücü. */
export function militaryPower(
  state: Pick<GameState, 'armies'>,
  factionId: FactionId,
): number {
  let total = 0;
  for (const army of Object.values(state.armies)) {
    if (army.ownerId !== factionId) continue;
    for (const [type, count] of unitEntries(army.units)) {
      total += count * (UNIT_DEFS[type].attack + UNIT_DEFS[type].defense);
    }
  }
  return total;
}

type DeclareWar = Extract<ActionCommand, { type: 'declareWar' }>;
type ProposePeace = Extract<ActionCommand, { type: 'proposePeace' }>;
type ProposeAlliance = Extract<ActionCommand, { type: 'proposeAlliance' }>;
type RespondOffer = Extract<ActionCommand, { type: 'respondOffer' }>;

function checkTarget(
  state: GameState,
  factionId: FactionId,
  target: FactionId,
): CommandError | null {
  if (target === factionId) return 'unknownFaction';
  if (!state.factions[target]?.alive) return 'unknownFaction';
  return null;
}

const proposalKey = (from: FactionId, to: FactionId) => `${from}>${to}`;

export function validateDeclareWar({
  state,
  factionId,
  command,
}: ValidationArgs<DeclareWar>): CommandError | null {
  const error = checkTarget(state, factionId, command.target);
  if (error) return error;
  const relation = relationBetween(state, factionId, command.target);
  if (relation === 'war') return 'alreadyAtWar';
  if (relation === 'alliance') return 'allied';
  return null;
}

export function validateProposePeace({
  state,
  factionId,
  command,
}: ValidationArgs<ProposePeace>): CommandError | null {
  const error = checkTarget(state, factionId, command.target);
  if (error) return error;
  const tribute = command.tribute ?? 0;
  if (!Number.isInteger(tribute) || Math.abs(tribute) > RULES.maxTribute) {
    return 'invalidTribute';
  }
  if (relationBetween(state, factionId, command.target) !== 'war') {
    return 'notAtWar';
  }
  if (
    state.diplomacy.proposed.includes(proposalKey(factionId, command.target))
  ) {
    return 'proposalCooldown';
  }
  return null;
}

export function validateProposeAlliance({
  state,
  factionId,
  command,
}: ValidationArgs<ProposeAlliance>): CommandError | null {
  const error = checkTarget(state, factionId, command.target);
  if (error) return error;
  if (relationBetween(state, factionId, command.target) !== 'peace') {
    return 'notAtPeace';
  }
  if (
    state.diplomacy.proposed.includes(proposalKey(factionId, command.target))
  ) {
    return 'proposalCooldown';
  }
  if ((state.factions[factionId]?.treasury ?? 0) < RULES.dowry) {
    return 'notEnoughGold';
  }
  return null;
}

export function validateRespondOffer({
  state,
  factionId,
  command,
}: ValidationArgs<RespondOffer>): CommandError | null {
  if (factionId !== state.playerFactionId) return 'notPlayer';
  const offer = state.diplomacy.offers.find((o) => o.id === command.offerId);
  if (!offer || offer.to !== factionId) return 'noSuchOffer';
  return null;
}

/**
 * Savaşan taraflardan hangisi barışa razı olur? `responder`, kendi gücü
 * teklif edenin (haraç dahil) gücünün `peaceAcceptRatio` katından fazla
 * değilse kabul eder: güçlü taraf yenilmekte olanı affetmez, ama dengede
 * olanlar anlaşır.
 */
export function acceptsPeace(
  state: GameState,
  responder: FactionId,
  proposer: FactionId,
  tribute: number,
): boolean {
  const proposerStrength =
    militaryPower(state, proposer) + tribute * RULES.tributeWeight;
  return (
    militaryPower(state, responder) <=
    Math.max(0, proposerStrength) * RULES.peaceAcceptRatio
  );
}

/** İttifak: ortak düşmanları olan devletler anlaşır (evlilik ittifakı). */
export function acceptsAlliance(
  state: GameState,
  responder: FactionId,
  proposer: FactionId,
): boolean {
  return Object.values(state.factions).some(
    (f) =>
      f.alive &&
      f.id !== responder &&
      f.id !== proposer &&
      relationBetween(state, f.id, responder) === 'war' &&
      relationBetween(state, f.id, proposer) === 'war',
  );
}

function setRelation(
  { state }: ExecuteContext,
  a: FactionId,
  b: FactionId,
  relation: Relation,
) {
  state.diplomacy.relations[pairKey(a, b)] = relation;
  state.diplomacy.tributes = state.diplomacy.tributes.filter(
    (t) => pairKey(t.payer, t.receiver) !== pairKey(a, b),
  );
}

/** Barış yapılınca iki taraf arasındaki kuşatmalar kalkar. */
function liftSieges(
  { state, emit }: ExecuteContext,
  a: FactionId,
  b: FactionId,
) {
  for (const province of Object.values(state.provinces)) {
    const siege = province.siege;
    if (!siege || !province.ownerId) continue;
    if (pairKey(siege.attackerId, province.ownerId) !== pairKey(a, b)) continue;
    delete province.siege;
    emit({
      type: 'siegeLifted',
      provinceId: province.id,
      attackerId: siege.attackerId,
    });
  }
}

/** `tribute` > 0: `a` öder; < 0: `b` öder; 0: haraçsız barış. */
function makePeace(
  context: ExecuteContext,
  a: FactionId,
  b: FactionId,
  tribute: number,
) {
  setRelation(context, a, b, 'peace');
  if (tribute !== 0) {
    context.state.diplomacy.tributes.push({
      payer: tribute > 0 ? a : b,
      receiver: tribute > 0 ? b : a,
      amount: Math.abs(tribute),
    });
  }
  liftSieges(context, a, b);
  context.emit({ type: 'peaceMade', a, b, tribute });
}

export function executeDeclareWar(
  context: ExecuteContext,
  factionId: FactionId,
  command: DeclareWar,
) {
  setRelation(context, factionId, command.target, 'war');
  context.emit({ type: 'warDeclared', by: factionId, target: command.target });
}

export function executeProposePeace(
  context: ExecuteContext,
  factionId: FactionId,
  command: ProposePeace,
) {
  const { state, emit } = context;
  const tribute = command.tribute ?? 0;
  state.diplomacy.proposed.push(proposalKey(factionId, command.target));

  // Oyuncuya gelen teklif: karar oyuncunundur.
  if (command.target === state.playerFactionId) {
    const offerId = `offer-${state.nextId++}`;
    state.diplomacy.offers.push({
      id: offerId,
      from: factionId,
      to: command.target,
      kind: 'peace',
      tribute,
    });
    emit({
      type: 'offerMade',
      offerId,
      from: factionId,
      to: command.target,
      tribute,
    });
    return;
  }

  if (acceptsPeace(state as GameState, command.target, factionId, tribute)) {
    makePeace(context, factionId, command.target, tribute);
  } else {
    emit({
      type: 'proposalRefused',
      from: factionId,
      to: command.target,
      kind: 'peace',
    });
  }
}

export function executeProposeAlliance(
  context: ExecuteContext,
  factionId: FactionId,
  command: ProposeAlliance,
) {
  const { state, emit } = context;
  state.diplomacy.proposed.push(proposalKey(factionId, command.target));

  if (!acceptsAlliance(state as GameState, command.target, factionId)) {
    emit({
      type: 'proposalRefused',
      from: factionId,
      to: command.target,
      kind: 'alliance',
    });
    return;
  }
  // Çeyiz: evlilik ittifakının bedeli karşı tarafa geçer.
  state.factions[factionId]!.treasury -= RULES.dowry;
  state.factions[command.target]!.treasury += RULES.dowry;
  setRelation(context, factionId, command.target, 'alliance');
  emit({ type: 'allianceFormed', a: factionId, b: command.target });
}

export function executeRespondOffer(
  context: ExecuteContext,
  _factionId: FactionId,
  command: RespondOffer,
) {
  const { state, emit } = context;
  const offer = state.diplomacy.offers.find((o) => o.id === command.offerId)!;
  state.diplomacy.offers = state.diplomacy.offers.filter(
    (o) => o.id !== command.offerId,
  );

  if (command.accept) {
    makePeace(context, offer.from, offer.to, offer.tribute);
  } else {
    emit({ type: 'offerRejected', offerId: offer.id, from: offer.from });
  }
}

/** Tur aşaması: yıllık değil, tur başına haraç ödemeleri. */
export function payTributes({ state, emit }: ExecuteContext) {
  for (const tribute of state.diplomacy.tributes) {
    const payer = state.factions[tribute.payer];
    const receiver = state.factions[tribute.receiver];
    if (!payer?.alive || !receiver?.alive) continue;
    const paid = Math.min(payer.treasury, tribute.amount);
    if (paid === 0) continue;
    payer.treasury -= paid;
    receiver.treasury += paid;
    emit({
      type: 'tributePaid',
      payer: tribute.payer,
      receiver: tribute.receiver,
      amount: paid,
    });
  }
}
