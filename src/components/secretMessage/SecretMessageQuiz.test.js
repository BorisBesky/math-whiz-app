import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import SecretMessageQuiz from './SecretMessageQuiz';
import { ALPHABET, SECRET_MESSAGES, makeClues, makeNumberLetterMap, messageLetters, readSecretSession } from './secretMessageConfig';

beforeEach(() => localStorage.clear());

it('creates a reproducible bijection for each puzzle rather than an alphabet-position code', () => {
  const first = makeNumberLetterMap(12);
  expect(makeNumberLetterMap(12)).toEqual(first);
  expect(makeNumberLetterMap(13)).not.toEqual(first);
  expect(Object.keys(first).join('')).toBe(ALPHABET);
  expect(Object.values(first).sort((a, b) => a - b)).toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
  expect(Object.values(first)).not.toEqual(Array.from({ length: 26 }, (_, i) => i + 1));
});

it('generates one exact arithmetic clue per distinct letter for every message and grade', () => {
  for (const grade of ['G3', 'G4', 'G5']) {
    for (const seed of [0, 1, 7, 999999]) {
      for (const message of SECRET_MESSAGES) {
        const clues = makeClues(message, grade, seed);
        expect(clues.map(clue => clue.letter).sort()).toEqual([...new Set(messageLetters(message))].sort());
        for (const clue of clues) {
          const [left, operation, right] = clue.expression.split(' ');
          const a = Number(left), b = Number(right);
          const result = { '+': () => a + b, '−': () => a - b, '÷': () => a / b, '×': () => a * b }[operation]();
          expect(result).toBe(clue.answer);
          expect(makeNumberLetterMap(seed)[clue.letter]).toBe(result);
        }
      }
    }
  }
});

it('starts with numbered spaces, unlocks a mapping after correct math, and fills all occurrences on click', () => {
  const props = { userId: 'student', selectedGrade: 'G3', returnToTopics: jest.fn() };
  const key = 'mathwhiz-secret-message-v2:student:G3';
  // Sagan's quote includes repeated letters, so this also checks that every occurrence is filled.
  const message = SECRET_MESSAGES[1];
  render(<SecretMessageQuiz {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /A message from Carl Sagan/ }));
  const session = readSecretSession(key);
  const clues = makeClues(message, 'G3', session.seed);
  expect(screen.getAllByLabelText(/Number \d+, hidden letter/)).toHaveLength(messageLetters(message).length);
  expect(screen.getByRole('button', { name: `${clues[0].letter}, locked` })).toBeDisabled();
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
    }
    expect(readSecretSession(key).solved).toBe(index);
    expect(screen.queryByLabelText(`${clue.answer} decoded as ${clue.letter}`)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: `Place ${clue.letter} in every ${clue.answer}` }));
    const occurrences = [...messageLetters(message)].filter(letter => letter === clue.letter).length;
    expect(screen.getAllByLabelText(`${clue.answer} decoded as ${clue.letter}`)).toHaveLength(occurrences);
  }
  expect(screen.getByText('Message decoded!')).toBeInTheDocument();
  expect(screen.getByText(`“${message.text}”`)).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /quote’s source/ })).toHaveAttribute('href', message.source);
  fireEvent.click(screen.getByRole('button', { name: 'Choose another message' }));
  expect(screen.getByText('Choose a mystery')).toBeInTheDocument();
  expect(localStorage.getItem(key)).toBeNull();
});

it('ignores invalid sessions and old alphabet-code progress and isolates students and grades', () => {
  for (const value of ['invalid json', JSON.stringify({ quoteId: 'missing' }), JSON.stringify({ quoteId: 'hawking-curious', seed: 0, solved: 9, mathSolved: false })]) {
    localStorage.setItem('bad', value);
    expect(readSecretSession('bad')).toBeNull();
  }
  localStorage.setItem('mathwhiz-secret-message-v1:student:G4', JSON.stringify({ quoteId: 'hawking-curious', seed: 0, solved: 2, mathSolved: false }));
  localStorage.setItem('mathwhiz-secret-message-v2:other:G3', JSON.stringify({ quoteId: 'hawking-curious', seed: 0, solved: 2, mathSolved: false }));
  render(<SecretMessageQuiz userId="student" selectedGrade="G4" returnToTopics={() => {}} />);
  expect(screen.getByText('Choose a mystery')).toBeInTheDocument();
});
