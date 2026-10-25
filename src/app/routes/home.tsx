import { BookOpen, FolderOpen, Settings, Swords, Trophy } from 'lucide-react';
import { Link } from 'react-router';

import { LanguageSwitcher } from '@/components/language-switcher';
import { OttomanTitle, TezhipDivider } from '@/components/ornament';
import { Button, buttonVariants } from '@/components/ui/button';
import { APP_NAME, APP_TAGLINE } from '@/config/app';
import { useT } from '@/hooks/use-t';
import { saveRepository } from '@/lib/saves/save-repository';
import { useLocale } from '@/stores/locale-store';

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
  const t = useT();
  const locale = useLocale();
  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <header className="flex flex-col items-center text-center">
          <OttomanTitle />
          <h1 className="mt-1 text-5xl font-semibold tracking-tight text-primary">
            {APP_NAME}
          </h1>
          <p className="mt-2 text-muted-foreground italic">
            {t('menu.tagline')}
          </p>
          <TezhipDivider className="mt-4 max-w-xs" />
        </header>

        <nav className="tezhip-frame flex w-full flex-col gap-3 rounded-xl bg-card p-6">
          <Link to="/scenarios" className={buttonVariants({ size: 'lg' })}>
            <Swords /> {t('menu.newGame')}
          </Link>
          {hasSaves ? (
            <Link
              to="/saves"
              className={buttonVariants({ size: 'lg', variant: 'outline' })}
            >
              <FolderOpen /> {t('menu.continue')}
            </Link>
          ) : (
            <Button size="lg" variant="outline" disabled>
              <FolderOpen /> {t('menu.continue')}
            </Button>
          )}
          <Link
            to="/encyclopedia"
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
          >
            <BookOpen /> {t('menu.encyclopedia')}
          </Link>
          <Link
            to="/achievements"
            className={buttonVariants({ size: 'lg', variant: 'outline' })}
          >
            <Trophy /> {t('menu.achievements')}
          </Link>
          <Button size="lg" variant="outline" disabled>
            <Settings /> {t('menu.settings')}
          </Button>
        </nav>
        <LanguageSwitcher />
        {locale !== 'tr' && (
          <p className="text-center text-xs text-muted-foreground">
            {t('common.contentInTurkish')}
          </p>
        )}
      </div>
    </main>
  );
}
