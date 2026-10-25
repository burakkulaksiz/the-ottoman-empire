import { isLocale, translate, translator, tTr, type MessageKey } from '..';
import { en } from '../messages/en';
import { tr } from '../messages/tr';

const keysOf = (messages: Record<string, Record<string, string>>) =>
  Object.entries(messages).flatMap(([namespace, entries]) =>
    Object.keys(entries).map((key) => `${namespace}.${key}`),
  );

describe('i18n', () => {
  it('has an English text for every Turkish key, and no extra keys', () => {
    expect(keysOf(en).sort()).toEqual(keysOf(tr).sort());
    for (const key of keysOf(en)) {
      expect(translate('en', key as MessageKey).length, key).toBeGreaterThan(0);
    }
  });

  it('uses the same placeholders in both languages', () => {
    const placeholders = (text: string) =>
      (text.match(/\{\w+\}/g) ?? []).sort().join();
    for (const key of keysOf(tr) as MessageKey[]) {
      expect(placeholders(translate('en', key)), key).toBe(
        placeholders(translate('tr', key)),
      );
    }
  });

  it('fills in parameters and leaves unknown ones visible', () => {
    expect(translate('tr', 'army.title', { faction: 'Bizans' })).toBe(
      'Bizans ordusu',
    );
    expect(translate('en', 'army.title', { faction: 'Byzantine' })).toBe(
      'Byzantine army',
    );
    expect(translate('en', 'army.title')).toBe('{faction} army');
  });

  it('offers translators and a Turkish default', () => {
    expect(translator('en')('hud.endTurn')).toBe('End Turn');
    expect(tTr('hud.endTurn')).toBe('Turu Bitir');
  });

  it('recognises supported locales only', () => {
    expect(isLocale('tr')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('de')).toBe(false);
    expect(isLocale(null)).toBe(false);
  });
});
