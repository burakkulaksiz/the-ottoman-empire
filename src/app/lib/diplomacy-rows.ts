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
import { tTr, type MessageKey, type Translate } from '@/lib/i18n';

/** Barış önerilerinde teklif edilen/istenen haraç (akçe/tur). */
export const TRIBUTE_OFFER = 5;

const ERRORS: Partial<Record<CommandError, MessageKey>> = {
  proposalCooldown: 'diplomacy.cooldown',
  notEnoughGold: 'recruitErrors.notEnoughGold',
  allied: 'diplomacy.allied',
  gameOver: 'diplomacy.gameOver',
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

function actionsFor(
  relation: 'war' | 'peace' | 'alliance',
  t: Translate,
): { id: string; label: string }[] {
  switch (relation) {
    case 'war':
      return [
        { id: 'peace', label: t('diplomacy.proposePeace') },
        {
          id: 'peace-pay',
          label: t('diplomacy.payTribute', { amount: TRIBUTE_OFFER }),
        },
        {
          id: 'peace-demand',
          label: t('diplomacy.demandTribute', { amount: TRIBUTE_OFFER }),
        },
      ];
    case 'peace':
      return [
        {
          id: 'alliance',
          label: t('diplomacy.proposeAlliance', { dowry: RULES.dowry }),
        },
        { id: 'war', label: t('diplomacy.declareWar') },
      ];
    case 'alliance':
      return [];
  }
}

/** Oyuncunun gözünden diğer devletler ve yapabileceği diplomatik eylemler. */
export function buildDiplomacyRows(
  world: World,
  state: GameState,
  t: Translate = tTr,
): DiplomacyRow[] {
  const player = state.playerFactionId;
  return Object.values(state.factions)
    .filter((f) => f.alive && f.id !== player)
    .map((faction) => {
      const def = world.factions[faction.id];
      const relation = relationBetween(state, player, faction.id);
      const pays = state.diplomacy.tributes.find(
        (x) => x.payer === player && x.receiver === faction.id,
      );
      const receives = state.diplomacy.tributes.find(
        (x) => x.payer === faction.id && x.receiver === player,
      );
      return {
        id: faction.id,
        name: def?.name ?? faction.id,
        color: def?.color ?? '#6b7280',
        relation,
        note: pays
          ? t('diplomacy.youPay', { amount: pays.amount })
          : receives
            ? t('diplomacy.youReceive', { amount: receives.amount })
            : undefined,
        actions: actionsFor(relation, t).map((action) => {
          const command = diplomacyCommand(faction.id, action.id)!;
          const error = checkCommand(world, state, player, command);
          const key = error ? ERRORS[error] : undefined;
          return {
            ...action,
            disabledReason: error ? (key ? t(key) : error) : undefined,
          };
        }),
      };
    });
}

/** Yapay zekânın oyuncuya yaptığı barış teklifleri. */
export function buildOffers(
  world: World,
  state: GameState,
  t: Translate = tTr,
): DiplomacyOffer[] {
  return state.diplomacy.offers.map((offer) => {
    const name = world.factions[offer.from]?.name ?? offer.from;
    const text =
      offer.tribute > 0
        ? t('diplomacy.offerPays', { name, amount: offer.tribute })
        : offer.tribute < 0
          ? t('diplomacy.offerDemands', { name, amount: -offer.tribute })
          : t('diplomacy.offer', { name });
    return { id: offer.id, text };
  });
}
