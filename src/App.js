/* global __firebase_config, __app_id, __initial_auth_token */
import React, { useState, useEffect, useRef } from 'react';
import { ChevronsRight, HelpCircle, Sparkles, X, BarChart2, Award, Coins, Pause, Play, Store, CheckCircle, Home } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, updateDoc, increment, arrayUnion } from 'firebase/firestore';

// --- Firebase Configuration ---
// Using individual environment variables for better security
let firebaseConfig = {};

if (typeof __firebase_config !== 'undefined') {
  console.log('Using __firebase_config');
  firebaseConfig = JSON.parse(__firebase_config);
} else {
  // Use individual environment variables (these are safe to expose)
  firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID
  };
  
  // Check if we have the minimum required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration incomplete. Some features may not work.');
  }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Pre-generated Concept Explanations ---
const conceptExplanations = {
  "Multiplication": `
    <h4 class="font-bold text-lg mb-2">What is Multiplication?</h4>
    <p class="mb-4">Think of multiplication as a super-fast way of adding! It's for when you have groups of the same number.</p>
    <p class="mb-2"><strong>Example: The Cookie Plate</strong></p>
    <p class="mb-2">Imagine you have 4 plates, and each plate has 3 cookies.</p>
    <div class="text-2xl mb-2">🍪🍪🍪 &nbsp; 🍪🍪🍪 &nbsp; 🍪🍪🍪 &nbsp; 🍪🍪🍪</div>
    <p class="mb-2">You could add them up: <code class="bg-gray-200 p-1 rounded">3 + 3 + 3 + 3 = 12</code></p>
    <p class="mb-4">But the faster way is to multiply! We say we have "4 groups of 3".</p>
    <p class="mb-2">We write this as: <code class="bg-blue-100 text-blue-800 font-bold p-1 rounded">4 x 3 = 12</code></p>
    <p>The 'x' symbol means "times" or "groups of". So, 4 times 3 is 12. It's the same answer, just much quicker!</p>
  `,
  "Division": `
    <h4 class="font-bold text-lg mb-2">What is Division?</h4>
    <p class="mb-4">Division is all about sharing equally or splitting something into equal groups.</p>
    <p class="mb-2"><strong>Example: Sharing Stickers</strong></p>
    <p class="mb-2">Let's say you have 12 stickers and you want to share them equally among 3 friends.</p>
    <div class="text-2xl mb-2">⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐ ⭐</div>
    <p class="mb-2">How many stickers does each friend get? You are dividing 12 into 3 groups.</p>
    <p class="mb-4">We write this as: <code class="bg-blue-100 text-blue-800 font-bold p-1 rounded">12 ÷ 3 = 4</code></p>
    <p class="mb-2">The '÷' symbol means "divide". So, 12 divided by 3 is 4. Each friend gets 4 stickers!</p>
    <p><strong>Hint:</strong> Division is the opposite of multiplication! If you know <code class="bg-gray-200 p-1 rounded">3 x 4 = 12</code>, then you also know <code class="bg-gray-200 p-1 rounded">12 ÷ 3 = 4</code>.</p>
  `,
  "Fractions": `
    <h4 class="font-bold text-lg mb-2">What are Fractions?</h4>
    <p class="mb-4">A fraction is a part of a whole thing. Think of a pizza!</p>
    <p class="mb-2"><strong>Example: The Pizza Slice</strong></p>
    <p class="mb-2">A whole pizza is one whole thing. If you cut it into 4 equal slices, each slice is a fraction of the whole pizza.</p>
    <div class="text-2xl mb-2">🍕</div>
    <p class="mb-2">A fraction has two parts:</p>
    <ul>
        <li class="mb-2">The <strong>Numerator</strong> (top number) tells you how many slices you have.</li>
        <li class="mb-2">The <strong>Denominator</strong> (bottom number) tells you how many equal slices the whole pizza was cut into.</li>
    </ul>
    <p class="mt-4">So, if you have 1 slice of a pizza cut into 4, you have <code class="bg-blue-100 text-blue-800 font-bold p-1 rounded">1/4</code> of the pizza!</p>
  `,
  "Area": `
    <h4 class="font-bold text-lg mb-2">What is Area?</h4>
    <p class="mb-4">Area is the amount of space inside a flat, 2D shape. It's like counting the squares on a chocolate bar!</p>
    <p class="mb-2"><strong>Example: A Chocolate Bar</strong></p>
    <p class="mb-2">Imagine a chocolate bar that is 4 squares long and 3 squares wide.</p>
    <pre class="bg-gray-100 p-2 rounded text-center mb-2 font-mono">
[ ] [ ] [ ] [ ]
[ ] [ ] [ ] [ ]
[ ] [ ] [ ] [ ]
    </pre>
    <p class="mb-2">To find the area, you can count all the squares (there are 12), or you can use multiplication!</p>
    <p class="mb-4">The formula is: <code class="bg-gray-200 p-1 rounded">Area = Length x Width</code></p>
    <p>So, for our chocolate bar: <code class="bg-blue-100 text-blue-800 font-bold p-1 rounded">4 x 3 = 12</code> square units.</p>
  `,
  "Perimeter": `
    <h4 class="font-bold text-lg mb-2">What is Perimeter?</h4>
    <p class="mb-4">Perimeter is the total distance all the way around the outside of a shape. It's like walking around a fence that encloses a park.</p>
    <p class="mb-2"><strong>Example: A Rectangular Park</strong></p>
    <p class="mb-2">Imagine a park that is 5 meters long and 3 meters wide.</p>
    <pre class="bg-gray-100 p-2 rounded text-center mb-2 font-mono">
      5 meters
+-----------------+
|                 | 3 meters
+-----------------+
    </pre>
    <p class="mb-2">To find the perimeter, you add up the lengths of all four sides:</p>
    <p class="mb-4"><code class="bg-blue-100 text-blue-800 font-bold p-1 rounded">5 + 3 + 5 + 3 = 16</code> meters.</p>
    <p>You have to walk 16 meters to go all the way around the park's fence!</p>
  `,
  "Volume": `
    <h4 class="font-bold text-lg mb-2">What is Volume?</h4>
    <p class="mb-4">Volume is the amount of space a 3D object takes up. Think about how many Lego blocks it takes to build a box.</p>
    <p class="mb-2"><strong>Example: Building with Blocks</strong></p>
    <p class="mb-2">Imagine you build a small box with Lego blocks. It's 3 blocks long, 2 blocks wide, and 2 blocks high.</p>
    <pre class="bg-gray-100 p-2 rounded text-center mb-2 font-mono">
   /---/---/---/|
  /---/---/---/|/|
 /---/---/---/|/|/|
+-----------+ |/|
|           |/|/
|           |/
+-----------+
    </pre>
    <p class="mb-2">To find the volume, you multiply all three measurements:</p>
    <p class="mb-4"><code class="bg-gray-200 p-1 rounded">Volume = Length x Width x Height</code></p>
    <p>So, for our box: <code class="bg-blue-100 text-blue-800 font-bold p-1 rounded">3 x 2 x 2 = 12</code> blocks.</p>
    <p>The volume of the box is 12 blocks!</p>
  `
};


// --- Helper Functions ---
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0]; // YYYY-MM-DD format
};

const getUserDocRef = (userId) => {
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    if (!userId) return null;
    // Using the required path structure for user-specific data
    return doc(db, 'artifacts', appId, 'users', userId, 'math_whiz_data', 'profile');
};


// --- Helper Functions for Randomization ---
const getRandomInt = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const shuffleArray = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

// --- Helper function to find the greatest common divisor ---
const gcd = (a, b) => {
  if (b === 0) {
    return a;
  }
  return gcd(b, a % b);
};

// --- Helper function to simplify a fraction ---
const getSimplifiedFraction = (numerator, denominator) => {
  if (numerator === 0) return "0";
  const commonDivisor = gcd(numerator, denominator);
  const simplifiedNumerator = numerator / commonDivisor;
  const simplifiedDenominator = denominator / commonDivisor;
  if (simplifiedDenominator === 1) {
    return simplifiedNumerator.toString(); // It's a whole number
  }
  return `${simplifiedNumerator}/${simplifiedDenominator}`;
};

// --- Store Items ---
const storeItems = [
    { id: 'bg1', name: 'Silly Giraffe', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/A_funny_cute_plastic_toy_gira-3.jpg' },
    { id: 'bg2', name: 'Cool Lion', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/A_cool_felt-stitched_toy_lion_w-1.jpg' },
    { id: 'bg3', name: 'Playful Monkey', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/A_playful_claymation-style_toy-0.jpg' },
    { id: 'bg4', name: 'Happy Hippo', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/Happy_Hippo_A_cheerful_round_h-0.jpg' },
    { id: 'bg5', name: 'Zebra Stripes', url: 'https://placehold.co/600x400/E5E7E9/34495E?text=Zebra+Stripes' },
    { id: 'bg6', name: 'Funky Frog', url: 'https://placehold.co/600x400/A9DFBF/34495E?text=Funky+Frog' },
    { id: 'bg7', name: 'Dapper Dog', url: 'https://placehold.co/600x400/F5CBA7/34495E?text=Dapper+Dog' },
    { id: 'bg8', name: 'Cuddly Cat', url: 'https://placehold.co/600x400/D7BDE2/34495E?text=Cuddly+Cat' },
    { id: 'bg9', name: 'Penguin Party', url: 'https://placehold.co/600x400/A3E4D7/34495E?text=Penguin+Party' },
    { id: 'bg10', name: 'Bear Hugs', url: 'https://placehold.co/600x400/E6B0AA/34495E?text=Bear+Hugs' },
    { id: 'bg11', name: 'Wacky Walrus', url: 'https://placehold.co/600x400/A9CCE3/34495E?text=Wacky+Walrus' },
    { id: 'bg12', name: 'Jumping Kangaroo', url: 'https://placehold.co/600x400/FAD7A0/34495E?text=Jumping+Kangaroo' },
    { id: 'bg13', name: 'Sleepy Sloth', url: 'https://placehold.co/600x400/D5DBDB/34495E?text=Sleepy+Sloth' },
    { id: 'bg14', name: 'Clever Fox', url: 'https://placehold.co/600x400/E59866/34495E?text=Clever+Fox' },
    { id: 'bg15', name: 'Wise Owl', url: 'https://placehold.co/600x400/C39BD3/34495E?text=Wise+Owl' },
    { id: 'bg16', name: 'Busy Beaver', url: 'https://placehold.co/600x400/BA4A00/FFFFFF?text=Busy+Beaver' },
    { id: 'bg17', name: 'Panda Peace', url: 'https://placehold.co/600x400/F2F3F4/34495E?text=Panda+Peace' },
    { id: 'bg18', name: 'Koala Cuddles', url: 'https://placehold.co/600x400/D6DBDF/34495E?text=Koala+Cuddles' },
    { id: 'bg19', name: 'Raccoon Rascal', url: 'https://placehold.co/600x400/839192/FFFFFF?text=Raccoon+Rascal' },
    { id: 'bg20', name: 'Elephant Smiles', url: 'https://placehold.co/600x400/B2BABB/34495E?text=Elephant+Smiles' },
];


// --- Dynamic Quiz Generation ---
const generateQuizQuestions = (topic, dailyGoal = 8) => {
  const questions = [];
  const numQuestions = Math.max(1, Math.floor(dailyGoal / 4));
  for (let i = 0; i < numQuestions; i++) {
    let question = {};
    switch (topic) {
      case 'Multiplication':
        const m1 = getRandomInt(2, 12);
        const m2 = getRandomInt(2, 9);
        const mAnswer = m1 * m2;
        question = { question: `What is ${m1} x ${m2}?`, correctAnswer: mAnswer.toString(), options: shuffleArray([mAnswer.toString(), (mAnswer + getRandomInt(1, 5)).toString(), (m1 * (m2 + 1)).toString(), ((m1 - 1) * m2).toString()]), hint: `Try skip-counting by ${m2}, ${m1} times!`, standard: "3.OA.C.7", concept: "Multiplication" };
        break;
      case 'Division':
        const d_quotient = getRandomInt(2, 9);
        const d_divisor = getRandomInt(2, 9);
        const d_dividend = d_quotient * d_divisor;
        question = { question: `What is ${d_dividend} ÷ ${d_divisor}?`, correctAnswer: d_quotient.toString(), options: shuffleArray([d_quotient.toString(), (d_quotient + 1).toString(), (d_quotient - 1).toString(), (d_quotient + getRandomInt(2, 4)).toString()]), hint: `Think: ${d_divisor} multiplied by what number gives you ${d_dividend}?`, standard: "3.OA.C.7", concept: "Division" };
        break;
      case 'Fractions':
        const fractionQuestionType = getRandomInt(1, 4);
        switch (fractionQuestionType) {
            case 1: // Equivalent Fractions
                const f_num_eq = getRandomInt(1, 8);
                const f_den_eq = getRandomInt(f_num_eq + 1, 9);
                const multiplier = getRandomInt(2, 4);
                const eq_num = f_num_eq * multiplier;
                const eq_den = f_den_eq * multiplier;
                question = {
                    question: `Which fraction is equivalent to ${f_num_eq}/${f_den_eq}?`,
                    correctAnswer: `${eq_num}/${eq_den}`,
                    options: shuffleArray([`${eq_num}/${eq_den}`, `${f_num_eq + 1}/${f_den_eq}`, `${f_num_eq}/${f_den_eq + 1}`, `${eq_num}/${eq_den + multiplier}`]),
                    hint: "Equivalent fractions have the same value. Multiply the top and bottom by the same number.",
                    standard: "3.NF.A.3.b",
                    concept: "Fractions"
                };
                break;
            case 2: // Fraction Addition with unlike denominators
                const add_den1 = getRandomInt(2, 5);
                let add_den2 = getRandomInt(2, 6);
                while(add_den1 === add_den2) { add_den2 = getRandomInt(2, 6); }
                const add_num1 = getRandomInt(1, add_den1 -1 > 0 ? add_den1 - 1 : 1);
                const add_num2 = getRandomInt(1, add_den2 -1 > 0 ? add_den2 - 1 : 1);
                const common_add_den = add_den1 * add_den2;
                const add_sum_num = (add_num1 * add_den2) + (add_num2 * add_den1);
                const add_answer = getSimplifiedFraction(add_sum_num, common_add_den);
                question = {
                    question: `What is ${add_num1}/${add_den1} + ${add_num2}/${add_den2}?`,
                    correctAnswer: add_answer,
                    options: shuffleArray([
                        add_answer,
                        getSimplifiedFraction(add_num1 + add_num2, add_den1 + add_den2), // Common mistake
                        getSimplifiedFraction(add_sum_num + 1, common_add_den),
                        getSimplifiedFraction(add_sum_num, common_add_den + 1)
                    ]),
                    hint: "To add fractions with different denominators, you first need to find a common denominator!",
                    standard: "4.NF.B.3", // Note: This is a 4th grade standard
                    concept: "Fractions"
                };
                break;
            case 3: // Fraction Subtraction with unlike denominators
                let sub_den1 = getRandomInt(2, 6);
                let sub_den2 = getRandomInt(2, 6);
                let sub_num1 = getRandomInt(1, sub_den1 -1 > 0 ? sub_den1 - 1 : 1);
                let sub_num2 = getRandomInt(1, sub_den2 -1 > 0 ? sub_den2 - 1 : 1);

                // Ensure the first fraction is larger and denominators are different
                while((sub_num1 * sub_den2) <= (sub_num2 * sub_den1) || sub_den1 === sub_den2) {
                    sub_den1 = getRandomInt(2, 6);
                    sub_den2 = getRandomInt(2, 6);
                    sub_num1 = getRandomInt(1, sub_den1 -1 > 0 ? sub_den1 - 1 : 1);
                    sub_num2 = getRandomInt(1, sub_den2 -1 > 0 ? sub_den2 - 1 : 1);
                }
                
                const common_sub_den = sub_den1 * sub_den2;
                const sub_diff_num = (sub_num1 * sub_den2) - (sub_num2 * sub_den1);
                const sub_answer = getSimplifiedFraction(sub_diff_num, common_sub_den);
                question = {
                    question: `What is ${sub_num1}/${sub_den1} - ${sub_num2}/${sub_den2}?`,
                    correctAnswer: sub_answer,
                    options: shuffleArray([
                        sub_answer,
                        getSimplifiedFraction(Math.abs(sub_num1 - sub_num2), Math.abs(sub_den1 - sub_den2)), // Common mistake
                        getSimplifiedFraction(sub_diff_num + 1, common_sub_den),
                        getSimplifiedFraction(sub_diff_num, common_sub_den + 1)
                    ]),
                    hint: "Find a common denominator before subtracting the fractions. Make sure your answer is simplified!",
                    standard: "4.NF.B.3", // Note: This is a 4th grade standard
                    concept: "Fractions"
                };
                break;
            case 4: // Fraction Comparison
                const comp_type = getRandomInt(1, 2);
                if (comp_type === 1) { // Same denominator
                    const comp_den = getRandomInt(3, 12);
                    let comp_num1 = getRandomInt(1, comp_den - 1);
                    let comp_num2 = getRandomInt(1, comp_den - 1);
                    while (comp_num1 === comp_num2) { comp_num2 = getRandomInt(1, comp_den - 1); }
                    question = {
                        question: `Which symbol makes this true? ${comp_num1}/${comp_den} ___ ${comp_num2}/${comp_den}`,
                        correctAnswer: comp_num1 > comp_num2 ? '>' : '<',
                        options: shuffleArray(['<', '>', '=']),
                        hint: "If the bottom numbers are the same, the fraction with the bigger top number is greater.",
                        standard: "3.NF.A.3.d",
                        concept: "Fractions"
                    };
                } else { // Same numerator
                    const comp_num = getRandomInt(1, 10);
                    let comp_den1 = getRandomInt(comp_num + 1, 15);
                    let comp_den2 = getRandomInt(comp_num + 1, 15);
                    while (comp_den1 === comp_den2) { comp_den2 = getRandomInt(comp_num + 1, 15); }
                    question = {
                        question: `Which symbol makes this true? ${comp_num}/${comp_den1} ___ ${comp_num}/${comp_den2}`,
                        correctAnswer: comp_den1 < comp_den2 ? '>' : '<',
                        options: shuffleArray(['<', '>', '=']),
                        hint: "If the top numbers are the same, the fraction with the smaller bottom number is bigger (think of bigger pizza slices!).",
                        standard: "3.NF.A.3.d",
                        concept: "Fractions"
                    };
                }
                break;
            default:
                // Fallback to equivalent fractions if unexpected value
                const def_f_num_eq = getRandomInt(1, 8);
                const def_f_den_eq = getRandomInt(def_f_num_eq + 1, 9);
                const def_multiplier = getRandomInt(2, 4);
                const def_eq_num = def_f_num_eq * def_multiplier;
                const def_eq_den = def_f_den_eq * def_multiplier;
                question = {
                    question: `Which fraction is equivalent to ${def_f_num_eq}/${def_f_den_eq}?`,
                    correctAnswer: `${def_eq_num}/${def_eq_den}`,
                    options: shuffleArray([`${def_eq_num}/${def_eq_den}`, `${def_f_num_eq + 1}/${def_f_den_eq}`, `${def_f_num_eq}/${def_f_den_eq + 1}`, `${def_eq_num}/${def_eq_den + def_multiplier}`]),
                    hint: "Equivalent fractions have the same value. Multiply the top and bottom by the same number.",
                    standard: "3.NF.A.3.b",
                    concept: "Fractions"
                };
                break;
        }
        break;
      case 'Measurement & Data':
        const measurementQuestionType = getRandomInt(1, 3);
        switch (measurementQuestionType) {
            case 1: // Area
                const length = getRandomInt(3, 15);
                const width = getRandomInt(2, 10);
                const area = length * width;
                question = { 
                    question: `A rectangle has a length of ${length} cm and a width of ${width} cm. What is its area?`, 
                    correctAnswer: `${area} cm²`, 
                    options: shuffleArray([`${area} cm²`, `${(length + width) * 2} cm²`, `${length + width} cm²`, `${area + 10} cm²`]), 
                    hint: "Area of a rectangle is found by multiplying its length and width.", 
                    standard: "3.MD.C.7.b", 
                    concept: "Area" 
                };
                break;
            case 2: // Perimeter
                const side1 = getRandomInt(5, 20);
                const side2 = getRandomInt(5, 20);
                const perimeter = 2 * (side1 + side2);
                question = {
                    question: `What is the perimeter of a rectangle with sides of length ${side1} inches and ${side2} inches?`,
                    correctAnswer: `${perimeter} inches`,
                    options: shuffleArray([`${perimeter} inches`, `${side1 * side2} inches`, `${side1 + side2} inches`, `${perimeter + 10} inches`]),
                    hint: "Perimeter is the distance all the way around a shape. Add up all four sides!",
                    standard: "3.MD.D.8",
                    concept: "Perimeter"
                };
                break;
            case 3: // Volume by counting cubes
                const vol_l = getRandomInt(2, 4);
                const vol_w = getRandomInt(2, 4);
                const vol_h = getRandomInt(1, 3);
                const volume = vol_l * vol_w * vol_h;
                question = {
                    question: `A box is built with unit cubes. It is ${vol_l} cubes long, ${vol_w} cubes wide, and ${vol_h} cubes high. How many cubes were used to build it?`,
                    correctAnswer: `${volume} cubes`,
                    options: shuffleArray([`${volume} cubes`, `${vol_l + vol_w + vol_h} cubes`, `${volume + 5} cubes`, `${volume - 2} cubes`]),
                    hint: "Volume is the space inside an object. You can find it by multiplying length x width x height.",
                    standard: "3.MD.C.5",
                    concept: "Volume"
                };
                break;
            default:
                // Fallback to area question if unexpected value
                const def_length = getRandomInt(3, 15);
                const def_width = getRandomInt(2, 10);
                const def_area = def_length * def_width;
                question = { 
                    question: `A rectangle has a length of ${def_length} cm and a width of ${def_width} cm. What is its area?`, 
                    correctAnswer: `${def_area} cm²`, 
                    options: shuffleArray([`${def_area} cm²`, `${(def_length + def_width) * 2} cm²`, `${def_length + def_width} cm²`, `${def_area + 10} cm²`]), 
                    hint: "Area of a rectangle is found by multiplying its length and width.", 
                    standard: "3.MD.C.7.b", 
                    concept: "Area" 
                };
                break;
        }
        break;
      default:
        question = { question: 'No question generated', options: [], correctAnswer: '', concept: 'Math' };
    }
    questions.push(question);
  }
  return questions;
};

const quizTopics = ['Multiplication', 'Division', 'Fractions', 'Measurement & Data'];

const App = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [currentTopic, setCurrentTopic] = useState(null);
  const [currentQuiz, setCurrentQuiz] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [userAnswer, setUserAnswer] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState(null); // Changed to null, will hold an object {message, type}
  const [isAnswered, setIsAnswered] = useState(false);
  const [quizState, setQuizState] = useState('topicSelection'); // 'topicSelection', 'inProgress', 'results', 'dashboard', 'store'
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [topicToResume, setTopicToResume] = useState(null);
  const [purchaseFeedback, setPurchaseFeedback] = useState('');


  const questionStartTime = useRef(null);

  // --- Firebase Auth and Data Loading ---
  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeSnapshot(); // Clean up previous listener if user changes

      if (currentUser) {
        setUser(currentUser);
        const userDocRef = getUserDocRef(currentUser.uid);

        unsubscribeSnapshot = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const today = getTodayDateString();
            // If user logs in on a new day, create a progress entry for today
            if (!data.progress?.[today]) {
                const initialTodayProgress = { all: { correct: 0, incorrect: 0, timeSpent: 0 } };
                const updatedData = { ...data, progress: { ...data.progress, [today]: initialTodayProgress }};
                setUserData(updatedData);
                updateDoc(userDocRef, { [`progress.${today}`]: initialTodayProgress });
            } else {
                setUserData(data);
            }
          } else {
            const today = getTodayDateString();
            const initialData = {
              coins: 0,
              dailyGoal: 8,
              progress: { [today]: { all: { correct: 0, incorrect: 0, timeSpent: 0 } } },
              pausedQuizzes: {},
              ownedBackgrounds: ['default'],
              activeBackground: 'default'
            };
            setDoc(userDocRef, initialData).then(() => setUserData(initialData));
          }
        }, (error) => {
            console.error("Firestore snapshot error:", error);
        });
      } else {
        setUser(null);
        setUserData(null);
        try {
            if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Firebase sign-in error:", error);
        }
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeSnapshot();
    };
  }, []);

  // --- Quiz Logic ---
  const handleTopicSelection = (topic) => {
    if (userData?.pausedQuizzes?.[topic]) {
      setTopicToResume(topic);
      setShowResumeModal(true);
    } else {
      startNewQuiz(topic);
    }
  };
  
  const startNewQuiz = (topic) => {
    setCurrentTopic(topic);
    const newQuestions = generateQuizQuestions(topic, userData.dailyGoal);
    setCurrentQuiz(newQuestions);
    setQuizState('inProgress');
    questionStartTime.current = Date.now();
    resetQuiz();
    setShowResumeModal(false);
  };

  const resumePausedQuiz = () => {
    const pausedData = userData.pausedQuizzes[topicToResume];
    setCurrentTopic(topicToResume);
    setCurrentQuiz(pausedData.questions);
    setCurrentQuestionIndex(pausedData.index);
    setScore(pausedData.score);
    setQuizState('inProgress');
    questionStartTime.current = Date.now();
    setShowResumeModal(false);
  };

  const pauseQuiz = async () => {
    if (!user) return;
    const userDocRef = getUserDocRef(user.uid);
    const pausedQuizData = {
      questions: currentQuiz,
      index: currentQuestionIndex,
      score: score,
    };
    await updateDoc(userDocRef, {
      [`pausedQuizzes.${currentTopic}`]: pausedQuizData
    });
    setQuizState('topicSelection');
  };
  
  const handleAnswer = (option) => {
    if (isAnswered) return;
    setUserAnswer(option);
  };

  const checkAnswer = async () => {
    if (userAnswer === null || !user) return;
  
    setIsAnswered(true);
    const timeTaken = (Date.now() - questionStartTime.current) / 1000; // in seconds
    const isCorrect = userAnswer === currentQuiz[currentQuestionIndex].correctAnswer;
    const today = getTodayDateString();
    const userDocRef = getUserDocRef(user.uid);
    if (!userDocRef) return;
  
    const updates = {};
    const allProgress_path = `progress.${today}.all`;
    const topicProgress_path = `progress.${today}.${currentTopic}`;

    // Increment time for both all and topic-specific stats
    updates[`${allProgress_path}.timeSpent`] = increment(timeTaken);
    updates[`${topicProgress_path}.timeSpent`] = increment(timeTaken);
  
    let feedbackMessage;
    let feedbackType = 'error';

    if (isCorrect) {
      feedbackType = 'success';
      setScore(score + 1);
      feedbackMessage = (
        <span className="flex items-center justify-center gap-2">
          Correct! +5 Coins! <Coins className="text-yellow-500" />
        </span>
      );
      updates.coins = increment(5);
      updates[`${allProgress_path}.correct`] = increment(1);
      updates[`${topicProgress_path}.correct`] = increment(1);
    } else {
      feedbackMessage = `Not quite. The correct answer is ${currentQuiz[currentQuestionIndex].correctAnswer}.`;
      updates[`${allProgress_path}.incorrect`] = increment(1);
      updates[`${topicProgress_path}.incorrect`] = increment(1);
    }
  
    const todaysAllProgress = userData?.progress?.[today]?.all || { correct: 0, incorrect: 0 };
    const totalAnsweredToday = todaysAllProgress.correct + todaysAllProgress.incorrect;
    if (userData.dailyGoal > 0 && totalAnsweredToday + 1 === userData.dailyGoal) {
      feedbackType = 'success';
      feedbackMessage = (
        <span className="flex flex-col items-center justify-center gap-1">
          {isCorrect && (
            <span className="flex items-center justify-center gap-2">
              Correct! +5 Coins! <Coins className="text-yellow-500" />
            </span>
          )}
          <span className="flex items-center justify-center gap-2 font-bold">
            Daily Goal Met! +50 Bonus Coins! <Award className="text-orange-500" />
          </span>
        </span>
      );
      updates.coins = increment(50);
    }
    
    setFeedback({ message: feedbackMessage, type: feedbackType });
    await updateDoc(userDocRef, updates);
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < currentQuiz.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      resetQuestionState();
      questionStartTime.current = Date.now();
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!user) return;
    const userDocRef = getUserDocRef(user.uid);
    // Clear the paused quiz for this topic by setting it to null
    await updateDoc(userDocRef, {
      [`pausedQuizzes.${currentTopic}`]: null
    });
    setQuizState('results');
  };

  const resetQuestionState = () => { setUserAnswer(null); setShowHint(false); setFeedback(null); setIsAnswered(false); };
  const resetQuiz = () => { setCurrentQuestionIndex(0); setScore(0); resetQuestionState(); };
  const returnToTopics = () => { setQuizState('topicSelection'); setCurrentTopic(null); setCurrentQuiz([]); };
  
  const handleGoalChange = async (e) => {
    const newGoal = parseInt(e.target.value, 10);
    if (user && !isNaN(newGoal) && newGoal > 0) {
      const userDocRef = getUserDocRef(user.uid);
      if (!userDocRef) return;
      await updateDoc(userDocRef, { dailyGoal: newGoal });
    }
  };

  // --- Store Logic ---
  const handlePurchase = async (item) => {
    const cost = userData.dailyGoal;
    if (userData.coins >= cost) {
      const userDocRef = getUserDocRef(user.uid);
      await updateDoc(userDocRef, {
        coins: increment(-cost),
        ownedBackgrounds: arrayUnion(item.id)
      });
      setPurchaseFeedback({ type: 'success', message: `Successfully purchased ${item.name}!` });
    } else {
      setPurchaseFeedback({ type: 'error', message: "Not enough coins!" });
    }
    setTimeout(() => setPurchaseFeedback(''), 3000);
  };
  
  const handleSetBackground = async (itemId) => {
    if (userData.ownedBackgrounds.includes(itemId)) {
      const userDocRef = getUserDocRef(user.uid);
      await updateDoc(userDocRef, { activeBackground: itemId });
    }
  };


  // --- Gemini API Call via Netlify Function ---
  const callGeminiAPI = async (prompt) => {
      setIsGenerating(true);
      setGeneratedContent('');
      
      try {
          const response = await fetch('/.netlify/functions/gemini-proxy', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt })
          });
          
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              throw new Error(errorData.error || `API call failed with status: ${response.status}`);
          }

          const result = await response.json();
          setGeneratedContent(result.content);
      } catch (error) {
          console.error("Gemini API error:", error);
          setGeneratedContent(`There was an error: ${error.message}`);
      } finally {
          setIsGenerating(false);
      }
  };
  const handleExplainConcept = () => {
    const concept = currentQuiz[currentQuestionIndex].concept;
    const explanation = conceptExplanations[concept] || "<p>Sorry, no explanation is available for this concept yet!</p>";
    setModalTitle(`✨ What is ${concept}?`);
    setGeneratedContent(explanation);
    setShowModal(true);
  };
  const handleCreateStoryProblem = () => {
    const prompt = `Create a fun and short math story problem for a 3rd grader based on the topic of "${currentTopic}". Make it one paragraph long and then state the question clearly. At the end, on a new line, provide the answer in the format "Answer: [your answer]".`;
    setModalTitle(`✨ A Fun Story Problem!`);
    setShowModal(true);
    callGeminiAPI(prompt);
  };

  // --- UI Rendering ---
  const renderHeader = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-md z-10">
        <div className="flex items-center gap-2 text-yellow-600 font-bold px-2">
            <Coins size={24} />
            <span>{userData?.coins || 0}</span>
        </div>
        <button onClick={() => setQuizState('store')} className="p-2 rounded-full hover:bg-gray-200 transition">
            <Store size={24} className="text-purple-600" />
        </button>
        <button onClick={() => setQuizState('dashboard')} className="p-2 rounded-full hover:bg-gray-200 transition">
            <BarChart2 size={24} className="text-blue-600" />
        </button>
        <button onClick={returnToTopics} className="p-2 rounded-full hover:bg-gray-200 transition">
            <Home size={24} className="text-green-600" />
        </button>
    </div>
  );

  const renderDashboard = () => {
    const today = getTodayDateString();
    const todaysProgress = userData?.progress?.[today];
    const overallStats = todaysProgress?.all || { correct: 0, incorrect: 0, timeSpent: 0 };
    const totalAnswered = overallStats.correct + overallStats.incorrect;
    const accuracy = totalAnswered > 0 ? Math.round((overallStats.correct / totalAnswered) * 100) : 0;
    const avgTime = totalAnswered > 0 ? (overallStats.timeSpent / totalAnswered).toFixed(1) : 0;
    
    const topicsPracticed = todaysProgress ? Object.keys(todaysProgress).filter(key => key !== 'all') : [];

    return (
        <div className="w-full max-w-3xl mx-auto bg-white p-8 rounded-2xl shadow-xl mt-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Daily Goal Progress</h2>
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <input type="range" min="4" max="40" step="4" value={userData?.dailyGoal || 8} onChange={handleGoalChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{userData?.dailyGoal || 8} Qs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full text-xs text-white text-center font-bold flex items-center justify-center" style={{ width: `${Math.min((totalAnswered / (userData?.dailyGoal || 1)) * 100, 100)}%` }}>{totalAnswered} / {userData?.dailyGoal || 8}</div></div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center border-t pt-6">Today's Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center mb-8">
                <div className="bg-blue-100 p-4 rounded-lg"><p className="text-lg text-blue-800">Total Answered</p><p className="text-3xl font-bold text-blue-600">{totalAnswered}</p></div>
                <div className="bg-green-100 p-4 rounded-lg"><p className="text-lg text-green-800">Overall Accuracy</p><p className="text-3xl font-bold text-green-600">{accuracy}%</p></div>
                <div className="bg-yellow-100 p-4 rounded-lg"><p className="text-lg text-yellow-800">Avg. Time</p><p className="text-3xl font-bold text-yellow-600">{avgTime}s</p></div>
            </div>
            
            {topicsPracticed.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-xl font-bold text-gray-700 mb-4">Topic Breakdown:</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left rounded-lg overflow-hidden">
                            <thead className="bg-gray-200">
                                <tr>
                                    <th className="p-3 font-bold">Topic</th>
                                    <th className="p-3 font-bold text-center">Correct</th>
                                    <th className="p-3 font-bold text-center">Incorrect</th>
                                    <th className="p-3 font-bold text-center">Accuracy</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topicsPracticed.map(topic => {
                                    const stats = todaysProgress[topic];
                                    const total = (stats.correct || 0) + (stats.incorrect || 0);
                                    const topicAccuracy = total > 0 ? Math.round(((stats.correct || 0) / total) * 100) : 0;
                                    return (
                                        <tr key={topic} className="border-b bg-white hover:bg-gray-50">
                                            <td className="p-3 font-semibold">{topic}</td>
                                            <td className="p-3 text-center text-green-600 font-semibold">{stats.correct || 0}</td>
                                            <td className="p-3 text-center text-red-600 font-semibold">{stats.incorrect || 0}</td>
                                            <td className="p-3 text-center font-semibold">{topicAccuracy}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="text-center mt-8">
                <button onClick={returnToTopics} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition">Back to Topics</button>
            </div>
        </div>
    );
  };

  const renderStore = () => {
    return (
      <div className="w-full max-w-5xl mx-auto bg-white p-8 rounded-2xl shadow-xl mt-20">
        <h2 className="text-4xl font-bold text-gray-800 mb-2 text-center">Rewards Store</h2>
        <p className="text-lg text-gray-600 mb-8 text-center">Use your coins to buy new backgrounds!</p>
        
        {purchaseFeedback && (
          <div className={`p-3 rounded-lg mb-6 text-center font-semibold ${purchaseFeedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {purchaseFeedback.message}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {storeItems.map(item => {
            const isOwned = userData.ownedBackgrounds.includes(item.id);
            const isActive = userData.activeBackground === item.id;
            const cost = userData.dailyGoal;

            return (
              <div key={item.id} className="border rounded-lg p-4 flex flex-col items-center justify-between bg-gray-50 shadow-md">
                <img 
                  src={item.url} 
                  alt={item.name} 
                  loading="lazy"
                  className="w-full h-32 object-cover rounded-md mb-4 bg-gray-200" 
                />
                <h4 className="font-bold text-lg mb-2">{item.name}</h4>
                {isOwned ? (
                  <button onClick={() => handleSetBackground(item.id)} disabled={isActive} className={`w-full font-bold py-2 px-4 rounded-lg transition ${isActive ? 'bg-green-500 text-white' : 'bg-blue-200 text-blue-800 hover:bg-blue-300'}`}>
                    {isActive ? <span className="flex items-center justify-center gap-2"><CheckCircle size={20}/> Active</span> : 'Set Active'}
                  </button>
                ) : (
                  <button onClick={() => handlePurchase(item)} className="w-full bg-purple-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2">
                    <Coins size={16} /> {cost}
                  </button>
                )}
              </div>
            )
          })}
        </div>
        <div className="text-center mt-8">
            <button onClick={returnToTopics} className="bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition">Back to Topics</button>
        </div>
      </div>
    );
  };

  const renderTopicSelection = () => (
    <div className="text-center mt-20">
      <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-2">Math Whiz!</h1>
      <p className="text-lg text-gray-600 mb-10">Choose a topic to start your 3rd Grade math adventure!</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {quizTopics.map(topic => (<button key={topic} onClick={() => handleTopicSelection(topic)} className="w-full bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:-translate-y-1 transform transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center group"><div className="p-4 bg-blue-100 rounded-full mb-4 transition-colors duration-300 group-hover:bg-blue-500"><Sparkles className="text-blue-500 group-hover:text-white transition-colors duration-300" /></div><h3 className="text-xl md:text-2xl font-bold text-gray-800 transition-colors duration-300 group-hover:text-blue-600">{topic}</h3><p className="text-gray-500 mt-2">Practice your skills!</p></button>))}
      </div>
    </div>
  );

  const renderQuiz = () => {
    if (currentQuiz.length === 0) return null;
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;
    return (
      <div className="w-full max-w-3xl mx-auto bg-white p-6 sm:p-8 rounded-2xl shadow-xl mt-20">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl md:text-3xl font-bold text-blue-600">{currentTopic}</h2>
          <button onClick={pauseQuiz} className="flex items-center gap-2 text-gray-500 font-semibold py-2 px-4 rounded-lg hover:bg-gray-100 transition"><Pause size={20} /> Pause</button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-6"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${progressPercentage}%` }}></div></div>
        <p className="text-lg md:text-xl text-gray-800 mb-6 min-h-[56px]">{currentQuestion.question}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {currentQuestion.options.map((option, index) => {
            const isSelected = userAnswer === option;
            const isCorrect = option === currentQuestion.correctAnswer;
            let buttonClass = 'bg-white border-2 border-gray-300 hover:bg-blue-50 hover:border-blue-400';
            if (isAnswered) {
              if (isCorrect) buttonClass = 'bg-green-100 border-2 border-green-500 text-green-800';
              else if (isSelected && !isCorrect) buttonClass = 'bg-red-100 border-2 border-red-500 text-red-800';
              else buttonClass = 'bg-gray-100 border-2 border-gray-300 text-gray-500';
            } else if (isSelected) {
              buttonClass = 'bg-blue-100 border-2 border-blue-500';
            }
            return (<button key={index} onClick={() => handleAnswer(option)} disabled={isAnswered} className={`p-4 rounded-lg text-left text-lg font-medium transition-all duration-200 ${buttonClass}`}>{option}</button>);
          })}
        </div>
        {feedback && (<div className={`p-4 rounded-lg mb-4 text-center font-semibold ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{feedback.message}</div>)}
        {showHint && !isAnswered && (<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded-r-lg"><p><span className="font-bold">Hint:</span> {currentQuestion.hint}</p></div>)}
        <div className="flex items-center justify-start gap-4 mb-6"><button onClick={handleExplainConcept} className="flex items-center gap-2 text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-purple-100 transition"><Sparkles size={20} /> Explain the Concept</button></div>
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6">
          <button onClick={() => setShowHint(!showHint)} disabled={isAnswered} className="flex items-center gap-2 text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed mb-4 sm:mb-0"><HelpCircle size={20} />{showHint ? 'Hide Hint' : 'Show Hint'}</button>
          {isAnswered ? (<button onClick={nextQuestion} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2">Next Question <ChevronsRight size={20} /></button>) : (<button onClick={checkAnswer} disabled={userAnswer === null} className="w-full sm:w-auto bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">Check Answer</button>)}
        </div>
        <div className="text-center mt-4"><p className="text-xs text-gray-400">CA Standard: {currentQuestion.standard}</p></div>
      </div>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / currentQuiz.length) * 100);
    let message = ''; let emoji = '';
    if (percentage === 100) { message = "Perfect Score! You're a Math Genius!"; emoji = '🏆'; }
    else if (percentage >= 80) { message = "Excellent Work! You really know your stuff!"; emoji = '🎉'; }
    else if (percentage >= 60) { message = "Good Job! Keep practicing!"; emoji = '👍'; }
    else { message = "Nice try! Don't give up, practice makes perfect!"; emoji = '🧠'; }
    return (
      <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md mx-auto mt-20">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
        <div className="text-6xl mb-4">{emoji}</div>
        <p className="text-xl text-gray-600 mb-2">{message}</p>
        <p className="text-2xl font-bold text-blue-600 mb-6">You scored {score} out of {currentQuiz.length} ({percentage}%)</p>
        <div className="flex flex-col gap-4 justify-center">
            <button onClick={handleCreateStoryProblem} className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2"><Sparkles size={20} /> Create a Story Problem</button>
            <button onClick={() => { startNewQuiz(currentTopic); }} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">Try Again</button>
            <button onClick={returnToTopics} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105">Choose New Topic</button>
        </div>
      </div>
    );
  };
  
  const renderModal = () => {
    if (!showModal) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 relative flex flex-col max-h-[80vh]">
                <div className='flex-shrink-0'>
                    <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{modalTitle}</h3>
                </div>
                <div className="flex-grow overflow-y-auto pr-4">
                    {isGenerating && (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    {generatedContent && (
                        <div 
                            className="text-gray-700 whitespace-pre-wrap leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: generatedContent }}
                        />
                    )}
                </div>
            </div>
        </div>
    );
  }

  const renderResumeModal = () => {
    if (!showResumeModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-800 mb-4">Paused Quiz Found!</h3>
          <p className="text-gray-600 mb-8">Do you want to continue your quiz on "{topicToResume}" or start a new one?</p>
          <div className="flex flex-col gap-4">
            <button onClick={resumePausedQuiz} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"><Play size={20} /> Resume Paused Quiz</button>
            <button onClick={() => startNewQuiz(topicToResume)} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition">Start New Quiz</button>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch(quizState) {
        case 'topicSelection': return renderTopicSelection();
        case 'inProgress': return renderQuiz();
        case 'results': return renderResults();
        case 'dashboard': return renderDashboard();
        case 'store': return renderStore();
        default: return renderTopicSelection();
    }
  }
  
  const activeBgUrl = userData?.activeBackground && userData.activeBackground !== 'default'
    ? storeItems.find(item => item.id === userData.activeBackground)?.url
    : null;

  if (!user || !userData) {
    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            <p className="ml-4 text-gray-600">Warming up the Math Machine...</p>
        </div>
    );
  }

  return (
    <div 
        className="min-h-screen bg-gray-100 flex items-center justify-center p-4 font-sans relative transition-all duration-500"
        style={{
            backgroundImage: activeBgUrl ? `url(${activeBgUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
    >
      <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-0"></div>
      <div className="relative z-10 w-full">
        {renderHeader()}
        {renderModal()}
        {renderResumeModal()}
        {renderContent()}
      </div>
    </div>
  );
};

export default App;
