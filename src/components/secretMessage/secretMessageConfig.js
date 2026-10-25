import additionalQuotes from './data/quotes.json';
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
  ...additionalQuotes,
];
export const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
export const messageLetters = message => message.text.toUpperCase().replace(/[^A-Z]/g, '');

// Seeded shuffling keeps a puzzle's private code stable across reloads.
function shuffle(items, seed) {
  const result = [...items];
  let state = seed + 1;
  for (let index = result.length - 1; index > 0; index--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    const other = Math.floor((state / 4294967296) * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

export const complexityTier = level => level < 0.35 ? 0 : level >= 0.7 ? 2 : 1;

export function makeNumberLetterMap(seed, grade = 'G3', complexity = 0.5) {
  const tier = complexityTier(complexity);
  const [minimum, width] = grade === 'G5' ? [150 + tier * 100, 650 + tier * 500]
    : grade === 'G4' ? [80 + tier * 40, 250 + tier * 200] : [4, 60 + tier * 18];
  const numbers = shuffle(Array.from({ length: width }, (_, index) => minimum + index), seed).slice(0, 26);
  return Object.fromEntries([...ALPHABET].map((letter, index) => [letter, numbers[index]]));
}

// Missing-number arithmetic and word problems use the same seeded code as the board.
// Grade and complexity are frozen in the session so resumed clues cannot change.
export function makeClues(message, grade, seed = 0, complexity = 0.5) {
  const code = makeNumberLetterMap(seed, grade, complexity);
  const tier = complexityTier(complexity);
  const gradeNumber = grade === 'G5' ? 5 : grade === 'G4' ? 4 : 3;
  return shuffle([...new Set(messageLetters(message))], seed + 7919).map((letter, index) => {
    const answer = code[letter];
    const factor = 3 + ((seed + index * 7) % (gradeNumber === 3 ? 7 : 10));
    const base = gradeNumber === 3 ? 100 + (seed + index * 37) % 500
      : gradeNumber === 4 ? 1000 * (10 ** tier) + (seed + index * 137) % 5000 : 2000 + (seed + index * 337) % 6000;
    const operation = (seed + index) % 4;
    let expression, hint, skill, operands;
    if (gradeNumber === 5 && operation === 0) {
      const denominator = [3, 4, 5, 8, 10, 12][(seed + index) % 6];
      const possibleNumerators = tier === 0 ? [] : [2, 3, 4, 5, 7].filter(value => value < denominator && answer % value === 0);
      const numerator = possibleNumerators.length ? possibleNumerators[(seed + index) % possibleNumerators.length] : 1;
      const whole = (answer / numerator) * denominator;
      expression = `What is ${numerator}/${denominator} of ${whole}?`;
      hint = `Divide the whole quantity by ${denominator}, then multiply by ${numerator}.`;
      skill = 'fraction of a quantity'; operands = [whole, denominator, numerator];
    } else if (gradeNumber === 5 && operation === 1) {
      const places = tier + 1;
      const scale = 10 ** places;
      const part = Math.floor(answer / 3);
      const fractionalPart = Math.floor(scale * 0.37) || 3;
      const left = part + fractionalPart / scale;
      const right = answer - part - fractionalPart / scale;
      expression = `${left.toFixed(places)} + ${right.toFixed(places)} = ?`;
      hint = 'Line up the decimal points. Add each place value, regrouping when needed.';
      skill = 'decimal addition'; operands = [left, right];
    } else if (operation === 0) {
      expression = `${base} + ? = ${base + answer}`;
      hint = 'Subtract the known addend from the total. Regroup if you need to.';
      skill = 'missing addend'; operands = [base, base + answer];
    } else if (operation === 1) {
      expression = `${base + answer} − ${base} = ?`;
      hint = 'Subtract by place value, regrouping across columns when needed.';
      skill = 'subtraction with regrouping'; operands = [base + answer, base];
    } else if (operation === 2 && gradeNumber === 3 && answer > 10) {
      const received = 25 + factor * (tier + 2);
      expression = `A class has ${base} pencils. They receive ${received} more and give away ${base + received - answer}. How many pencils remain?`;
      hint = 'Add the pencils received to the starting amount, then subtract the pencils given away.';
      skill = 'two-step addition word problem'; operands = [base, received, base + received - answer];
    } else if (operation === 2) {
      const groupSize = gradeNumber === 3 ? Math.min(factor, Math.floor(100 / (answer + tier + 2))) : gradeNumber === 4 ? Math.min(factor, 9) : factor;
      const extra = groupSize * (tier + 2);
      expression = `A class packs ${answer * groupSize + extra} pencils into groups of ${groupSize}. They give away ${tier + 2} groups. How many groups remain?`;
      hint = `First divide by ${groupSize} to find the number of groups. Then subtract the groups given away.`;
      skill = 'two-step division word problem'; operands = [answer * groupSize + extra, groupSize, tier + 2];
    } else {
      const factors = Array.from({ length: gradeNumber === 5 ? 88 : 8 }, (_, i) => i + 2)
        .filter(value => answer % value === 0 && answer / value >= 2 &&
          (gradeNumber === 3 ? answer <= 100 && answer / value <= 10 : gradeNumber === 4 ? answer / value <= 999 : answer / value <= 99));
      if (factors.length) {
        const multiplier = factors[(seed + index) % factors.length];
        expression = `${answer / multiplier} × ${multiplier} = ?`;
        hint = gradeNumber === 3 ? 'Use equal groups or a multiplication fact.' : 'Multiply by place value, then add the partial products.';
        skill = 'multiplication'; operands = [answer / multiplier, multiplier];
      } else if (gradeNumber === 3 && answer > 10) {
        expression = `${base + answer} − ${base} = ?`;
        hint = 'Subtract by place value and regroup when needed.';
        skill = 'subtraction with regrouping'; operands = [base + answer, base];
      } else {
      // Division is capped to grade-appropriate dividend sizes.
      const divisor = gradeNumber === 3 ? factor : gradeNumber === 4 ? Math.min(factor, 9) : Math.min(factor, Math.floor(9999 / answer));
      expression = `${answer * divisor} ÷ ${divisor} = ?`;
      hint = 'Use place value and multiplication facts to divide. Check by multiplying your result by the divisor.';
      skill = 'whole-number division'; operands = [answer * divisor, divisor];
      }
    }
    return { expression, answer, letter, hint, skill, operands, grade, complexity };
  });
}

export function readSecretSession(key, messages = SECRET_MESSAGES) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    const message = messages.find(item => item.id === saved?.quoteId);
    if (message && Number.isInteger(saved.seed) && saved.seed >= 0 && saved.seed < 1000000 &&
        Number.isInteger(saved.solved) && saved.solved >= 0 && saved.solved <= new Set(messageLetters(message)).size &&
        Number.isSafeInteger(saved.batch) && saved.batch >= 0 && typeof saved.mathSolved === 'boolean' && Number.isFinite(saved.complexity) && saved.complexity >= 0.15 && saved.complexity <= 0.95 &&
        Number.isInteger(saved.firstTry) && saved.firstTry >= 0 && saved.firstTry <= saved.solved &&
        typeof saved.hadMistake === 'boolean') return saved;
  } catch (_) { /* Browser storage may be unavailable or contain an older session. */ }
  return null;
}
