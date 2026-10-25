import type { ArmyId, FactionId, GameState, ProvinceId, World } from '../types';
import type { UnitType } from '../units';

/** Bir devletin tur içinde verdiği emirler (oyuncu veya yapay zekâ). */
export type ActionCommand =
  | {
      type: 'moveArmy';
      armyId: ArmyId;
      to: ProvinceId;
    }
  | {
      /** Bölgede `RULES.recruitBatch` asker devşirir (akçe öder). */
      type: 'recruit';
      provinceId: ProvinceId;
      unit: UnitType;
    };

export type Command =
  | ActionCommand
  | { type: 'endTurn' }
  | { type: 'chooseEvent'; eventId: string; choiceId: string };

/** Hata kodları; kullanıcıya gösterilecek metinler arayüz katmanında. */
export type CommandError =
  | 'gameOver'
  | 'notPlayer'
  | 'unknownArmy'
  | 'notOwner'
  | 'noMovesLeft'
  | 'unknownProvince'
  | 'notAdjacent'
  /** Kışın ordu yalnızca kendi toprağına çekilebilir. */
  | 'winterQuarters'
  /** Bekleyen bir olay kartı çözülmeden tur bitirilemez. */
  | 'eventPending'
  | 'noSuchPendingEvent'
  | 'unknownChoice'
  /** Devşirme: birlik bu yılda henüz yok. */
  | 'unitUnavailable'
  | 'notEnoughGold'
  /** Bu bölgede bu tur daha fazla devşirme yapılamaz. */
  | 'recruitLimit'
  /** Kuşatılan bölgede devşirme yapılamaz. */
  | 'besieged';

export interface ValidationArgs<C> {
  world: World;
  state: GameState;
  factionId: FactionId;
  command: C;
}
