import {
  generateLengthConversionQuestion,
  generateWeightCapacityConversionQuestion,
  generateTimeConversionQuestion,
  generateClockReadingQuestion,
  generateAreaPerimeterQuestion,
} from '../questions.js';

// Mock the clock SVG generator so the tests don't depend on its output.
jest.mock('../../../../utils/clockGenerator.js', () => ({
  generateClockSVG: jest.fn(() => '<svg/>'),
}));

describe('generateLengthConversionQuestion hint singularization', () => {
  it('never produces the "fee" typo in the hint when converting from "feet"', () => {
    // Many iterations to make sure we hit every conversion in the list.
    for (let i = 0; i < 200; i += 1) {
      const q = generateLengthConversionQuestion();
      expect(q.hint).not.toMatch(/\b1 fee\b/);
      // Should never display a bare plural form right after "1 ".
      expect(q.hint).not.toMatch(/\b1 (feet|yards|miles|meters|kilometers)\b/);
    }
  });

  it('uses "foot" (not "fee") in the hint when converting from feet', () => {
    const feetQuestionHints = [];
    for (let i = 0; i < 500 && feetQuestionHints.length === 0; i += 1) {
      const q = generateLengthConversionQuestion();
      if (q.question.includes(' feet?')) {
        feetQuestionHints.push(q.hint);
      }
    }
    expect(feetQuestionHints.length).toBeGreaterThan(0);
    expect(feetQuestionHints[0]).toContain('1 foot');
  });
});

describe('generateWeightCapacityConversionQuestion hint singularization', () => {
  it('never produces a bare plural right after "1 " in the hint', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateWeightCapacityConversionQuestion();
      expect(q.hint).not.toMatch(/\b1 (pounds|tons|gallons|quarts|pints|kilograms|liters)\b/);
    }
  });
});

describe('generateTimeConversionQuestion hint singularization', () => {
  it('never produces a bare plural right after "1 " in the hint', () => {
    for (let i = 0; i < 200; i += 1) {
      const q = generateTimeConversionQuestion();
      expect(q.hint).not.toMatch(/\b1 (hours|minutes|days|weeks|years)\b/);
    }
  });
});

describe('generateClockReadingQuestion swapped-hands distractor', () => {
  // Pick an option that swaps the hour and minute hands. The minute hand
  // pointing at clock-face position N (i.e. minutes = N * 5) should be read
  // as N hours when treated as the hour hand. The hour hand pointing at
  // position 12 (top of clock) corresponds to 0 minutes, not 60.
  function expectedSwappedTime(hours, minutes) {
    const swappedMinutes = (hours % 12) * 5;
    const raw = Math.floor(minutes / 5);
    const swappedHours = raw === 0 ? 12 : raw;
    return `${swappedHours}:${swappedMinutes.toString().padStart(2, '0')}`;
  }

  it('does not produce the off-by-one "7:15" distractor for 3:30', () => {
    // Force time to 3:30 via difficulty = 0 (easy times list contains [3, 30]).
    expect(expectedSwappedTime(3, 30)).toBe('6:15');

    const optionsFor330 = [];
    for (let i = 0; i < 1000 && optionsFor330.length < 30; i += 1) {
      const q = generateClockReadingQuestion(0);
      if (q.correctAnswer === '3:30') {
        optionsFor330.push(q.options);
      }
    }
    expect(optionsFor330.length).toBeGreaterThan(0);
    // The old code produced "7:15". With the fix, "7:15" should never appear.
    const allOptions = optionsFor330.flat();
    expect(allOptions).not.toContain('7:15');
    // And at least one of those questions should include the corrected swap.
    expect(allOptions).toContain('6:15');
  });

  it('treats minutes=0 (minute hand at 12) as a swapped hour of 12, not 1', () => {
    const onHourSamples = [];
    for (let i = 0; i < 1000 && onHourSamples.length < 40; i += 1) {
      const q = generateClockReadingQuestion(0);
      const match = q.correctAnswer.match(/^(\d{1,2}):00$/);
      if (!match) continue;
      const hour = Number(match[1]);
      // Skip hour=1: the buggy "1:HH" form would collide with the legitimate
      // "off by 5 minutes" distractor ("1:05") for 1:00, making a false positive.
      if (hour === 1) continue;
      onHourSamples.push({ hour, options: q.options });
    }
    expect(onHourSamples.length).toBeGreaterThan(0);
    // The buggy "1:HH" form should not appear as an option for any
    // on-the-hour time (the new code maps "0" to "12").
    const buggyOptionsFound = onHourSamples
      .map(({ hour, options }) => {
        const wrongOldSwap = `1:${(hour * 5).toString().padStart(2, '0')}`;
        return options.includes(wrongOldSwap) ? `${hour}:00 produced ${wrongOldSwap}` : null;
      })
      .filter(Boolean);
    expect(buggyOptionsFound).toEqual([]);
    // The new swap form ("12:HH") should appear for at least one on-the-hour
    // time across the sampled questions. The clock-face position N for the
    // hour hand is (hour % 12), so for hour=12 that's 0 minutes, not 60.
    const newSwapFound = onHourSamples.some(({ hour, options }) => (
      options.includes(`12:${((hour % 12) * 5).toString().padStart(2, '0')}`)
    ));
    expect(newSwapFound).toBe(true);
  });

  it('never produces a distractor with minutes >= 60', () => {
    // Across all difficulties and many samples, no distractor should ever
    // display an invalid time like "12:60" or "1:60" — that's a sign the
    // hour-hand position is being mapped to minutes without modding by 12.
    const difficulties = [0, 0.3, 0.5, 0.7, 1];
    for (const difficulty of difficulties) {
      for (let i = 0; i < 500; i += 1) {
        const q = generateClockReadingQuestion(difficulty);
        for (const option of q.options) {
          const m = option.match(/^\d{1,2}:(\d{2})$/);
          expect(m).not.toBeNull();
          const mins = Number(m[1]);
          expect(mins).toBeLessThan(60);
        }
      }
    }
  });
});

describe('generateAreaPerimeterQuestion: avoids l*w === 2*(l+w) collision', () => {
  // When length × width === 2 × (length + width) (e.g., 4×4 area=perim=16,
  // 6×3 area=perim=18), the "swap-the-formula" distractor collapses into the
  // correct answer and the option count drops below 4 after dedupe.
  it('always has the correct answer present exactly once and at least 3 unique options', () => {
    for (let i = 0; i < 500; i += 1) {
      const q = generateAreaPerimeterQuestion(0.5);
      expect(q.options).toContain(q.correctAnswer);
      const correctOccurrences = q.options.filter((o) => o === q.correctAnswer).length;
      expect(correctOccurrences).toBe(1);
      // Options must be unique.
      expect(new Set(q.options).size).toBe(q.options.length);
      // Verify the rectangle dimensions don't fall into the degenerate case.
      const dimsMatch = q.question.match(/length of (\d+) units and a width of (\d+) units/);
      expect(dimsMatch).not.toBeNull();
      const [, lengthStr, widthStr] = dimsMatch;
      const l = Number(lengthStr);
      const w = Number(widthStr);
      expect(l * w).not.toBe(2 * (l + w));
    }
  });
});

