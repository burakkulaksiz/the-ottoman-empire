import { Button } from '@/components/ui/button';
import { useT } from '@/hooks/use-t';
import { LOCALE_NAMES, LOCALES } from '@/lib/i18n';
import { useLocale, useSetLocale } from '@/stores/locale-store';

/** Türkçe / English seçimi (A5). */
export function LanguageSwitcher() {
  const t = useT();
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div role="group" aria-label={t('menu.language')} className="flex gap-1">
      {LOCALES.map((option) => (
        <Button
          key={option}
          size="sm"
          variant={option === locale ? 'default' : 'ghost'}
          aria-pressed={option === locale}
          lang={option}
          onClick={() => setLocale(option)}
        >
          {LOCALE_NAMES[option]}
        </Button>
      ))}
    </div>
  );
}
