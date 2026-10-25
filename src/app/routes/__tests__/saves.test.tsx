import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { loadScenario } from '@/content/scenarios';
import { createGame } from '@/engine';
import { SAVE_SLOTS, saveRepository } from '@/lib/saves/save-repository';

import Home, { clientLoader as homeLoader } from '../home';
import Saves, { clientLoader } from '../saves';

const game = () => createGame(loadScenario('kurulus-1299'), { seed: 1 });

function renderSaves() {
  const Stub = createRoutesStub([
    {
      path: '/saves',
      Component: Saves as never,
      loader: clientLoader as never,
    },
  ]);
  render(<Stub initialEntries={['/saves']} />);
}

describe('Saves', () => {
  beforeEach(async () => {
    for (const slot of SAVE_SLOTS) await saveRepository.remove(slot);
  });

  it('tells there is nothing to continue yet', async () => {
    renderSaves();

    expect(await screen.findByText(/Henüz kayıt yok/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /yükle/ })).toBeNull();
  });

  it('lists saved games with a link that continues them', async () => {
    await saveRepository.put('slot-2', game());
    renderSaves();

    expect(
      await screen.findByRole('link', { name: 'Yuva 2: yükle' }),
    ).toHaveAttribute('href', '/play/kurulus-1299?slot=slot-2');
    expect(screen.getByText('1299 · Kuruluş')).toBeInTheDocument();
  });

  it('deletes a save', async () => {
    await saveRepository.put('slot-1', game());
    renderSaves();

    fireEvent.click(await screen.findByRole('button', { name: 'Yuva 1: sil' }));

    await waitFor(async () => {
      expect(await saveRepository.get('slot-1')).toBeNull();
    });
    expect(await screen.findByText(/Henüz kayıt yok/)).toBeInTheDocument();
  });
});

describe('Home "Devam Et"', () => {
  beforeEach(async () => {
    for (const slot of SAVE_SLOTS) await saveRepository.remove(slot);
  });

  function renderHome() {
    const Stub = createRoutesStub([
      { path: '/', Component: Home as never, loader: homeLoader as never },
    ]);
    render(<Stub initialEntries={['/']} />);
  }

  it('is disabled without saves', async () => {
    renderHome();

    expect(
      await screen.findByRole('button', { name: /devam et/i }),
    ).toBeDisabled();
  });

  it('opens the saves once there is one', async () => {
    await saveRepository.put('auto', game());
    renderHome();

    expect(
      await screen.findByRole('link', { name: /devam et/i }),
    ).toHaveAttribute('href', '/saves');
  });
});
