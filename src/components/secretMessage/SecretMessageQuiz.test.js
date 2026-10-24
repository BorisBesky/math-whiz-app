import React from 'react';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import SecretMessageQuiz from './SecretMessageQuiz';
import { ALPHABET, SECRET_MESSAGES, makeClues, makeNumberLetterMap, messageLetters, readSecretSession } from './secretMessageConfig';
import { generateMessageBatch, completeMessage, emptyMessageProgress, ORIGINAL_MESSAGE_CAPACITY } from './messageLibrary';

beforeEach(() => localStorage.clear());
const normalized = text => text.toLowerCase().replace(/[^a-z]/g, '');
const key = 'mathwhiz-secret-message-v4:student:G3';
const props = { userId: 'student', selectedGrade: 'G3', returnToTopics: jest.fn() };
const performance = { total: 20, firstTry: 20, complexity: 0.5 };

it('contains 200 unique sourced quotes with usable attributions and short texts', () => {
  expect(SECRET_MESSAGES).toHaveLength(200);
  expect(new Set(SECRET_MESSAGES.map(item => item.id)).size).toBe(200);
  expect(new Set(SECRET_MESSAGES.map(item => normalized(item.text))).size).toBe(200);
  for (const message of SECRET_MESSAGES) {
    expect(message.source).toMatch(/^https:\/\//);
    expect(message.scientist).toBeTruthy();
    expect(message.text.length).toBeLessThanOrEqual(110);
    expect(makeClues(message, 'G3').length).toBeGreaterThan(0);
  }
});

it('replenishes with 200 original messages after every completed batch without repeating', () => {
  let progress = emptyMessageProgress();
  const seen = new Set();
  for (let batch = 0; batch < 5; batch++) {
    const messages = generateMessageBatch(batch);
    expect(messages).toHaveLength(200);
    expect(messages.every(message => message.text.length <= 140)).toBe(true);
    expect(generateMessageBatch(batch)).toEqual(messages);
    for (const message of messages) {
      expect(seen.has(normalized(message.text))).toBe(false);
      seen.add(normalized(message.text));
      progress = completeMessage(progress, message.id, 'G3', performance);
    }
    expect(progress.batch).toBe(batch + 1);
    expect(progress.completedIds).toEqual([]);
    expect(progress.completedCount).toBe((batch + 1) * 200);
  }
  expect(generateMessageBatch(1).every(message => message.attribution === 'original' && message.scientist === 'Math Whiz original' && !message.source)).toBe(true);
  expect(() => generateMessageBatch(Math.floor(ORIGINAL_MESSAGE_CAPACITY / 200) + 1)).toThrow();
});

it('makes completion idempotent, bounds summary size, and adapts complexity separately per grade', () => {
  const first = completeMessage(null, SECRET_MESSAGES[0].id, 'G3', performance);
  expect(first.completedCount).toBe(1);
  expect(first.complexityByGrade.G3).toBeCloseTo(0.58);
  expect(completeMessage(first, SECRET_MESSAGES[0].id, 'G4', performance)).toEqual(first);
  const next = completeMessage(first, SECRET_MESSAGES[1].id, 'G4', { ...performance, firstTry: 4 });
  expect(next.complexityByGrade.G4).toBeCloseTo(0.42);
  expect(next.complexityByGrade.G3).toBeCloseTo(0.58);
  expect(completeMessage(next, 'unknown-id', 'G4', performance)).toEqual(next);
});

it('creates stable unique number codes and grade/complexity-specific arithmetic with exact answers', () => {
  expect(makeNumberLetterMap(12)).toEqual(makeNumberLetterMap(12));
  expect(makeNumberLetterMap(13)).not.toEqual(makeNumberLetterMap(12));
  for (const grade of ['G3', 'G4', 'G5']) {
    for (const complexity of [0.2, 0.5, 0.9]) {
      for (const seed of [0, 1, 7, 999999]) {
        const map = makeNumberLetterMap(seed, grade, complexity);
        expect(Object.keys(map).join('')).toBe(ALPHABET);
        expect(new Set(Object.values(map)).size).toBe(26);
        for (const message of [SECRET_MESSAGES[0], SECRET_MESSAGES[1], ...generateMessageBatch(1).slice(0, 2)]) {
          const clues = makeClues(message, grade, seed, complexity);
          expect(clues.map(clue => clue.letter).sort()).toEqual([...new Set(messageLetters(message))].sort());
          for (const clue of clues) {
            const [a, b, c] = clue.operands;
            const results = {
              'fraction of a quantity': () => a / b * c,
              'decimal addition': () => Math.round((a + b) * 1000) / 1000,
              'missing addend': () => b - a,
              'subtraction with regrouping': () => a - b,
              'two-step division word problem': () => a / b - c,
              'two-step addition word problem': () => a + b - c,
              'multiplication': () => a * b,
              'whole-number division': () => a / b,
            };
            expect(results[clue.skill]()).toBe(clue.answer);
            expect(clue.answer).toBe(map[clue.letter]);
            expect(clue.answer).toBeGreaterThan(1);
            expect(clue.grade).toBe(grade);
            expect(grade === 'G3' && clue.skill === 'multiplication' ? a * b : 0).toBeLessThanOrEqual(100);
            expect(grade === 'G3' && /division/.test(clue.skill) ? a : 0).toBeLessThanOrEqual(100);
            expect(grade === 'G4' && /division/.test(clue.skill) ? b : 0).toBeLessThanOrEqual(9);
            expect(clue.skill === 'whole-number division' ? a : 0).toBeLessThanOrEqual(9999);
          }
        }
      }
    }
  }
  const sum = map => Object.values(map).reduce((a, b) => a + b, 0);
  expect(sum(makeNumberLetterMap(1, 'G4', 0.5))).toBeGreaterThan(sum(makeNumberLetterMap(1, 'G3', 0.5)));
  expect(sum(makeNumberLetterMap(1, 'G5', 0.9))).toBeGreaterThan(sum(makeNumberLetterMap(1, 'G5', 0.2)));
});

it('requires correct math before clicking a letter, resumes, and never offers a completed quote again', async () => {
  const message = SECRET_MESSAGES[1];
  render(<SecretMessageQuiz {...props} />);
  fireEvent.click(screen.getByRole('button', { name: /A message from Carl Sagan/ }));
  const session = readSecretSession(key);
  const clues = makeClues(message, 'G3', session.seed, session.complexity);
  expect(screen.getAllByLabelText(/Number \d+, hidden letter/)).toHaveLength(messageLetters(message).length);
  expect(screen.getByRole('button', { name: `${clues[0].letter}, locked` })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Your math answer'), { target: { value: String(clues[0].answer + 1) } });
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
    fireEvent.click(screen.getByRole('button', { name: `Place ${clue.letter} in every ${clue.answer}` }));
    expect(screen.getAllByLabelText(`${clue.answer} decoded as ${clue.letter}`)).toHaveLength([...messageLetters(message)].filter(letter => letter === clue.letter).length);
  }
  expect(screen.getByText(`“${message.text}”`)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByRole('button', { name: 'Choose another message' })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: 'Choose another message' }));
  expect(screen.queryByRole('button', { name: /A message from Carl Sagan/ })).not.toBeInTheDocument();
  cleanup();
  render(<SecretMessageQuiz {...props} selectedGrade="G4" />);
  expect(screen.queryByRole('button', { name: /A message from Carl Sagan/ })).not.toBeInTheDocument();
  expect(screen.getByText(/1 message completed/)).toBeInTheDocument();
});

function completedSession() {
  const message = SECRET_MESSAGES[0];
  const total = new Set(messageLetters(message)).size;
  return { quoteId: message.id, message, seed: 0, solved: total, mathSolved: false, batch: 0, complexity: 0.5, firstTry: total, hadMistake: false };
}

it('requires durable completion before continuing and lets students retry failed account saves', async () => {
  localStorage.setItem(key, JSON.stringify(completedSession()));
  const saved = completeMessage(null, SECRET_MESSAGES[0].id, 'G3', performance);
  const saveCompletion = jest.fn().mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(saved);
  render(<SecretMessageQuiz {...props} saveCompletion={saveCompletion} />);
  await screen.findByRole('button', { name: 'Retry saving completion' });
  expect(screen.getByRole('button', { name: 'Choose another message' })).toBeDisabled();
  fireEvent.click(screen.getByRole('button', { name: 'Retry saving completion' }));
  await waitFor(() => expect(screen.getByRole('button', { name: 'Choose another message' })).toBeEnabled());
  expect(saveCompletion).toHaveBeenCalledTimes(2);
});

it('loads cloud completion history, invalidates stale open puzzles, and preserves the saved challenge', () => {
  const session = { ...completedSession(), solved: 0, firstTry: 0, complexity: 0.9 };
  localStorage.setItem(key, JSON.stringify(session));
  const view = render(<SecretMessageQuiz {...props} initialComplexity={0.2} />);
  expect(screen.getByText(/Extra challenge/)).toBeInTheDocument();
  view.rerender(<SecretMessageQuiz {...props} savedProgress={completeMessage(null, session.quoteId, 'G3', performance)} />);
  expect(screen.getByText('Choose a mystery')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /A message from Stephen Hawking/ })).not.toBeInTheDocument();
});

it('ignores invalid sessions and old puzzle progress', () => {
  for (const value of ['invalid json', JSON.stringify({ quoteId: 'missing' }), JSON.stringify({ ...completedSession(), solved: 9 })]) {
    localStorage.setItem('bad', value);
    expect(readSecretSession('bad')).toBeNull();
  }
  localStorage.setItem('mathwhiz-secret-message-v2:student:G3', JSON.stringify(completedSession()));
  render(<SecretMessageQuiz {...props} />);
  expect(screen.getByText('Choose a mystery')).toBeInTheDocument();
});


it('automatically offers 200 labeled originals after the last quote is completed', async () => {
  const last = SECRET_MESSAGES[199];
  const total = new Set(messageLetters(last)).size;
  localStorage.setItem(key, JSON.stringify({ ...completedSession(), quoteId: last.id, message: last, solved: total, firstTry: total }));
  const progress = { ...emptyMessageProgress(), completedIds: SECRET_MESSAGES.slice(0, 199).map(item => item.id) };
  render(<SecretMessageQuiz {...props} savedProgress={progress} />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Choose another message' })).toBeEnabled());
  expect(screen.getByText(`“${last.text}”`)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Choose another message' }));
  expect(screen.getByText(/New batch: 200 Math Whiz original messages/)).toBeInTheDocument();
  expect(screen.getByText(/200 messages completed/)).toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: /A message from Math Whiz original/ })).toHaveLength(6);
  const stored = JSON.parse(localStorage.getItem('mathwhiz-secret-progress-v1:student'));
  expect(stored.batch).toBe(1);
  expect(stored.completedIds).toEqual([]);
});


it('saves the final available message at capacity without recycling the library', () => {
  const batch = Math.floor(ORIGINAL_MESSAGE_CAPACITY / 200);
  const messages = generateMessageBatch(batch);
  const progress = { ...emptyMessageProgress(), batch, completedIds: messages.slice(0, 199).map(item => item.id) };
  const next = completeMessage(progress, messages[199].id, 'G3', performance);
  expect(next.batch).toBe(batch);
  expect(next.completedIds).toHaveLength(200);
  expect(next.completedCount).toBe((batch + 1) * 200);
});
