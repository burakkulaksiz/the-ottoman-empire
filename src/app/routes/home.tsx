import { BookOpen, FolderOpen, Settings, Swords } from 'lucide-react';
import { Link } from 'react-router';

import { Button, buttonVariants } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE } from '@/config/app';
import { saveRepository } from '@/lib/saves/save-repository';

import type { Route } from './+types/home';

export function meta(_: Route.MetaArgs) {
  return [{ title: APP_NAME }, { name: 'description', content: APP_TAGLINE }];
}

export async function clientLoader() {
  try {
    return { hasSaves: (await saveRepository.list()).length > 0 };
  } catch {
    // IndexedDB kapalıysa (gizli pencere vb.) oyun yine açılır.
    return { hasSaves: false };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const hasSaves = loaderData?.hasSaves ?? false;
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-10">
        <header className="text-center">
          <h1 className="text-5xl font-semibold tracking-tight text-primary">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-muted-foreground">{APP_TAGLINE}</p>
        </header>

        <nav className="flex w-full flex-col gap-3">
          <Link to="/scenarios" className={buttonVariants({ size: 'lg' })}>
            <Swords /> Yeni Oyun
          </Link>
          {hasSaves ? (
            <Link
              to="/saves"
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              <FolderOpen /> Devam Et
            </Link>
          ) : (
            <Button size="lg" variant="outline" disabled>
              <FolderOpen /> Devam Et
            </Button>
          )}
          <Button size="lg" variant="outline" disabled>
            <BookOpen /> Ansiklopedi
          </Button>
          <Button size="lg" variant="outline" disabled>
            <Settings /> Ayarlar
          </Button>
        </nav>
      </div>
    </main>
  );
}
