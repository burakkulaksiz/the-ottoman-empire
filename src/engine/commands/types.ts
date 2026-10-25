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
    }
  | { type: 'declareWar'; target: FactionId }
  | {
      /**
       * Savaştaki devlete barış önerir. `tribute` > 0: öneren tur başına haraç
       * öder; < 0: öneren haraç ister.
       */
      type: 'proposePeace';
      target: FactionId;
      tribute?: number;
    }
  | { type: 'proposeAlliance'; target: FactionId }
  | { type: 'respondOffer'; offerId: string; accept: boolean }
  /** Vezir adaylarından birini atar (C8). */
  | { type: 'appointVizier'; personId: string }
  /** Mini quiz cevabı (D5); `choice` seçeneğin sırası. */
  | { type: 'answerQuiz'; quizId: string; choice: number };

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
  | 'besieged'
  | 'unknownFaction'
  | 'alreadyAtWar'
  /** İttifakı bozmadan savaş ilan edilemez. */
  | 'allied'
  | 'notAtWar'
  | 'notAtPeace'
  /** Aynı devlete tur başına bir teklif yapılabilir. */
  | 'proposalCooldown'
  | 'invalidTribute'
  | 'noSuchOffer'
  /** Barış yaptığın devletin topraklarına giremezsin. */
  | 'atPeace'
  | 'noCourt'
  /** Bu kurum henüz yok (ör. divan). */
  | 'notYet'
  | 'noSuchCandidate'
  | 'unknownQuiz'
  | 'alreadyAnswered';

export interface ValidationArgs<C> {
  world: World;
  state: GameState;
  factionId: FactionId;
  command: C;
}
