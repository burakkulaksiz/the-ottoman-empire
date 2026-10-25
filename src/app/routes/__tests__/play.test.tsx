import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { SAVE_SLOTS, saveRepository } from '@/lib/saves/save-repository';
import { gameStore } from '@/stores/game-store';

import Play, { clientLoader } from '../play';

// MapLibre WebGL gerektirir; jsdom'da harita yerine, ordu işaretlerini ve
// vurgulanan bölgeleri düğme olarak gösteren bir taklit çizilir.
vi.mock('@/features/map/components/game-map', () => ({
  GameMap: ({
    armies = [],
    reachableProvinceIds = [],
    onArmySelect,
    onProvinceSelect,
  }: {
    armies?: { id: string }[];
    reachableProvinceIds?: string[];
    onArmySelect?: (id: string) => void;
    onProvinceSelect?: (id: string | null) => void;
  }) => (
    <div data-testid="map">
      {armies.map((army) => (
        <button key={army.id} onClick={() => onArmySelect?.(army.id)}>
          ordu {army.id}
        </button>
      ))}
      {reachableProvinceIds.map((id) => (
        <button key={id} onClick={() => onProvinceSelect?.(id)}>
          git {id}
        </button>
      ))}
      <button onClick={() => onProvinceSelect?.('tur-bursa')}>
        bölge tur-bursa
      </button>
      <button onClick={() => onProvinceSelect?.(null)}>boş yer</button>
    </div>
  ),
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
  beforeEach(async () => {
    gameStore.getState().reset();
    for (const slot of SAVE_SLOTS) await saveRepository.remove(slot);
  });

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

    expect(await screen.findByText('Yaz 1299')).toBeInTheDocument();
  });

  it('shows an error for an unknown scenario', async () => {
    renderPlay('/play/yok');

    expect(await screen.findByText('Bulunamadı')).toBeInTheDocument();
  });

  it('puts every army of the scenario on the map', async () => {
    renderPlay('/play/kurulus-1299');
    await screen.findByTestId('map');

    expect(screen.getAllByRole('button', { name: /^ordu army-/ })).toHaveLength(
      6,
    );
  });

  it('shows the orders panel and reachable provinces for the own army', async () => {
    renderPlay('/play/kurulus-1299');

    fireEvent.click(await screen.findByRole('button', { name: 'ordu army-1' }));

    expect(screen.getByText('Osmanlı Beyliği ordusu')).toBeInTheDocument();
    expect(screen.getByText('Akıncı 400 · Sipahi 600')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'git tur-bursa' }),
    ).toBeInTheDocument();
  });

  it('does not offer orders for armies of other states', async () => {
    renderPlay('/play/kurulus-1299');

    // army-2 Bizans'ındır; bölgesi seçilir ama emir paneli açılmaz.
    fireEvent.click(await screen.findByRole('button', { name: 'ordu army-2' }));

    expect(await screen.findByText('Ordular')).toBeInTheDocument();
    expect(screen.queryByText('Seçimi kaldır')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^git / })).toBeNull();
  });

  it('marches the selected army into a highlighted province', async () => {
    renderPlay('/play/kurulus-1299');

    fireEvent.click(await screen.findByRole('button', { name: 'ordu army-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'git tur-bursa' }));

    // Bursa'da Bizans ordusu var: savaş günlüğe düşer, emir paneli kapanır.
    expect(await screen.findByText(/Savaş \(Bursa\)/)).toBeInTheDocument();
    expect(screen.queryByText('Seçimi kaldır')).not.toBeInTheDocument();
  });

  it('cancels the selection when the player clicks an empty place', async () => {
    renderPlay('/play/kurulus-1299');

    fireEvent.click(await screen.findByRole('button', { name: 'ordu army-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'boş yer' }));

    expect(screen.queryByText('Seçimi kaldır')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^git / })).toBeNull();
  });

  it('autosaves when the turn ends', async () => {
    renderPlay('/play/kurulus-1299');

    fireEvent.click(await screen.findByRole('button', { name: /turu bitir/i }));

    await waitFor(async () => {
      expect((await saveRepository.get('auto'))?.turn).toBe(2);
    });
  });

  it('saves into a slot from the save menu', async () => {
    renderPlay('/play/kurulus-1299');

    fireEvent.click(await screen.findByRole('button', { name: /^kaydet$/i }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Yuva 1: kaydet' }),
    );

    await waitFor(async () => {
      expect((await saveRepository.get('slot-1'))?.scenarioId).toBe(
        'kurulus-1299',
      );
    });
    expect(await screen.findByText(/Son kayıt: Yuva 1/)).toBeInTheDocument();
  });

  it('continues a saved game from the slot in the address', async () => {
    renderPlay('/play/kurulus-1299');
    fireEvent.click(await screen.findByRole('button', { name: /turu bitir/i }));
    fireEvent.click(await screen.findByRole('button', { name: /turu bitir/i }));
    await screen.findByText('Sonbahar 1299');
    await waitFor(async () => {
      expect((await saveRepository.get('auto'))?.turn).toBe(3);
    });

    cleanup();
    gameStore.getState().reset();
    renderPlay('/play/kurulus-1299?slot=auto');

    expect(await screen.findByText('Sonbahar 1299')).toBeInTheDocument();
    expect(gameStore.getState().game?.turn).toBe(3);
  });

  it('explains when a slot cannot be loaded', async () => {
    renderPlay('/play/kurulus-1299?slot=slot-3');

    expect(
      await screen.findByText(/Oyun yüklenemedi: Bu yuvada kayıt yok/),
    ).toBeInTheDocument();
  });
});
