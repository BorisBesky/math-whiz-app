import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import SecretMessageBoard from './SecretMessageBoard';
import SecretMessageQuiz from './SecretMessageQuiz';
import { SECRET_MESSAGES, makeClues } from './secretMessageConfig';

const originalAnimate = HTMLElement.prototype.animate;
const originalMatchMedia = window.matchMedia;
const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
const advance = async duration => act(async () => { jest.advanceTimersByTime(duration); });

beforeEach(() => {
  jest.useFakeTimers();
  localStorage.clear();
  window.matchMedia = jest.fn(() => ({ matches: false }));
  HTMLElement.prototype.scrollIntoView = jest.fn();
  HTMLElement.prototype.animate = jest.fn((frames, options) => {
    let timer;
    const finished = new Promise(resolve => { timer = setTimeout(resolve, options.duration); });
    return { finished, cancel: jest.fn(() => clearTimeout(timer)) };
  });
});
afterEach(() => {
  jest.useRealTimers();
  HTMLElement.prototype.animate = originalAnimate;
  HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
  window.matchMedia = originalMatchMedia;
});

const boardProps = {
  message: { text: 'A B A.' }, code: { A: 42, B: 7 }, decodedLetters: new Set(),
  activeLetter: 'A', heading: 'Your message', scanRequest: { letter: 'A' },
};

it('scans the phrase in reading order, pauses at every match, and reveals each occurrence separately', async () => {
  const onScanComplete = jest.fn();
  render(<SecretMessageBoard {...boardProps} onScanComplete={onScanComplete} />);
  expect(screen.getAllByLabelText('Number 42, hidden letter')).toHaveLength(2);
  await advance(90);
  expect(screen.getAllByLabelText('42 decoded as A')).toHaveLength(1);
  expect(screen.getAllByLabelText('Number 42, hidden letter')).toHaveLength(1);
  expect(screen.getByLabelText('42 decoded as A')).toHaveClass('secret-message-found');
  await advance(250);
  expect(HTMLElement.prototype.animate).toHaveBeenCalledTimes(1);
  expect(onScanComplete).not.toHaveBeenCalled();
  await advance(75);
  await advance(90);
  expect(screen.getByLabelText('Number 7, hidden letter')).toBeInTheDocument();
  await advance(90);
  expect(screen.getAllByLabelText('42 decoded as A')).toHaveLength(2);
  expect(onScanComplete).not.toHaveBeenCalled();
  await advance(325);
  expect(HTMLElement.prototype.animate).toHaveBeenCalledTimes(3);
  expect(onScanComplete).toHaveBeenCalledTimes(1);
});

it('cancels an in-flight scan on navigation without completing or leaving timers behind', async () => {
  const onScanComplete = jest.fn();
  const view = render(<SecretMessageBoard {...boardProps} onScanComplete={onScanComplete} />);
  await advance(90);
  view.unmount();
  await advance(5000);
  expect(onScanComplete).not.toHaveBeenCalled();
  jest.runAllTicks();
  expect(jest.getTimerCount()).toBe(0);
});

it('reveals immediately for reduced-motion users', () => {
  window.matchMedia = jest.fn(() => ({ matches: true }));
  const onScanComplete = jest.fn();
  render(<SecretMessageBoard {...boardProps} onScanComplete={onScanComplete} />);
  expect(onScanComplete).toHaveBeenCalledTimes(1);
  expect(HTMLElement.prototype.animate).not.toHaveBeenCalled();
  expect(HTMLElement.prototype.scrollIntoView).not.toHaveBeenCalled();
});

it('locks repeated clicks and advances the quiz only after the complete scan', async () => {
  const message = SECRET_MESSAGES[0];
  const clue = makeClues(message, 'G3', 0, 0.5)[0];
  const key = 'mathwhiz-secret-message-v4:student:G3';
  localStorage.setItem(key, JSON.stringify({ quoteId: message.id, batch: 0, seed: 0, solved: 0, mathSolved: true, complexity: 0.5, firstTry: 0, hadMistake: false }));
  render(<SecretMessageQuiz userId="student" selectedGrade="G3" returnToTopics={() => {}} />);
  const place = screen.getByRole('button', { name: `Place ${clue.letter} in every ${clue.answer}` });
  fireEvent.click(place);
  fireEvent.click(place);
  expect(place).toBeDisabled();
  expect(screen.getByRole('button', { name: 'Choose a different message' })).toBeDisabled();
  expect(JSON.parse(localStorage.getItem(key)).solved).toBe(0);
  for (let i = 0; i < 20; i++) await advance(500);
  expect(screen.queryByTestId('message-magnifier')).not.toBeInTheDocument();
  expect(JSON.parse(localStorage.getItem(key)).solved).toBe(1);
  expect(JSON.parse(localStorage.getItem(key)).firstTry).toBe(1);
  expect(screen.getByText(/Clue 2 of/)).toBeInTheDocument();
});
