import { ArrowLeft } from 'lucide-react';
import { Link, useRevalidator } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { SaveSlotList } from '@/features/saves/components/save-slot-list';
import { useT } from '@/hooks/use-t';
import { LOCALE_TAGS } from '@/lib/i18n';
import {
  isSaveSlot,
  saveRepository,
  type SaveSummary,
} from '@/lib/saves/save-repository';
import { useLocale } from '@/stores/locale-store';

import { buildSlotRows } from '../lib/slot-rows';

import type { Route } from './+types/saves';

export function meta(_: Route.MetaArgs) {
  return [{ title: `Kayıtlar · ${APP_NAME}` }];
}

export async function clientLoader(): Promise<{ saves: SaveSummary[] }> {
  try {
    return { saves: await saveRepository.list() };
  } catch {
    return { saves: [] };
  }
}

export default function Saves({ loaderData }: Route.ComponentProps) {
  const { revalidate } = useRevalidator();
  const saves = loaderData?.saves ?? [];
  const t = useT();
  const locale = useLocale();

  async function remove(slot: string) {
    if (!isSaveSlot(slot)) return;
    await saveRepository.remove(slot);
    await revalidate();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-6 p-4 pt-8">
      <header className="flex items-center gap-3">
        <Link
          to="/"
          aria-label={t('common.mainMenu')}
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl">{t('saves.title')}</h1>
      </header>

      <SaveSlotList
        rows={buildSlotRows(saves, t, LOCALE_TAGS[locale])}
        loadHref={(slot) => {
          const scenarioId = saves.find((s) => s.slot === slot)?.scenarioId;
          return `/play/${scenarioId}?slot=${slot}`;
        }}
        onDelete={(slot) => void remove(slot)}
      />

      {saves.length === 0 && (
        <p className="text-muted-foreground">{t('saves.empty')}</p>
      )}
    </main>
  );
}
