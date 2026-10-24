// Short excerpts with source links for attribution and review.
export const SECRET_MESSAGES = [
  {
    id: 'hawking-curious', text: 'Be curious.', scientist: 'Stephen Hawking',
    description: 'A physicist who studied black holes and the universe.',
    meaning: 'Ask questions and explore the things you wonder about.',
    source: 'https://www.hawking.org.uk/in-words/speeches/speech-5',
  },
  {
    id: 'sagan-cosmos', text: 'The cosmos is within us.', scientist: 'Carl Sagan',
    description: 'An astronomer who helped people discover the wonders of space.',
    meaning: 'Cosmos means universe. The elements in our bodies also belong to the stars!',
    source: 'https://www.nasa.gov/general/how-are-we-made-of-star-stuff-we-asked-a-nasa-expert-episode-58/',
  },
  {
    id: 'einstein-curious', text: 'I am only passionately curious.', scientist: 'Albert Einstein',
    description: 'A physicist who explored light, time, and space.',
    meaning: 'Being excited to learn and asking questions can lead to great discoveries.',
    source: 'https://blogs.loc.gov/teachers/2019/10/five-questions-with-amara-alexander-2019-20-albert-einstein-distinguished-educator-fellow-at-the-library-of-congress/',
  },
];
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const messageLetters = message => message.text.toUpperCase().replace(/[^A-Z]/g, '');

// A saved seed recreates the same clues on reload. All answers are integers 1–26.
export function makeClues(message, grade, seed = 0) {
  return [...messageLetters(message)].map((letter, index) => {
    const answer = ALPHABET.indexOf(letter) + 1;
    const offset = ((seed + index * 7) % 9) + 2;
    const operation = (seed + index) % (grade === 'G3' ? 3 : 4);
    let expression;
    let hint;
    if (operation === 0) {
      const part = Math.max(1, Math.floor(answer / 2));
      expression = `${part} + ${answer - part}`;
      hint = 'Start with the first number and count on by the second number.';
    } else if (operation === 1) {
      expression = `${answer + offset} − ${offset}`;
      hint = 'Count back by the second number, or use addition to find the difference.';
    } else if (operation === 2) {
      expression = `${answer * offset} ÷ ${offset}`;
      hint = `Think: ${offset} times what number equals ${answer * offset}?`;
    } else {
      const factor = [2, 3, 4, 5].find(value => answer % value === 0) || 1;
      expression = `${factor} × ${answer / factor}`;
      hint = 'Use equal groups or a multiplication fact.';
    }
    return { expression, answer, letter, hint };
  });
}

export function readSecretSession(key) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    const message = SECRET_MESSAGES.find(item => item.id === saved?.quoteId);
    if (message && Number.isInteger(saved.seed) && saved.seed >= 0 && saved.seed < 1000000 &&
        Number.isInteger(saved.solved) && saved.solved >= 0 && saved.solved <= messageLetters(message).length &&
        typeof saved.mathSolved === 'boolean') return saved;
  } catch (_) { /* Browser storage may be unavailable or contain an older session. */ }
  return null;
}
