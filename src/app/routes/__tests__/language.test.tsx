import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { formatLogEntry } from '@/features/game/lib/format-log-entry';
import { translator } from '@/lib/i18n';
import { localeStore, restoreLocale } from '@/stores/locale-store';

import Home from '../home';

function renderHome() {
  const Stub = createRoutesStub([{ path: '/', Component: Home }]);
  render(<Stub initialEntries={['/']} />);
}

describe('language', () => {
  afterEach(() => localeStore.getState().setLocale('tr'));

  it('starts in Turkish', async () => {
    renderHome();
    expect(
      await screen.findByRole('link', { name: /yeni oyun/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Turkish only/)).toBeNull();
  });

  it('switches the interface to English and remembers it', async () => {
    renderHome();
    fireEvent.click(await screen.findByRole('button', { name: 'English' }));

    expect(
      await screen.findByRole('link', { name: /new game/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/currently available in Turkish only/),
    ).toBeInTheDocument();
    expect(localStorage.getItem('devlet-i-aliyye:locale')).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    fireEvent.click(screen.getByRole('button', { name: 'Türkçe' }));
    expect(
      await screen.findByRole('link', { name: /yeni oyun/i }),
    ).toBeInTheDocument();
  });

  it('restores the remembered language after start-up', () => {
    localStorage.setItem('devlet-i-aliyye:locale', 'en');
    restoreLocale();
    expect(localeStore.getState().locale).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('writes the game log in the chosen language', () => {
    const names = {
      province: (id: string) => id,
      faction: (id: string) => id,
      event: (id: string) => id,
    };
    const entry = {
      type: 'provinceCaptured',
      provinceId: 'Bursa',
      by: 'Osmanlı',
      from: 'Bizans',
      turn: 1,
    } as const;

    expect(formatLogEntry(entry, names)).toBe('Bursa ele geçirildi (Osmanlı)');
    expect(formatLogEntry(entry, names, translator('en'))).toBe(
      'Bursa captured (Osmanlı)',
    );
  });
});
