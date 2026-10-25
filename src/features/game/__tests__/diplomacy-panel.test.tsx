import { fireEvent, render, screen } from '@testing-library/react';

import {
  DiplomacyPanel,
  type DiplomacyRow,
} from '../components/diplomacy-panel';

const rows: DiplomacyRow[] = [
  {
    id: 'bizans',
    name: 'Bizans',
    color: '#7e22ce',
    relation: 'war',
    actions: [{ id: 'peace', label: 'Barış öner' }],
  },
  {
    id: 'germiyan',
    name: 'Germiyan',
    color: '#15803d',
    relation: 'peace',
    note: 'Her tur 3 akçe haraç ödüyorsun.',
    actions: [
      {
        id: 'alliance',
        label: 'İttifak öner',
        disabledReason: 'Yeterli akçe yok',
      },
      { id: 'war', label: 'Savaş ilan et' },
    ],
  },
];

describe('DiplomacyPanel', () => {
  it('shows relations, notes and actions', () => {
    const onAction = vi.fn();
    render(
      <DiplomacyPanel
        rows={rows}
        offers={[]}
        feedback={[]}
        onAction={onAction}
        onRespond={() => {}}
      />,
    );

    expect(screen.getByText('Savaş')).toBeInTheDocument();
    expect(screen.getByText('Barış')).toBeInTheDocument();
    expect(
      screen.getByText('Her tur 3 akçe haraç ödüyorsun.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Germiyan: İttifak öner' }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Germiyan: Savaş ilan et' }),
    );
    expect(onAction).toHaveBeenCalledWith('germiyan', 'war');
  });

  it('lets the player answer offers', () => {
    const onRespond = vi.fn();
    render(
      <DiplomacyPanel
        rows={rows}
        offers={[{ id: 'offer-1', text: 'Bizans barış teklif ediyor.' }]}
        feedback={['Bizans teklifini reddetti']}
        onAction={() => {}}
        onRespond={onRespond}
      />,
    );

    expect(screen.getByText('Diplomasi (1)')).toBeInTheDocument();
    expect(screen.getByText('Bizans teklifini reddetti')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Kabul et' }));
    expect(onRespond).toHaveBeenCalledWith('offer-1', true);
    fireEvent.click(screen.getByRole('button', { name: 'Reddet' }));
    expect(onRespond).toHaveBeenCalledWith('offer-1', false);
  });
});
