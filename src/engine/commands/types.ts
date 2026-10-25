import type { ArmyId, FactionId, GameState, ProvinceId, World } from '../types';

/** Bir devletin tur içinde verdiği emirler (oyuncu veya yapay zekâ). */
export type ActionCommand = {
  type: 'moveArmy';
  armyId: ArmyId;
  to: ProvinceId;
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
  | 'unknownChoice';

export interface ValidationArgs<C> {
  world: World;
  state: GameState;
  factionId: FactionId;
  command: C;
}
