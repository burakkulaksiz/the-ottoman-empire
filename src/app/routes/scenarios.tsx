import { ArrowLeft, Play } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { APP_NAME } from '@/config/app';
import { SCENARIOS } from '@/content/scenarios';
import type { GameSettings } from '@/engine';
import { formatDate } from '@/features/game/config/season-labels';

import {
  DIFFICULTIES,
  DIFFICULTY_HINTS,
  DIFFICULTY_LABELS,
  HISTORICAL_MODE_HINT,
  settingsToSearch,
} from '../lib/game-settings';

import type { Route } from './+types/scenarios';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Senaryo Seç · ${APP_NAME}` }];
}

export default function Scenarios() {
  const [settings, setSettings] = useState<GameSettings>({
    difficulty: 'normal',
    historicalMode: false,
  });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 p-4 pt-8">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label="Ana Menü"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl">Senaryo Seç</h1>
      </header>

      <section
        aria-label="Oyun ayarları"
        className="grid gap-3 rounded-xl border bg-card p-4 sm:grid-cols-2"
      >
        <fieldset>
          <legend className="font-display text-lg">Zorluk</legend>
          <div className="mt-1 flex flex-wrap gap-3">
            {DIFFICULTIES.map((difficulty) => (
              <label key={difficulty} className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name="difficulty"
                  value={difficulty}
                  checked={settings.difficulty === difficulty}
                  onChange={() => setSettings((s) => ({ ...s, difficulty }))}
                />
                {DIFFICULTY_LABELS[difficulty]}
              </label>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {DIFFICULTY_HINTS[settings.difficulty]}
          </p>
        </fieldset>
        <div>
          <label className="flex items-center gap-1.5 font-display text-lg">
            <input
              type="checkbox"
              checked={settings.historicalMode}
              onChange={(e) =>
                setSettings((s) => ({ ...s, historicalMode: e.target.checked }))
              }
            />
            Tarihe sadık mod
          </label>
          <p className="mt-1 text-xs text-muted-foreground">
            {HISTORICAL_MODE_HINT}
          </p>
        </div>
      </section>

      <ul className="grid gap-4">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  <h2>{scenario.name}</h2>
                </CardTitle>
                {scenario.tutorial && (
                  <p className="w-fit rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    Yeni başlayanlar için önerilir
                  </p>
                )}
                <CardDescription>
                  Başlangıç: {formatDate(scenario.startDate)}
                  {scenario.endDate &&
                    ` · Süre sınırı: ${formatDate(scenario.endDate)}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>{scenario.summary}</p>
                {scenario.objectives && scenario.objectives.length > 0 && (
                  <>
                    <h3 className="mt-4 font-display text-lg">Hedefler</h3>
                    <ul className="list-disc pl-5 text-sm">
                      {scenario.objectives.map((o) => (
                        <li key={o.id}>{o.title}</li>
                      ))}
                    </ul>
                  </>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Link
                  to={`/play/${scenario.id}${settingsToSearch(settings)}`}
                  className={buttonVariants()}
                  aria-label={`${scenario.name} senaryosunu başlat`}
                >
                  <Play /> Başla
                </Link>
              </CardFooter>
            </Card>
          </li>
        ))}
      </ul>

      <p className="text-sm text-muted-foreground">
        Diğer dönemler (1326 Bursa, 1402 Ankara, 1453 İstanbul …) yol
        haritasında; yakında eklenecek.
      </p>
    </main>
  );
}
