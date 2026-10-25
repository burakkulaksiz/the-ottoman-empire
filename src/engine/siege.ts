import type { Draft } from 'immer';

import { hostileArmiesIn } from './combat';
import type { ExecuteContext } from './context';
import { RULES } from './rules';
import type { ArmyState, FactionId, ProvinceId } from './types';
import { armySize, artilleryShare, type Units } from './units';

type Army = Draft<ArmyState>;

export function captureProvince(
  { state, emit }: ExecuteContext,
  provinceId: ProvinceId,
  by: FactionId,
) {
  const province = state.provinces[provinceId]!;
  const from = province.ownerId;
  province.ownerId = by;
  delete province.siege;
  emit({ type: 'provinceCaptured', provinceId, by, from });
}

/**
 * Savunmasız kalan bir bölgeyi ele geçirmek: kalesiz bölge hemen düşer,
 * kaleli bölgede kuşatma başlar (C4).
 */
export function occupy(context: ExecuteContext, army: Army) {
  const { world, state, emit } = context;
  const provinceId = army.provinceId;
  const province = state.provinces[provinceId]!;
  if (province.ownerId === army.ownerId) return;

  if ((world.provinces[provinceId]!.fortification ?? 0) === 0) {
    captureProvince(context, provinceId, army.ownerId);
  } else if (province.siege?.attackerId !== army.ownerId) {
    province.siege = { attackerId: army.ownerId, turns: 0 };
    emit({ type: 'siegeStarted', provinceId, attackerId: army.ownerId });
  }
}

function combinedUnits(armies: Army[]): Units {
  const total: Units = {};
  for (const army of armies) {
    for (const [type, count] of Object.entries(army.units)) {
      const key = type as keyof Units;
      total[key] = (total[key] ?? 0) + (count ?? 0);
    }
  }
  return total;
}

/** Kuşatmanın bitmesi için gereken tur; topçu oranı süreyi kısaltır. */
export function siegeTurnsRequired(fortification: number, besiegers: Army[]) {
  const speedup =
    1 + artilleryShare(combinedUnits(besiegers)) * RULES.artillerySiegeSpeedup;
  return Math.max(
    1,
    Math.ceil((fortification * RULES.siegeTurnsPerFortLevel) / speedup),
  );
}

/** Tur aşaması: süren kuşatmaları ilerletir, kırılanları kaldırır. */
export function advanceSieges(context: ExecuteContext) {
  const { world, state, emit } = context;

  for (const province of Object.values(state.provinces)) {
    const siege = province.siege;
    if (!siege) continue;

    const besiegers = Object.values(state.armies).filter(
      (a) =>
        a.provinceId === province.id &&
        a.ownerId === siege.attackerId &&
        armySize(a.units) > 0,
    );
    const relieved =
      hostileArmiesIn(state, province.id, siege.attackerId).length > 0;

    if (besiegers.length === 0 || relieved) {
      delete province.siege;
      emit({
        type: 'siegeLifted',
        provinceId: province.id,
        attackerId: siege.attackerId,
      });
      continue;
    }

    siege.turns += 1;
    const required = siegeTurnsRequired(
      world.provinces[province.id]!.fortification ?? 0,
      besiegers,
    );
    if (siege.turns >= required) {
      captureProvince(context, province.id, siege.attackerId);
    }
  }
}
