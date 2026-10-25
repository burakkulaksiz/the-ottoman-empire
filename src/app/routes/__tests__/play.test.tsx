import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import Play, { clientLoader } from '../play';

// MapLibre WebGL gerektirir; jsdom'da harita yerine boş bir kutu çizilir.
vi.mock('@/features/map/components/game-map', () => ({
  GameMap: () => <div data-testid="map" />,
}));

function renderPlay(path: string) {
  const Stub = createRoutesStub([
    {
      path: '/play/:scenarioId',
      Component: Play as never,
      loader: clientLoader as never,
      ErrorBoundary: () => <p>Bulunamadı</p>,
    },
  ]);
  render(<Stub initialEntries={[path]} />);
}

describe('Play', () => {
  it('lays out the HUD, goals and map for the chosen scenario', async () => {
    renderPlay('/play/kurulus-1299');

    expect(
      await screen.findByRole('heading', { name: '1299 · Kuruluş' }),
    ).toBeInTheDocument();
    expect(screen.getByText('İlkbahar 1299')).toBeInTheDocument();
    expect(screen.getByTestId('map')).toBeInTheDocument();
    expect(screen.getByText('Hedefler')).toBeInTheDocument();
    expect(screen.getByText(/Bursa'yı fethet/)).toBeInTheDocument();
    expect(screen.getByText('Günlük')).toBeInTheDocument();
  });

  it('advances the season when the player ends the turn', async () => {
    renderPlay('/play/kurulus-1299');

    fireEvent.click(await screen.findByRole('button', { name: /turu bitir/i }));

    expect(screen.getByText('Yaz 1299')).toBeInTheDocument();
  });

  it('shows an error for an unknown scenario', async () => {
    renderPlay('/play/yok');

    expect(await screen.findByText('Bulunamadı')).toBeInTheDocument();
  });
});
