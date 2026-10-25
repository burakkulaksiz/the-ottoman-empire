import { en } from './messages/en';
import { tr, type Messages } from './messages/tr';

export type Locale = 'tr' | 'en';

export const LOCALES: Locale[] = ['tr', 'en'];

export const LOCALE_NAMES: Record<Locale, string> = {
  tr: 'Türkçe',
  en: 'English',
};

/** Tarih ve sayı biçimleri için BCP 47 etiketi. */
export const LOCALE_TAGS: Record<Locale, string> = {
  tr: 'tr-TR',
  en: 'en-GB',
};

const DICTIONARIES: Record<Locale, Messages> = { tr, en };

/** `"hud.endTurn"` gibi tüm anahtarlar. */
export type MessageKey = {
  [N in keyof Messages]: `${N & string}.${keyof Messages[N] & string}`;
}[keyof Messages];

export type MessageParams = Record<string, string | number>;

export type Translate = (key: MessageKey, params?: MessageParams) => string;

export function isLocale(value: unknown): value is Locale {
  return LOCALES.includes(value as Locale);
}

/** Anahtarı verilen dilde çevirir; `{ad}` yerlerini parametrelerle doldurur. */
export function translate(
  locale: Locale,
  key: MessageKey,
  params?: MessageParams,
): string {
  const [namespace, name] = key.split('.') as [keyof Messages, string];
  const dictionary = DICTIONARIES[locale][namespace] as Record<string, string>;
  const fallback = DICTIONARIES.tr[namespace] as Record<string, string>;
  const template = dictionary[name] ?? fallback[name] ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, param: string) =>
    param in params ? String(params[param]) : match,
  );
}

export function translator(locale: Locale): Translate {
  return (key, params) => translate(locale, key, params);
}

/** Varsayılan (Türkçe) çevirmen: dil bağlamı olmayan yardımcılar için. */
export const tTr = translator('tr');
