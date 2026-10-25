import { render, screen } from '@testing-library/react';
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

    expect(await screen.findByText(/Bursa'yı fethet/)).toBeInTheDocument();
  });
});
