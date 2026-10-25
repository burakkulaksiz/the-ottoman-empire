import {
  checkCommand,
  relationBetween,
  RULES,
  type ActionCommand,
  type CommandError,
  type GameState,
  type World,
} from '@/engine';
import type {
  DiplomacyOffer,
  DiplomacyRow,
} from '@/features/game/components/diplomacy-panel';

/** Barış önerilerinde teklif edilen/istenen haraç (akçe/tur). */
export const TRIBUTE_OFFER = 5;

const ERRORS: Partial<Record<CommandError, string>> = {
  proposalCooldown: 'Bu tur bu devlete zaten teklif yaptın',
  notEnoughGold: 'Yeterli akçe yok',
  allied: 'Müttefikine savaş ilan edemezsin',
  gameOver: 'Oyun bitti',
};

/** Paneldeki bir eylem kimliğinin motor komutu. */
export function diplomacyCommand(
  target: string,
  actionId: string,
): ActionCommand | null {
  switch (actionId) {
    case 'war':
      return { type: 'declareWar', target };
    case 'peace':
      return { type: 'proposePeace', target };
    case 'peace-pay':
      return { type: 'proposePeace', target, tribute: TRIBUTE_OFFER };
    case 'peace-demand':
      return { type: 'proposePeace', target, tribute: -TRIBUTE_OFFER };
    case 'alliance':
      return { type: 'proposeAlliance', target };
    default:
      return null;
  }
}

const ACTIONS = {
  war: [
    { id: 'peace', label: 'Barış öner' },
    { id: 'peace-pay', label: `Haraç vererek barış (${TRIBUTE_OFFER}/tur)` },
    {
      id: 'peace-demand',
      label: `Haraç isteyerek barış (${TRIBUTE_OFFER}/tur)`,
    },
  ],
  peace: [
    { id: 'alliance', label: `İttifak öner (çeyiz ${RULES.dowry})` },
    { id: 'war', label: 'Savaş ilan et' },
  ],
  alliance: [],
};

/** Oyuncunun gözünden diğer devletler ve yapabileceği diplomatik eylemler. */
export function buildDiplomacyRows(
  world: World,
  state: GameState,
): DiplomacyRow[] {
  const player = state.playerFactionId;
  return Object.values(state.factions)
    .filter((f) => f.alive && f.id !== player)
    .map((faction) => {
      const def = world.factions[faction.id];
      const relation = relationBetween(state, player, faction.id);
      const pays = state.diplomacy.tributes.find(
        (t) => t.payer === player && t.receiver === faction.id,
      );
      const receives = state.diplomacy.tributes.find(
        (t) => t.payer === faction.id && t.receiver === player,
      );
      return {
        id: faction.id,
        name: def?.name ?? faction.id,
        color: def?.color ?? '#6b7280',
        relation,
        note: pays
          ? `Her tur ${pays.amount} akçe haraç ödüyorsun.`
          : receives
            ? `Her tur ${receives.amount} akçe haraç alıyorsun.`
            : undefined,
        actions: ACTIONS[relation].map((action) => {
          const command = diplomacyCommand(faction.id, action.id)!;
          const error = checkCommand(world, state, player, command);
          return {
            ...action,
            disabledReason: error ? (ERRORS[error] ?? error) : undefined,
          };
        }),
      };
    });
}

/** Yapay zekânın oyuncuya yaptığı barış teklifleri. */
export function buildOffers(world: World, state: GameState): DiplomacyOffer[] {
  return state.diplomacy.offers.map((offer) => {
    const name = world.factions[offer.from]?.name ?? offer.from;
    const terms =
      offer.tribute > 0
        ? `; her tur sana ${offer.tribute} akçe haraç ödeyecek`
        : offer.tribute < 0
          ? `; her tur ${-offer.tribute} akçe haraç istiyor`
          : '';
    return { id: offer.id, text: `${name} barış teklif ediyor${terms}.` };
  });
}
