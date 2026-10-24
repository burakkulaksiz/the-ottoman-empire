import { Link } from 'react-router';

import { buttonVariants } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center p-4 text-center">
      <div className="flex flex-col items-center gap-4">
        <h1 className="text-4xl">Sayfa bulunamadı</h1>
        <p className="text-muted-foreground">
          Bu topraklar henüz haritaya işlenmemiş.
        </p>
        <Link to="/" className={buttonVariants()}>
          Ana Menüye Dön
        </Link>
      </div>
    </main>
  );
}
