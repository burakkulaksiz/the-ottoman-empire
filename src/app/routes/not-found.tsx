import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';

export default function NotFound() {
  const t = useT();
  return (
    <main className="grid min-h-dvh place-items-center p-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl">{t('errors.notFound')}</h1>
        <p className="text-muted-foreground">{t('errors.notFoundFlavor')}</p>
        <Link to="/" className={buttonVariants()}>
          {t('common.mainMenu')}
        </Link>
      </div>
    </main>
  );
}
