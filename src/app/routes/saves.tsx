import { ArrowLeft } from 'lucide-react';
import { Link, useRevalidator } from 'react-router';

import { buttonVariants } from '@/components/ui/button';
import { APP_NAME } from '@/config/app';
import { SaveSlotList } from '@/features/saves/components/save-slot-list';
import {
  isSaveSlot,
  saveRepository,
  type SaveSummary,
} from '@/lib/saves/save-repository';

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
          aria-label="Ana Menü"
          className={buttonVariants({ variant: 'ghost', size: 'icon' })}
        >
          <ArrowLeft />
        </Link>
        <h1 className="text-3xl">Kayıtlı Oyunlar</h1>
      </header>

      <SaveSlotList
        rows={buildSlotRows(saves)}
        loadHref={(slot) => {
          const scenarioId = saves.find((s) => s.slot === slot)?.scenarioId;
          return `/play/${scenarioId}?slot=${slot}`;
        }}
        onDelete={(slot) => void remove(slot)}
      />

      {saves.length === 0 && (
        <p className="text-muted-foreground">
          Henüz kayıt yok. Bir oyun başlatıp tur bitirince otomatik kayıt
          oluşur.
        </p>
      )}
    </main>
  );
}
