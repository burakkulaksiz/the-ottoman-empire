import { ArrowLeft, Play } from 'lucide-react';
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
import { formatDate } from '@/features/game/config/season-labels';

import type { Route } from './+types/scenarios';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Senaryo Seç · ${APP_NAME}` }];
}

export default function Scenarios() {
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

      <ul className="grid gap-4">
        {SCENARIOS.map((scenario) => (
          <li key={scenario.id}>
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-2xl">
                  <h2>{scenario.name}</h2>
                </CardTitle>
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
                  to={`/play/${scenario.id}`}
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
