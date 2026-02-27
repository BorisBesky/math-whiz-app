/**
 * Unit tests for difficulty scaling across all Grade 4 question modules
 * Validates that difficulty parameter properly affects question generation
 */

import {
  generateQuestion as generateBaseTen,
  generatePlaceValueTableQuestion,
  generateDecimalPlaceIdentificationQuestion,
  generateDecimalDigitValueQuestion,
  generateDecimalPlaceRelationshipQuestion,
} from '../questions';
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
      expect(questionTexts.some(q => q.includes('Fill in the place value chart'))).toBe(true);
    });

    test('Base Ten: decimal place value questions have correct metadata', () => {
      const question = generateBaseTen(0.5, ['decimal place value']);
      expect(question.subtopic).toBe('decimal place value');
      expect(question.concept).toBe('Base Ten');
      expect(question.grade).toBe('G4');
      expect(['multiple-choice', 'fill-in-the-blanks']).toContain(question.questionType);
      expect(question.difficultyRange).toBeDefined();
      expect(question.suggestedDifficulty).toBe(0.5);
      if (question.questionType === 'multiple-choice') {
        expect(question.options.length).toBe(4);
        expect(question.options).toContain(question.correctAnswer);
      }
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

    test('Base Ten: generated decimal numbers use globally unique digits', () => {
      for (let i = 0; i < 100; i++) {
        const question = generateDecimalPlaceIdentificationQuestion(Math.random());
        const match = question.question.match(/\d+\.\d+/);

        expect(match).toBeTruthy();

        const digits = match[0].replace('.', '').split('');
        const uniqueDigits = new Set(digits);

        expect(uniqueDigits.size).toBe(digits.length);
      }
    });

    test('Base Ten: decimal digit value has unique options with minimum of 2', () => {
      for (let i = 0; i < 100; i++) {
        const question = generateDecimalDigitValueQuestion(Math.random());
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options).toContain(question.correctAnswer);
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    });

    test('Base Ten: decimal place relationship has unique options with minimum of 2', () => {
      for (let i = 0; i < 100; i++) {
        const question = generateDecimalPlaceRelationshipQuestion(Math.random());
        expect(question.options.length).toBeGreaterThanOrEqual(2);
        expect(question.options).toContain(question.correctAnswer);
        expect(new Set(question.options).size).toBe(question.options.length);
      }
    });
  });

  describe('Place value table question', () => {
    test('generates valid fill-in-the-blanks question with tableData', () => {
      const question = generatePlaceValueTableQuestion(0.5);
      expect(question).toBeDefined();
      expect(question.questionType).toBe('fill-in-the-blanks');
      expect(question.tableData).toBeDefined();
      expect(question.tableData.columns).toBeDefined();
      expect(question.tableData.numberStr).toBeDefined();
      expect(question.subtopic).toBe('decimal place value');
      expect(question.concept).toBe('Base Ten');
      expect(question.grade).toBe('G4');
    });

    test('blank count matches correctAnswer count', () => {
      for (let i = 0; i < 20; i++) {
        const difficulty = Math.random();
        const question = generatePlaceValueTableQuestion(difficulty);
        const answers = question.correctAnswer.split(';;');
        const blanks = (question.question.match(/_{2,}/g) || []);
        expect(blanks.length).toBe(answers.length);
      }
    });

    test('inputTypes length matches blank count', () => {
      const question = generatePlaceValueTableQuestion(0.5);
      const answers = question.correctAnswer.split(';;');
      expect(question.inputTypes.length).toBe(answers.length);
    });

    test('headers come before values in correctAnswer', () => {
      const question = generatePlaceValueTableQuestion(0.7);
      const answers = question.correctAnswer.split(';;').map(a => a.trim());
      const blankColumns = question.tableData.columns.filter(c => !c.isDecimalPoint);
      const headerCount = blankColumns.length;

      // First half should be place names
      const headers = answers.slice(0, headerCount);
      const placeNames = ['ones', 'tens', 'hundreds', 'thousands', 'tenths', 'hundredths', 'thousandths'];
      headers.forEach(h => {
        expect(placeNames).toContain(h);
      });

      // Second half should be place values
      const values = answers.slice(headerCount);
      const validValues = ['1', '10', '100', '1000', '1/10', '1/100', '1/1000'];
      values.forEach(v => {
        expect(validValues).toContain(v);
      });
    });

    test('low difficulty produces fewer columns', () => {
      const easyQuestions = Array(20).fill(0).map(() => generatePlaceValueTableQuestion(0.2));
      const hardQuestions = Array(20).fill(0).map(() => generatePlaceValueTableQuestion(0.9));

      const avgEasyColumns = easyQuestions.reduce((sum, q) => {
        return sum + q.tableData.columns.filter(c => !c.isDecimalPoint).length;
      }, 0) / easyQuestions.length;

      const avgHardColumns = hardQuestions.reduce((sum, q) => {
        return sum + q.tableData.columns.filter(c => !c.isDecimalPoint).length;
      }, 0) / hardQuestions.length;

      expect(avgHardColumns).toBeGreaterThan(avgEasyColumns);
    });

    test('tableData columns have required properties', () => {
      const question = generatePlaceValueTableQuestion(0.5);
      question.tableData.columns.forEach(col => {
        expect(col).toHaveProperty('digit');
        expect(col).toHaveProperty('isDecimalPoint');
        if (!col.isDecimalPoint) {
          expect(col).toHaveProperty('header');
          expect(col).toHaveProperty('value');
          expect(col).toHaveProperty('isDecimal');
        }
      });
    });

    test('exactly one decimal point column exists', () => {
      const question = generatePlaceValueTableQuestion(0.5);
      const dpCols = question.tableData.columns.filter(c => c.isDecimalPoint);
      expect(dpCols.length).toBe(1);
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

