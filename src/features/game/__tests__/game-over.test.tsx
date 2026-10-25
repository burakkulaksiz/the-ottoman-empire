import { fireEvent, render, screen } from '@testing-library/react';
import { createRoutesStub } from 'react-router';

import {
  DecisionsPanel,
  type DecisionPanelRow,
} from '../components/decisions-panel';
import {
  GameOverCard,
  type GameOverContent,
} from '../components/game-over-card';

function renderCard(content: GameOverContent, onDismiss = () => {}) {
  const Stub = createRoutesStub([
    {
      path: '/',
      Component: () => <GameOverCard content={content} onDismiss={onDismiss} />,
    },
  ]);
  render(<Stub initialEntries={['/']} />);
}

describe('GameOverCard', () => {
  it('announces a victory with its reason', async () => {
    renderCard({
      result: 'victory',
      reason: 'Senaryonun hedeflerini tamamladın.',
    });

    expect(
      await screen.findByRole('dialog', { name: 'Zafer' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Senaryonun hedeflerini tamamladın.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Tarihte gerçekte ne oldu?'),
    ).not.toBeInTheDocument();
  });

  it('compares the result and the decisions with history', async () => {
    renderCard({
      result: 'defeat',
      reason: 'Süre doldu.',
      score: { provinces: 1, benchmark: 3, points: 33, verdict: 'worse' },
      decisions: { matched: 1, total: 2 },
      historicalNote: 'Orhan 1326 yılında Bursa’yı aldı.',
    });

    expect(
      await screen.findByRole('dialog', { name: 'Yenilgi' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tarihten daha kötü bir sonuç: 1 bölge, tarihte 3/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('2 karardan 1 tanesinde tarihteki gibi davrandın.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Tarihte gerçekte ne oldu?')).toBeInTheDocument();
  });

  it('lets the player look at the map or start over', async () => {
    const onDismiss = vi.fn();
    renderCard({ result: 'victory', reason: 'x' }, onDismiss);

    fireEvent.click(
      await screen.findByRole('button', { name: 'Haritaya bak' }),
    );
    expect(onDismiss).toHaveBeenCalled();
    expect(screen.getByRole('link', { name: 'Yeni Oyun' })).toHaveAttribute(
      'href',
      '/scenarios',
    );
  });
});

describe('DecisionsPanel', () => {
  const rows: DecisionPanelRow[] = [
    {
      id: 'a',
      title: 'Koyunhisar Savaşı',
      choice: 'Meydanda karşıla',
      historicalChoice: 'Meydanda karşıla',
      matched: true,
    },
    {
      id: 'b',
      title: "Bursa'nın Düşüşü",
      choice: 'Askerlere yağma izni ver',
      historicalChoice: 'Halka aman ver',
      matched: false,
    },
  ];

  it('stays out of the way before any decision', () => {
    const { container } = render(<DecisionsPanel rows={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists decisions, what history chose, and the overall match', () => {
    render(<DecisionsPanel rows={rows} />);

    expect(screen.getByText('Koyunhisar Savaşı')).toBeInTheDocument();
    expect(screen.getByText('Tarihte: Halka aman ver')).toBeInTheDocument();
    expect(screen.getByLabelText('Tarihle aynı')).toBeInTheDocument();
    expect(screen.getByLabelText('Tarihten farklı')).toBeInTheDocument();
    expect(screen.getByText('Tarihle uyum: 1/2')).toBeInTheDocument();
  });
});
