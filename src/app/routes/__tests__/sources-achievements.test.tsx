import { render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { ACHIEVEMENTS } from '@/content/achievements';
import { achievementRepository } from '@/lib/achievements/achievement-repository';

import Achievements, {
  clientLoader as achievementsLoader,
} from '../achievements';
import EncyclopediaEntryPage, {
  clientLoader as entryLoader,
} from '../encyclopedia-entry';
import Home from '../home';
import Sources from '../sources';

function renderAt(path: string) {
  const Stub = createRoutesStub([
    { path: '/', Component: Home },
    { path: '/sources', Component: Sources },
    {
      path: '/achievements',
      Component: Achievements as never,
      loader: achievementsLoader as never,
    },
    {
      path: '/encyclopedia/:entryId',
      Component: EncyclopediaEntryPage as never,
      loader: entryLoader as never,
    },
  ]);
  render(<Stub initialEntries={[path]} />);
}

describe('Kaynakça', () => {
  it('lists the sources by kind with the entries that cite them', async () => {
    renderAt('/sources');

    expect(
      await screen.findByRole('heading', { name: 'Kaynakça' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Birincil kaynaklar' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Tevârîh-i Âl-i Osman')).toBeInTheDocument();
    expect(
      screen.getAllByRole('link', { name: 'Tımar sistemi' })[0],
    ).toHaveAttribute('href', '/encyclopedia/timar');
  });

  it('shows the sources at the bottom of an entry', async () => {
    renderAt('/encyclopedia/koyunhisar');

    expect(
      await screen.findByRole('heading', { name: 'Kaynaklar' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Georgios Pachymeres, Syngraphikai Historiai (Tarih)'),
    ).toBeInTheDocument();
  });
});

describe('Başarımlar', () => {
  it('are reachable from the main menu', async () => {
    renderAt('/');
    expect(
      await screen.findByRole('link', { name: /başarımlar/i }),
    ).toHaveAttribute('href', '/achievements');
  });

  it('show which achievements are earned', async () => {
    await achievementRepository.add([
      {
        id: 'ilk-fetih',
        unlockedAt: Date.UTC(2026, 9, 25),
        scenarioId: 'kurulus-1299',
      },
    ]);
    renderAt('/achievements');

    expect(
      await screen.findByText(`1/${ACHIEVEMENTS.length}`),
    ).toBeInTheDocument();
    expect(screen.getAllByLabelText('Kazanıldı')).toHaveLength(1);
    expect(screen.getAllByLabelText('Kilitli')).toHaveLength(
      ACHIEVEMENTS.length - 1,
    );
  });
});
