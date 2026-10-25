import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import { SCENARIOS } from '@/content/scenarios';

import Scenarios from '../scenarios';

describe('Scenarios', () => {
  it('lists every scenario with a link that starts it', async () => {
    const Stub = createRoutesStub([
      { path: '/scenarios', Component: Scenarios },
    ]);
    render(<Stub initialEntries={['/scenarios']} />);

    expect(
      await screen.findByRole('heading', { name: 'Senaryo Seç' }),
    ).toBeInTheDocument();
    for (const scenario of SCENARIOS) {
      expect(
        screen.getByRole('heading', { name: scenario.name }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('link', {
          name: `${scenario.name} senaryosunu başlat`,
        }),
      ).toHaveAttribute('href', `/play/${scenario.id}`);
    }
  });

  it('shows the goals of the scenario', async () => {
    const Stub = createRoutesStub([
      { path: '/scenarios', Component: Scenarios },
    ]);
    render(<Stub initialEntries={['/scenarios']} />);

    expect(await screen.findAllByText(/Bursa'yı fethet/)).not.toHaveLength(0);
  });

  it('carries the chosen difficulty and mode to the game', async () => {
    const Stub = createRoutesStub([
      { path: '/scenarios', Component: Scenarios },
    ]);
    render(<Stub initialEntries={['/scenarios']} />);

    fireEvent.click(await screen.findByRole('radio', { name: 'Zor' }));
    fireEvent.click(screen.getByRole('checkbox', { name: 'Tarihe sadık mod' }));

    expect(
      screen.getByRole('link', { name: '1299 · Kuruluş senaryosunu başlat' }),
    ).toHaveAttribute(
      'href',
      '/play/kurulus-1299?difficulty=hard&historical=1',
    );
  });

  it('recommends the tutorial to new players', async () => {
    const Stub = createRoutesStub([
      { path: '/scenarios', Component: Scenarios },
    ]);
    render(<Stub initialEntries={['/scenarios']} />);

    expect(
      await screen.findByText('Yeni başlayanlar için önerilir'),
    ).toBeInTheDocument();
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings[0]).toHaveTextContent('Öğretici');
  });
});
