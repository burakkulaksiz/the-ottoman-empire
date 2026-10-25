import { fireEvent, render, screen } from '@testing-library/react';

import { CourtPanel, type CourtPerson } from '../components/court-panel';

const osman: CourtPerson = {
  id: 'osman',
  name: 'Osman Bey',
  age: 41,
  military: 4,
  administration: 3,
};
const orhan: CourtPerson = { ...osman, id: 'orhan', name: 'Orhan', age: 18 };

const base = {
  ruler: osman,
  heirs: [orhan],
  vizier: null,
  candidates: [],
  stability: 60,
  stabilityLabel: 'Sağlam',
  vizierCost: 20,
  canAffordVizier: true,
  onAppointVizier: () => {},
};

describe('CourtPanel', () => {
  it('shows the ruler, the heirs and the loyalty of the realm', () => {
    render(<CourtPanel {...base} />);

    expect(screen.getByText('Osman Bey')).toBeInTheDocument();
    expect(
      screen.getByText(/41 yaş · savaş 4 · yönetim 3/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Orhan/)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Sadakat' }),
    ).toHaveAttribute('aria-valuenow', '60');
    expect(screen.getByText('Sadakat: Sağlam')).toBeInTheDocument();
  });

  it('explains why no vizier can be appointed yet', () => {
    render(
      <CourtPanel
        {...base}
        vizierNote="Divan teşkilatı henüz kurulmadı; vezir atanamaz."
      />,
    );
    expect(
      screen.getByText('Divan teşkilatı henüz kurulmadı; vezir atanamaz.'),
    ).toBeInTheDocument();
  });

  it('lets the player appoint a candidate, if the treasury allows', () => {
    const onAppointVizier = vi.fn();
    const candidate = { ...osman, id: 'c1', name: 'Halil' };
    const { rerender } = render(
      <CourtPanel
        {...base}
        candidates={[candidate]}
        onAppointVizier={onAppointVizier}
      />,
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Vezir yap (20 akçe)' }),
    );
    expect(onAppointVizier).toHaveBeenCalledWith('c1');

    rerender(
      <CourtPanel {...base} candidates={[candidate]} canAffordVizier={false} />,
    );
    expect(
      screen.getByRole('button', { name: 'Vezir yap (20 akçe)' }),
    ).toBeDisabled();
  });

  it('shows the vizier once appointed', () => {
    render(
      <CourtPanel {...base} vizier={{ ...osman, id: 'v', name: 'Halil' }} />,
    );
    expect(screen.getByText('Halil')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
