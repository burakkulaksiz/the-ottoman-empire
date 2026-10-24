import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';

import type { Route } from './+types/play';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Oyun · ${APP_NAME}` }];
}

export default function Play() {
  return (
    <main className="flex min-h-dvh flex-col">
      <header className="flex items-center gap-2 border-b p-2">
        <Link
          to="/"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ArrowLeft /> Ana Menü
        </Link>
      </header>
      <section className="grid flex-1 place-items-center text-muted-foreground">
        Harita burada olacak.
      </section>
    </main>
  );
}
