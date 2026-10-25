import { armySize, relationBetween, type GameState } from '@/engine';

import { getScenarioDefinition } from './scenarios';

/** Bir başarımın denetlediği oyun durumu ve senaryonun tarihî seçimleri. */
export interface AchievementContext {
  game: GameState;
  /** Olay kimliği → tarihte seçilen seçenek. */
  historicalChoices: Record<string, string>;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  check(context: AchievementContext): boolean;
}

const player = (game: GameState) => game.playerFactionId;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'ilk-fetih',
    title: 'İlk Fetih',
    description: 'Bir bölgeyi ele geçir.',
    check: ({ game }) =>
      game.log.some(
        (e) => e.type === 'provinceCaptured' && e.by === player(game),
      ),
  },
  {
    id: 'meydan-muharebesi',
    title: 'Meydan Muharebesi',
    description: 'Bir savaşı kazan.',
    check: ({ game }) =>
      game.log.some(
        (e) => e.type === 'battleFought' && e.winnerId === player(game),
      ),
  },
  {
    id: 'tarihin-izinde',
    title: 'Tarihin İzinde',
    description: 'Bir karar anında tarihte seçileni seç.',
    check: ({ game, historicalChoices }) =>
      Object.entries(game.events.choices).some(
        ([eventId, choiceId]) => historicalChoices[eventId] === choiceId,
      ),
  },
  {
    id: 'tarihe-sadik',
    title: 'Tarihe Sadık',
    description: 'En az iki karar anında da tarihte seçileni seç.',
    check: ({ game, historicalChoices }) => {
      const decided = Object.entries(game.events.choices).filter(
        ([eventId]) => eventId in historicalChoices,
      );
      return (
        decided.length >= 2 &&
        decided.every(
          ([eventId, choiceId]) => historicalChoices[eventId] === choiceId,
        )
      );
    },
  },
  {
    id: 'bursa',
    title: "Bursa'nın Fatihi",
    description: "Bursa'yı ele geçir.",
    check: ({ game }) => game.provinces['tur-bursa']?.ownerId === player(game),
  },
  {
    id: 'diplomat',
    title: 'Diplomat',
    description: 'Barış yap ya da ittifak kur.',
    check: ({ game }) =>
      game.log.some(
        (e) =>
          (e.type === 'peaceMade' || e.type === 'allianceFormed') &&
          (e.a === player(game) || e.b === player(game)),
      ) ||
      Object.values(game.factions).some(
        (f) =>
          f.id !== player(game) &&
          relationBetween(game, player(game), f.id) === 'alliance',
      ),
  },
  {
    id: 'vezir',
    title: 'Divan Kuruldu',
    description: 'Bir vezir ata.',
    check: ({ game }) => Boolean(game.court?.vizier),
  },
  {
    id: 'buyuk-ordu',
    title: 'Büyük Ordu',
    description: 'Toplam 3000 askere ulaş.',
    check: ({ game }) =>
      Object.values(game.armies)
        .filter((a) => a.ownerId === player(game))
        .reduce((sum, a) => sum + armySize(a.units), 0) >= 3000,
  },
  {
    id: 'bilge',
    title: 'Meraklı Öğrenci',
    description: 'Bilgi yarışmasında üç soruyu doğru cevapla.',
    check: ({ game }) =>
      Object.values(game.quizzes?.answered ?? {}).filter(Boolean).length >= 3,
  },
  {
    id: 'zafer',
    title: 'Zafer',
    description: 'Bir senaryoyu kazan.',
    check: ({ game }) =>
      game.status.phase === 'ended' && game.status.result === 'victory',
  },
  {
    id: 'tarihten-iyi',
    title: 'Tarihi Aştın',
    description: 'Bir senaryoyu tarihten daha iyi bir sonuçla bitir.',
    check: ({ game }) =>
      game.status.phase === 'ended' && game.status.score?.verdict === 'better',
  },
];

/** Senaryonun olaylarından tarihî seçim tablosunu çıkarır. */
export function historicalChoicesOf(
  scenarioId: string,
): Record<string, string> {
  return Object.fromEntries(
    (getScenarioDefinition(scenarioId)?.events ?? []).map((e) => [
      e.id,
      e.historical.choiceId,
    ]),
  );
}

/** Bu durumda kazanılmış ama `known` içinde olmayan başarımlar. */
export function newlyEarned(
  game: GameState,
  known: ReadonlySet<string>,
): Achievement[] {
  const context = {
    game,
    historicalChoices: historicalChoicesOf(game.scenarioId),
  };
  return ACHIEVEMENTS.filter((a) => !known.has(a.id) && a.check(context));
}
