import { useMemo } from 'react';

import { translator, type Translate } from '@/lib/i18n';
import { useLocale } from '@/stores/locale-store';

/** Seçili dildeki çevirmen (A5). */
export function useT(): Translate {
  const locale = useLocale();
  return useMemo(() => translator(locale), [locale]);
}
