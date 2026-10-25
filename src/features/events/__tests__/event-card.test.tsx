import { fireEvent, render, screen } from '@testing-library/react';

import { EventCard, type EventCardContent } from '../components/event-card';

const event: EventCardContent = {
  title: 'Koyunhisar Savaşı',
  description: 'Bizans ordusu geliyor.',
  choices: [
    { id: 'savas', label: 'Meydanda karşıla', outcome: 'Zafer kazandın.' },
    { id: 'cekil', label: 'Kalelere çekil', outcome: 'Moral düştü.' },
  ],
  historical: {
    note: 'Osman Bey Bizans ordusunu yendi.',
    choiceId: 'savas',
  },
};

describe('EventCard', () => {
  it('asks for a decision and hides the historical note until then', () => {
    render(
      <EventCard
        event={event}
        chosenId={null}
        onChoose={() => {}}
        onClose={() => {}}
      />,
    );

    expect(
      screen.getByRole('dialog', { name: 'Koyunhisar Savaşı' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Bizans ordusu geliyor.')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
    expect(
      screen.queryByText('Tarihte gerçekte ne oldu?'),
    ).not.toBeInTheDocument();
  });

  it('reports the choice the player clicks', () => {
    const onChoose = vi.fn();
    render(
      <EventCard
        event={event}
        chosenId={null}
        onChoose={onChoose}
        onClose={() => {}}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Kalelere çekil' }));
    expect(onChoose).toHaveBeenCalledWith('cekil');
  });

  it('shows the outcome and what really happened after the decision', () => {
    const onClose = vi.fn();
    render(
      <EventCard
        event={event}
        chosenId="savas"
        onChoose={() => {}}
        onClose={onClose}
      />,
    );

    expect(screen.getByText('Zafer kazandın.')).toBeInTheDocument();
    expect(screen.getByText('Tarihte gerçekte ne oldu?')).toBeInTheDocument();
    expect(
      screen.getByText('Osman Bey Bizans ordusunu yendi.'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Devam' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('says when the player decided as history did', () => {
    render(
      <EventCard
        event={event}
        chosenId="savas"
        onChoose={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId('verdict')).toHaveTextContent(
      'Tarihteki gibi karar verdin.',
    );
  });

  it('shows what history chose when the player decided differently', () => {
    render(
      <EventCard
        event={event}
        chosenId="cekil"
        onChoose={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByTestId('verdict')).toHaveTextContent(
      'Tarihte farklı oldu: "Meydanda karşıla" seçildi.',
    );
  });
});
