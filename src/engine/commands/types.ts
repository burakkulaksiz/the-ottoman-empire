import type { ArmyId, FactionId, GameState, ProvinceId, World } from '../types';

/** Bir devletin tur içinde verdiği emirler (oyuncu veya yapay zekâ). */
export type ActionCommand = {
  type: 'moveArmy';
  armyId: ArmyId;
  to: ProvinceId;
};

export type Command = ActionCommand | { type: 'endTurn' };

/** Hata kodları; kullanıcıya gösterilecek metinler arayüz katmanında. */
export type CommandError =
  | 'gameOver'
  | 'notPlayer'
  | 'unknownArmy'
  | 'notOwner'
  | 'noMovesLeft'
  | 'unknownProvince'
  | 'notAdjacent';

export interface ValidationArgs<C> {
  world: World;
  state: GameState;
  factionId: FactionId;
  command: C;
}
