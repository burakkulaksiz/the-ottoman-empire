import { fireEvent, render, screen } from '@testing-library/react';

import { QuizCard, type QuizCardContent } from '../components/quiz-card';

const quiz: QuizCardContent = {
  question: 'Akçe neydi?',
  options: ['Gümüş sikke', 'Vergi', 'Kale'],
  answer: 0,
  explanation: 'Osmanlı gümüş sikkesiydi.',
};

const handlers = () => ({
  onChoose: vi.fn(),
  onSkip: vi.fn(),
  onReadMore: vi.fn(),
  onClose: vi.fn(),
});

describe('QuizCard', () => {
  it('asks the question, mentions the reward and can be skipped', () => {
    const h = handlers();
    render(<QuizCard quiz={quiz} chosen={null} reward={5} {...h} />);

    expect(
      screen.getByRole('dialog', { name: 'Akçe neydi?' }),
    ).toBeInTheDocument();
    expect(screen.getByText(/doğru cevap \+5 akçe/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vergi' }));
    expect(h.onChoose).toHaveBeenCalledWith(1);

    fireEvent.click(screen.getByRole('button', { name: 'Şimdi değil' }));
    expect(h.onSkip).toHaveBeenCalled();
  });

  it('praises a correct answer and explains', () => {
    render(<QuizCard quiz={quiz} chosen={0} reward={5} {...handlers()} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Doğru! Osmanlı gümüş sikkesiydi.',
    );
    expect(screen.getByRole('button', { name: 'Gümüş sikke' })).toBeDisabled();
  });

  it('shows the right answer after a wrong one, and links to the entry', () => {
    const h = handlers();
    render(<QuizCard quiz={quiz} chosen={2} reward={5} {...h} />);

    expect(screen.getByRole('status')).toHaveTextContent(
      'Doğru cevap işaretli.',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Ansiklopedide oku' }));
    expect(h.onReadMore).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Devam' }));
    expect(h.onClose).toHaveBeenCalled();
  });
});
