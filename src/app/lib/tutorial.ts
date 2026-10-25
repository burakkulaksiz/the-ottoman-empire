import type { TutorialStep } from '@/content/scenarios';
import type { GameState } from '@/engine';

/** Oyun durumunda görünmeyen, arayüzde yapılan öğretici eylemleri. */
export interface TutorialFlags {
  armySelected: boolean;
  encyclopediaOpened: boolean;
  chronicleOpened: boolean;
}

export const NO_TUTORIAL_FLAGS: TutorialFlags = {
  armySelected: false,
  encyclopediaOpened: false,
  chronicleOpened: false,
};

export interface TutorialProgress {
  steps: (TutorialStep & { done: boolean })[];
  /** Sıradaki yapılmamış adım; hepsi bittiyse `null`. */
  current: (TutorialStep & { done: boolean }) | null;
  doneCount: number;
}

function isDone(
  step: TutorialStep,
  game: GameState,
  flags: TutorialFlags,
): boolean {
  const player = game.playerFactionId;
  switch (step.goal.type) {
    case 'selectArmy':
      return flags.armySelected;
    case 'capture':
      return game.provinces[step.goal.provinceId]?.ownerId === player;
    case 'recruit':
      return game.log.some(
        (e) => e.type === 'recruited' && e.factionId === player,
      );
    case 'endTurn':
      return game.turn >= 2;
    case 'openEncyclopedia':
      return flags.encyclopediaOpened;
    case 'openChronicle':
      return flags.chronicleOpened;
  }
}

/** Öğretici adımlarının durumu: adımlar sıradan bağımsız tamamlanabilir. */
export function tutorialProgress(
  steps: readonly TutorialStep[],
  game: GameState,
  flags: TutorialFlags,
): TutorialProgress {
  const evaluated = steps.map((step) => ({
    ...step,
    done: isDone(step, game, flags),
  }));
  return {
    steps: evaluated,
    current: evaluated.find((s) => !s.done) ?? null,
    doneCount: evaluated.filter((s) => s.done).length,
  };
}
