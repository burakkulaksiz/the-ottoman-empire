import { useStore } from 'zustand';
import { createStore } from 'zustand/vanilla';

import { isLocale, type Locale } from '@/lib/i18n';

const STORAGE_KEY = 'devlet-i-aliyye:locale';

function readStoredLocale(): Locale {
  try {
    const stored = globalThis.localStorage?.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : 'tr';
  } catch {
    return 'tr';
  }
}

interface LocaleStore {
  locale: Locale;
  setLocale(locale: Locale): void;
}

/**
 * Arayüz dili (A5). Seçim tarayıcıda hatırlanır; varsayılan Türkçe.
 * Önceden üretilen HTML Türkçe olduğundan store da Türkçe başlar; kayıtlı dil
 * hydration'dan sonra `restoreLocale` ile uygulanır (yoksa React #418 verir).
 */
export const localeStore = createStore<LocaleStore>()((set) => ({
  locale: 'tr',
  setLocale(locale) {
    try {
      globalThis.localStorage?.setItem(STORAGE_KEY, locale);
    } catch {
      // Gizli pencerede depolama kapalı olabilir; seçim yalnızca bu oturumda kalır.
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
    set({ locale });
  },
}));

/** Tarayıcıda kayıtlı dili uygular; uygulama ilk açıldığında bir kez çağrılır. */
export function restoreLocale(): void {
  const stored = readStoredLocale();
  if (stored !== localeStore.getState().locale) {
    localeStore.getState().setLocale(stored);
  }
}

export function useLocale(): Locale {
  return useStore(localeStore, (s) => s.locale);
}

export function useSetLocale(): (locale: Locale) => void {
  return useStore(localeStore, (s) => s.setLocale);
}
