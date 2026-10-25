import { useEffect } from 'react';
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';

import { APP_NAME } from '@/config/app';
import { translator } from '@/lib/i18n';
import { localeStore, restoreLocale } from '@/stores/locale-store';

import type { Route } from './+types/root';
import './app.css';

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{APP_NAME}</title>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  useEffect(() => {
    restoreLocale();
  }, []);
  return <Outlet />;
}

/** Kancasız yerlerde (hata sınırı, yükleme) seçili dilin çevirmeni. */
const currentT = () => translator(localeStore.getState().locale);

// SPA modunda JavaScript yüklenene kadar gösterilir.
export function HydrateFallback() {
  return (
    <main className="grid min-h-dvh place-items-center">
      <p className="font-display text-2xl text-muted-foreground">
        {currentT()('common.loading')}
      </p>
    </main>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  const t = currentT();
  let message = t('errors.generic');
  let details = t('errors.unexpected');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = t(error.status === 404 ? 'errors.notFound' : 'errors.error');
    details =
      error.status === 404
        ? t('errors.notFoundDetail')
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1 className="text-3xl">{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
