import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SecretMessageQuiz from './SecretMessageQuiz';
import { ALPHABET, SECRET_MESSAGES, makeClues, messageLetters, readSecretSession } from './secretMessageConfig';

beforeEach(() => localStorage.clear());

it('generates exact arithmetic answers that decode every message in every supported grade', () => {
  for (const grade of ['G3', 'G4', 'G5']) {
    for (const seed of [0, 1, 7, 999999]) {
      for (const message of SECRET_MESSAGES) {
        const clues = makeClues(message, grade, seed);
        expect(clues.map(clue => clue.letter).join('')).toBe(messageLetters(message));
        for (const clue of clues) {
          const [left, operation, right] = clue.expression.split(' ');
          const a = Number(left), b = Number(right);
          const result = { '+': () => a + b, '−': () => a - b, '÷': () => a / b, '×': () => a * b }[operation]();
          expect(result).toBe(clue.answer);
          expect(ALPHABET[result - 1]).toBe(clue.letter);
        }
      }
    }
  }
});

it('requires correct math and letter answers, resumes, and reveals the completed quote', () => {
  const props = { userId: 'student', selectedGrade: 'G3', returnToTopics: jest.fn() };
  const key = 'mathwhiz-secret-message-v1:student:G3';
  render(<SecretMessageQuiz {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /A message from Stephen Hawking/ }));
  const session = readSecretSession(key);
  const clues = makeClues(SECRET_MESSAGES[0], 'G3', session.seed);
  fireEvent.change(screen.getByLabelText('Your math answer'), { target: { value: '99' } });
  fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
  expect(readSecretSession(key).solved).toBe(0);
  expect(screen.getByRole('status')).toHaveTextContent('Try again');
  fireEvent.click(screen.getByRole('button', { name: 'Need a hint?' }));
  expect(screen.getByText(clues[0].hint)).toBeInTheDocument();

  for (const [index, clue] of clues.entries()) {
    fireEvent.change(screen.getByLabelText('Your math answer'), { target: { value: String(clue.answer) } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    if (index === 0) {
      cleanup();
      render(<SecretMessageQuiz {...props} />);
      fireEvent.change(screen.getByLabelText(`Which letter matches ${clue.answer}?`), { target: { value: 'z' } });
      fireEvent.click(screen.getByRole('button', { name: 'Decode letter' }));
    }
    expect(readSecretSession(key).solved).toBe(index);
    fireEvent.change(screen.getByLabelText(`Which letter matches ${clue.answer}?`), { target: { value: clue.letter.toLowerCase() } });
    fireEvent.click(screen.getByRole('button', { name: 'Decode letter' }));
  }
  expect(screen.getByText('Message decoded!')).toBeInTheDocument();
  expect(screen.getByText('“Be curious.”')).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /quote’s source/ })).toHaveAttribute('href', SECRET_MESSAGES[0].source);
  fireEvent.click(screen.getByRole('button', { name: 'Choose another message' }));
  expect(screen.getByText('Choose a mystery')).toBeInTheDocument();
  expect(localStorage.getItem(key)).toBeNull();
});

it('ignores malformed or out-of-range saved sessions and isolates students and grades', () => {
  for (const value of ['invalid json', JSON.stringify({ quoteId: 'missing' }), JSON.stringify({ quoteId: 'hawking-curious', seed: 0, solved: 999, mathSolved: false })]) {
    localStorage.setItem('bad', value);
    expect(readSecretSession('bad')).toBeNull();
  }
  localStorage.setItem('mathwhiz-secret-message-v1:other:G3', JSON.stringify({ quoteId: 'hawking-curious', seed: 0, solved: 2, mathSolved: false }));
  render(<SecretMessageQuiz userId="student" selectedGrade="G4" returnToTopics={() => {}} />);
  expect(screen.getByText('Choose a mystery')).toBeInTheDocument();
});
