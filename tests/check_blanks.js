
const { parseBlanks, splitQuestionByBlanks } = require('../src/utils/answer-helpers');

const questionText = "Calculate in the right order. 3 × (4 + 6) = _____ 100 – 4 × 4 = _____ 3 × 3 + 8 ÷ 4 = _____ (7 – 3) × 3 + 2 = _____ 20 × 3 + 80 ÷ 1 = _____ 15 + 2 × (8 – 6) = _____";

console.log("Original Question:", questionText);

const blanks = parseBlanks(questionText);
console.log("Blanks found:", blanks.length);
console.log("Blanks:", JSON.stringify(blanks, null, 2));

const segments = splitQuestionByBlanks(questionText, blanks);
console.log("Segments:", JSON.stringify(segments, null, 2));

// Check if underscores are actually underscores
const underscoreCode = '_'.charCodeAt(0);
console.log("Underscore char code:", underscoreCode);

const parts = questionText.split(' ');
parts.forEach(p => {
    if (p.includes('_')) {
        console.log(`Part '${p}' contains underscore?`);
        for (let i = 0; i < p.length; i++) {
             console.log(`Char at ${i}: ${p[i]} (${p.charCodeAt(i)})`);
        }
    }
});
