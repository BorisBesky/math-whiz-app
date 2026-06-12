import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestionPoolHealthBanner from '../QuestionPoolHealthBanner';

const flag = (over = {}) => ({
  topic: 'Geometry',
  subtopic: 'lines and angles',
  distinctQuestions: 4,
  totalAnswers: 12,
  maxRepeats: 5,
  repeatedQuestionCount: 1,
  sampleQuestion: 'What is an exact location with no size?',
  severity: 'high',
  ...over,
});

describe('QuestionPoolHealthBanner', () => {
  test('renders nothing when there are no flags', () => {
    const { container } = render(<QuestionPoolHealthBanner flags={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test('lists flagged topic/subtopic with repeat detail and sample', () => {
    render(<QuestionPoolHealthBanner flags={[flag()]} />);
    expect(screen.getByText(/Students are repeating questions/i)).toBeInTheDocument();
    expect(screen.getByText(/Geometry — lines and angles/)).toBeInTheDocument();
    expect(screen.getByText(/seen up to 5×/)).toBeInTheDocument();
    expect(screen.getByText(/exact location with no size/)).toBeInTheDocument();
  });

  test('shows an "Add questions" CTA only when onAddQuestions is provided, and passes the flag', () => {
    const onAddQuestions = jest.fn();
    const f = flag();
    const { rerender } = render(<QuestionPoolHealthBanner flags={[f]} />);
    expect(screen.queryByRole('button', { name: /add questions/i })).not.toBeInTheDocument();

    rerender(<QuestionPoolHealthBanner flags={[f]} onAddQuestions={onAddQuestions} />);
    fireEvent.click(screen.getByRole('button', { name: /add questions/i }));
    expect(onAddQuestions).toHaveBeenCalledWith(f);
  });

  test('renders a topic without a subtopic gracefully', () => {
    render(<QuestionPoolHealthBanner flags={[flag({ subtopic: '', topic: 'Binary' })]} />);
    expect(screen.getByText('Binary')).toBeInTheDocument();
  });
});
