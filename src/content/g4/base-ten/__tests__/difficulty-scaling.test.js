/**
 * Unit tests for difficulty scaling across all Grade 4 question modules
 * Validates that difficulty parameter properly affects question generation
 */

import { generateQuestion as generateBaseTen } from '../questions';
import { generateQuestion as generateFractions } from '../../fractions/questions';
import { generateQuestion as generateGeometry } from '../../geometry/questions';
import { generateQuestion as generateOperations } from '../../operations-algebraic-thinking/questions';
import { generateQuestion as generateMeasurement } from '../../measurement-data/questions';
import { generateQuestion as generateBinary } from '../../binary-operations/questions';

// Grade 3 modules (should still work with difficulty)
import { generateQuestion as generateMultiplication } from '../../../g3/multiplication/questions';
import { generateQuestion as generateDivision } from '../../../g3/division/questions';
import { generateQuestion as generateG3Fractions } from '../../../g3/fractions/questions';
import { generateQuestion as generateG3Measurement } from '../../../g3/measurement-data/questions';

describe('Grade 4 Difficulty Scaling', () => {
  describe('All G4 modules accept difficulty parameter', () => {
    test('Base Ten accepts difficulty parameter', () => {
      const question = generateBaseTen(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });

    test('Fractions accepts difficulty parameter', () => {
      const question = generateFractions(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });

    test('Geometry accepts difficulty parameter', () => {
      const question = generateGeometry(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });

    test('Operations & Algebraic Thinking accepts difficulty parameter', () => {
      const question = generateOperations(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });

    test('Measurement & Data accepts difficulty parameter', () => {
      const question = generateMeasurement(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });

    test('Binary Operations accepts difficulty parameter', () => {
      const question = generateBinary(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });
  });

  describe('Difficulty affects question type selection', () => {
    test('Base Ten: Easy difficulty selects from basic question types', () => {
      const questions = Array(20).fill(0).map(() => generateBaseTen(0.1));
      const subtopics = questions.map(q => q.subtopic);
      
      // At low difficulty, should see place value, comparison, or decimal place value
      expect(subtopics.some(s => s === 'place value' || s === 'comparison' || s === 'decimal place value')).toBe(true);
      
      // Should NOT see multi-step word problems at very low difficulty
      const hasMultiStep = subtopics.some(s => s === 'multi-step word problems');
      expect(hasMultiStep).toBe(false);
    });

    test('Base Ten: Hard difficulty selects from advanced question types', () => {
      const questions = Array(20).fill(0).map(() => generateBaseTen(0.9));
      const subtopics = questions.map(q => q.subtopic);
      
      // At high difficulty, multi-step problems should be available
      const hasAdvanced = subtopics.some(s => 
        s === 'multi-step word problems' || 
        s === 'rounding' ||
        s === 'subtraction word problems'
      );
      expect(hasAdvanced).toBe(true);
    });

    test('Fractions: Easy difficulty avoids decimal notation', () => {
      const questions = Array(15).fill(0).map(() => generateFractions(0.2));
      const subtopics = questions.map(q => q.subtopic);
      
      // At low difficulty, should NOT see decimal notation
      const hasDecimal = subtopics.some(s => s === 'decimal notation');
      expect(hasDecimal).toBe(false);
    });

    test('Fractions: Hard difficulty includes decimal notation', () => {
      // Sample more times to reduce flakiness
      const questions = Array(200).fill(0).map(() => generateFractions(0.9));
      const subtopics = questions.map(q => q.subtopic);
      
      // At high difficulty, decimal notation should be available
      const hasDecimal = subtopics.some(s => s === 'decimal notation');
      expect(hasDecimal).toBe(true);
    });

    test('Geometry: Easy difficulty selects basic topics', () => {
      const questions = Array(20).fill(0).map(() => generateGeometry(0.1));
      const subtopics = questions.map(q => q.subtopic);
      
      // At low difficulty, should see basic topics like lines and angles
      expect(subtopics.some(s => s === 'lines and angles' || s === 'points lines rays')).toBe(true);
      
      // Should NOT see angle measurement at very low difficulty
      const hasAngleMeasurement = subtopics.some(s => s === 'angle measurement');
      expect(hasAngleMeasurement).toBe(false);
    });
  });

  describe('Decimal place value difficulty scaling', () => {
    test('Base Ten: decimal place value is available at low difficulty', () => {
      const questions = Array(30).fill(0).map(() => generateBaseTen(0.1, ['decimal place value']));
      questions.forEach(q => {
        expect(q).toBeDefined();
        expect(q.subtopic).toBe('decimal place value');
      });
    });

    test('Base Ten: decimal place value generates all question types at high difficulty', () => {
      const questions = Array(200).fill(0).map(() => generateBaseTen(0.9, ['decimal place value']));
      const questionTexts = questions.map(q => q.question);

      expect(questionTexts.some(q => q.includes('what digit is in the'))).toBe(true);
      expect(questionTexts.some(q => q.includes('what is the value of'))).toBe(true);
      expect(questionTexts.some(q => q.includes('expanded form'))).toBe(true);
      expect(questionTexts.some(q => q.includes('times greater'))).toBe(true);
    });

    test('Base Ten: decimal place value questions have correct metadata', () => {
      const question = generateBaseTen(0.5, ['decimal place value']);
      expect(question.subtopic).toBe('decimal place value');
      expect(question.concept).toBe('Base Ten');
      expect(question.grade).toBe('G4');
      expect(question.questionType).toBe('multiple-choice');
      expect(question.difficultyRange).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
      expect(question.options.length).toBe(4);
      expect(question.options).toContain(question.correctAnswer);
    });

    test('Base Ten: decimal place value at low difficulty uses simpler numbers', () => {
      const questions = Array(20).fill(0).map(() => generateBaseTen(0.1, ['decimal place value']));
      questions.forEach(q => {
        const match = q.question.match(/\d+\.\d+/);
        if (match) {
          const decimalPart = match[0].split('.')[1];
          expect(decimalPart.length).toBe(1);
        }
      });
    });

    test('Base Ten: decimal place value at high difficulty uses thousandths', () => {
      const questions = Array(30).fill(0).map(() => generateBaseTen(0.9, ['decimal place value']));
      const hasThousandths = questions.some(q => {
        const match = q.question.match(/\d+\.\d+/);
        return match && match[0].split('.')[1].length === 3;
      });
      expect(hasThousandths).toBe(true);
    });
  });

  describe('Difficulty parameter defaults to 0.5', () => {
    test('Base Ten defaults to 0.5 when no parameter provided', () => {
      const question = generateBaseTen();
      expect(question).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });

    test('Fractions defaults to 0.5 when no parameter provided', () => {
      const question = generateFractions();
      expect(question).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });

    test('Geometry defaults to 0.5 when no parameter provided', () => {
      const question = generateGeometry();
      expect(question).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
    });
  });

  describe('Difficulty range metadata is present', () => {
    test('Base Ten questions include difficultyRange metadata', () => {
      const question = generateBaseTen(0.5);
      expect(question.difficultyRange).toBeDefined();
      expect(question.difficultyRange.min).toBeGreaterThanOrEqual(0);
      expect(question.difficultyRange.max).toBeLessThanOrEqual(1);
    });

    test('Fractions questions include difficultyRange metadata', () => {
      const question = generateFractions(0.5);
      expect(question.difficultyRange).toBeDefined();
      expect(question.difficultyRange.min).toBeGreaterThanOrEqual(0);
      expect(question.difficultyRange.max).toBeLessThanOrEqual(1);
    });

    test('Geometry questions include difficultyRange metadata', () => {
      const question = generateGeometry(0.5);
      expect(question.difficultyRange).toBeDefined();
      expect(question.difficultyRange.min).toBeGreaterThanOrEqual(0);
      expect(question.difficultyRange.max).toBeLessThanOrEqual(1);
    });
  });

  describe('Grade 3 modules still work correctly', () => {
    test('Multiplication accepts difficulty parameter', () => {
      const question = generateMultiplication(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });

    test('Division accepts difficulty parameter', () => {
      const question = generateDivision(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });

    test('G3 Fractions accepts difficulty parameter', () => {
      const question = generateG3Fractions(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });

    test('G3 Measurement & Data accepts difficulty parameter', () => {
      const question = generateG3Measurement(0.5);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });
  });

  describe('Difficulty affects output distribution', () => {
    test('Easy questions generally produce simpler values', () => {
      // Generate many easy Base Ten questions
      const easyQuestions = Array(50).fill(0).map(() => generateBaseTen(0.1));
      const hardQuestions = Array(50).fill(0).map(() => generateBaseTen(0.9));
      
      // Count questions with specific characteristics
      const easyBasicCount = easyQuestions.filter(q => 
        q.subtopic === 'place value' || q.subtopic === 'comparison'
      ).length;
      
      const hardComplexCount = hardQuestions.filter(q => 
        q.subtopic === 'multi-step word problems' || q.subtopic === 'rounding'
      ).length;
      
      // Easy questions should have more basic types
      expect(easyBasicCount).toBeGreaterThan(0);
      
      // Hard questions should have more complex types
      expect(hardComplexCount).toBeGreaterThan(0);
    });

    test('Operations: Long division with remainder appears only at high difficulty', () => {
      // At low difficulty, should not see division with remainder
      const easyQuestions = Array(40).fill(0).map(() => generateOperations(0.3));
      const easySubtopics = easyQuestions.map(q => q.subtopic);
      const hasRemainder = easySubtopics.some(s => s === 'long division with remainder');
      expect(hasRemainder).toBe(false);
      
      // At high difficulty, division with remainder should be available
      // Generate more samples to ensure we see it statistically
      const hardQuestions = Array(60).fill(0).map(() => generateOperations(0.9));
      const hardSubtopics = hardQuestions.map(q => q.subtopic);
      const hasRemainderHard = hardSubtopics.some(s => s === 'long division with remainder');
      expect(hasRemainderHard).toBe(true);
    });
  });

  describe('Edge cases', () => {
    test('Difficulty = 0 produces valid questions', () => {
      const question = generateBaseTen(0);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });

    test('Difficulty = 1 produces valid questions', () => {
      const question = generateBaseTen(1);
      expect(question).toBeDefined();
      expect(question.question).toBeDefined();
      expect(question.correctAnswer).toBeDefined();
    });

    test('All G4 modules handle difficulty = 0', () => {
      expect(() => generateBaseTen(0)).not.toThrow();
      expect(() => generateFractions(0)).not.toThrow();
      expect(() => generateGeometry(0)).not.toThrow();
      expect(() => generateOperations(0)).not.toThrow();
      expect(() => generateMeasurement(0)).not.toThrow();
      expect(() => generateBinary(0)).not.toThrow();
    });

    test('All G4 modules handle difficulty = 1', () => {
      expect(() => generateBaseTen(1)).not.toThrow();
      expect(() => generateFractions(1)).not.toThrow();
      expect(() => generateGeometry(1)).not.toThrow();
      expect(() => generateOperations(1)).not.toThrow();
      expect(() => generateMeasurement(1)).not.toThrow();
      expect(() => generateBinary(1)).not.toThrow();
    });
  });
});

