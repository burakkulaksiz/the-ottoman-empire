import { ArrowLeft, Lock, Trophy } from 'lucide-react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { ACHIEVEMENTS } from '@/content/achievements';
import { getScenarioDefinition } from '@/content/scenarios';
import {
  achievementRepository,
  type UnlockedAchievement,
} from '@/lib/achievements/achievement-repository';

import type { Route } from './+types/achievements';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Başarımlar · ${APP_NAME}` }];
}

export async function clientLoader(): Promise<{
  unlocked: UnlockedAchievement[];
}> {
  try {
    return { unlocked: await achievementRepository.list() };
  } catch {
    return { unlocked: [] };
  }
}

export default function Achievements({ loaderData }: Route.ComponentProps) {
  const unlocked = new Map(
    (loaderData?.unlocked ?? []).map((u) => [u.id, u] as const),
  );

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col gap-6 p-4 pt-8">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Ana Menü"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl">Başarımlar</h1>
        <span className="ml-auto text-sm text-muted-foreground">
          {unlocked.size}/{ACHIEVEMENTS.length}
        </span>
      </header>

      <ul className="grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((achievement) => {
          const earned = unlocked.get(achievement.id);
          return (
            <li
              key={achievement.id}
              className={`flex gap-3 rounded-lg border p-3 ${
                earned ? 'bg-card' : 'opacity-60'
              }`}
            >
              {earned ? (
                <Trophy
                  className="size-5 shrink-0 text-gold"
                  aria-label="Kazanıldı"
                />
              ) : (
                <Lock className="size-5 shrink-0" aria-label="Kilitli" />
              )}
              <div>
                <p className="font-display text-lg">{achievement.title}</p>
                <p className="text-sm">{achievement.description}</p>
                {earned && (
                  <p className="text-xs text-muted-foreground">
                    {getScenarioDefinition(earned.scenarioId)?.name ??
                      earned.scenarioId}
                    , {new Date(earned.unlockedAt).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
