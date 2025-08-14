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
  console.log('Using environment variables');
  
  // Check if we have the minimum required config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.warn('Firebase configuration incomplete. Some features may not work.');
  }
}

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

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

// --- Concept Explanation HTML Files Mapping ---
const conceptExplanationFiles = {
  'Multiplication': '/multiplicationExplanation.html',
  'Division': '/divisionExplanation.html', 
  'Fractions': '/fractionsExplanation.html',
  'Area': '/areaExplanation.html',
  'Perimeter': '/perimeterExplanation.html',
  'Volume': '/volumeExplanation.html'
};

// --- Store Items ---
const storeItems = [
    { id: 'bg1', name: 'Silly Giraffe', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/A_funny_cute_plastic_toy_gira-3.jpg' },
    { id: 'bg2', name: 'Cool Lion', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/A_cool_felt-stitched_toy_lion_w-1.jpg' },
    { id: 'bg3', name: 'Playful Monkey', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/A_playful_claymation-style_toy-0.jpg' },
    { id: 'bg4', name: 'Happy Hippo', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/Happy_Hippo_A_cheerful_round_h-0.jpg' },
    { id: 'bg5', name: 'Zebra Stripes', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/zebra.jpeg' },
    { id: 'bg6', name: 'Funky Frog', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/frog.jpeg' },
    { id: 'bg7', name: 'Dapper Dog', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/puppy_hat_and_a_monocle.jpg' },
    { id: 'bg8', name: 'Cuddly Cat', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/kitten.jpeg' },
    { id: 'bg9', name: 'Penguin Party', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/penguins.jpeg' },
    { id: 'bg10', name: 'Bear Hugs', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/polar_bear_cub_with_glasses.jpg' },
    { id: 'bg11', name: 'Wacky Walrus', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/walrus.jpeg' },
    { id: 'bg12', name: 'Jumping Kangaroo', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/kangaroo.jpeg' },
    { id: 'bg13', name: 'Sleepy Sloth', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/sloth.jpeg' },
    { id: 'bg14', name: 'Clever Fox', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/fox.jpeg' },
    { id: 'bg15', name: 'Wise Owl', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/owl.jpeg' },
    { id: 'bg16', name: 'Busy Beaver', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/beaver.jpeg' },
    { id: 'bg17', name: 'Panda Peace', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/panda.jpeg' },
    { id: 'bg18', name: 'Koala Cuddles', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/Koala2.jpg' },
    { id: 'bg19', name: 'Raccoon Rascal', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/racoon.jpeg' },
    { id: 'bg20', name: 'Elephant Smiles', url: 'https://images4whizkids.s3.us-east-2.amazonaws.com/elephant.jpeg' },
];


// --- Dynamic Quiz Generation ---
const generateQuizQuestions = (topic, dailyGoal = 8) => {
  const questions = [];
  const usedQuestions = new Set(); // Track unique question signatures
  const numQuestions = Math.max(1, Math.floor(dailyGoal / 4));
  let attempts = 0;
  const maxAttempts = numQuestions * 10; // Prevent infinite loops
  
  while (questions.length < numQuestions && attempts < maxAttempts) {
    attempts++;
    let question = {};
    let questionSignature = '';
    
    switch (topic) {
      case 'Multiplication':
        const m1 = getRandomInt(2, 12);
        const m2 = getRandomInt(2, 9);
        const mAnswer = m1 * m2;
        questionSignature = `mult_${m1}_${m2}`;
        question = { question: `What is ${m1} x ${m2}?`, correctAnswer: mAnswer.toString(), options: shuffleArray([mAnswer.toString(), (mAnswer + getRandomInt(1, 5)).toString(), (m1 * (m2 + 1)).toString(), ((m1 - 1) * m2).toString()]), hint: `Try skip-counting by ${m2}, ${m1} times!`, standard: "3.OA.C.7", concept: "Multiplication" };
        break;
      case 'Division':
        const d_quotient = getRandomInt(2, 9);
        const d_divisor = getRandomInt(2, 9);
        const d_dividend = d_quotient * d_divisor;
        questionSignature = `div_${d_dividend}_${d_divisor}`;
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
                questionSignature = `frac_equiv_${f_num_eq}_${f_den_eq}`;
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
                questionSignature = `frac_add_${add_num1}_${add_den1}_${add_num2}_${add_den2}`;
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
                questionSignature = `frac_sub_${sub_num1}_${sub_den1}_${sub_num2}_${sub_den2}`;
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
                    questionSignature = `frac_comp_same_den_${comp_num1}_${comp_num2}_${comp_den}`;
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
                    questionSignature = `frac_comp_same_num_${comp_num}_${comp_den1}_${comp_den2}`;
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
                questionSignature = `frac_equiv_default_${def_f_num_eq}_${def_f_den_eq}`;
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
                questionSignature = `area_${length}_${width}`;
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
                questionSignature = `perimeter_${side1}_${side2}`;
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
                questionSignature = `volume_${vol_l}_${vol_w}_${vol_h}`;
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
                questionSignature = `area_default_${def_length}_${def_width}`;
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
        questionSignature = 'default_no_question';
        question = { question: 'No question generated', options: [], correctAnswer: '', concept: 'Math' };
    }
    
    // Only add the question if it's unique
    if (!usedQuestions.has(questionSignature)) {
      usedQuestions.add(questionSignature);
      questions.push(question);
    }
  }
  
  // If we couldn't generate enough unique questions, log a warning
  if (questions.length < numQuestions) {
    console.warn(`Could only generate ${questions.length} unique questions out of ${numQuestions} requested for ${topic}`);
  }
  
  return questions;
};

const quizTopics = ['Multiplication', 'Division', 'Fractions', 'Measurement & Data'];

// --- Helper function to check topic availability ---
const getTopicAvailability = (userData, dailyGoal) => {
  if (!userData) return { availableTopics: [], unavailableTopics: [], allCompleted: false };
  
  const today = getTodayDateString();
  const todaysProgress = userData?.progress?.[today] || {};
  const numQuestions = Math.max(1, Math.floor(dailyGoal / 4));
  
  const topicStats = quizTopics.map(topic => {
    const stats = todaysProgress[topic] || { correct: 0, incorrect: 0 };
    return {
      topic,
      correctAnswers: stats.correct,
      completed: stats.correct >= numQuestions
    };
  });
  
  const completedTopics = topicStats.filter(t => t.completed);
  const incompleteTopics = topicStats.filter(t => !t.completed);
  
  // If all topics are completed, make all available again
  // This handles the case where reset didn't happen properly or user came back after all topics were done
  if (completedTopics.length === quizTopics.length) {
    return {
      availableTopics: quizTopics,
      unavailableTopics: [],
      allCompleted: true,
      topicStats
    };
  }
  
  // If no topics are completed, all are available
  if (completedTopics.length === 0) {
    return {
      availableTopics: quizTopics,
      unavailableTopics: [],
      allCompleted: false,
      topicStats
    };
  }
  
  // Some topics are completed - those become unavailable until others catch up
  const availableTopics = incompleteTopics.map(t => t.topic);
  const unavailableTopics = completedTopics.map(t => t.topic);
  
  return {
    availableTopics,
    unavailableTopics,
    allCompleted: false,
    topicStats
  };
};

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
  const [storyCreatedForCurrentQuiz, setStoryCreatedForCurrentQuiz] = useState(false);

  // New state variables for story problem functionality
  const [showStoryHint, setShowStoryHint] = useState(false);
  const [showStoryAnswer, setShowStoryAnswer] = useState(false);
  const [storyData, setStoryData] = useState(null);

  const questionStartTime = useRef(null);

  // --- Firebase Auth and Data Loading ---
  useEffect(() => {
    let unsubscribeSnapshot = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      unsubscribeSnapshot(); // Clean up previous listener if user changes

      if (currentUser) {
        setUser(currentUser);
        
        // Temporary: Expose auth objects globally for testing
        // Remove this in production
        if (process.env.NODE_ENV === 'development') {
          window.firebaseAuth = auth;
          window.currentUser = currentUser;
          console.log('🧪 Firebase auth exposed for testing:', currentUser.uid);
        }
        
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
              activeBackground: 'default',
              dailyStories: { [today]: {} },
              answeredQuestions: [] // field to track all answered questions
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
    const { availableTopics } = getTopicAvailability(userData, userData.dailyGoal);
    
    if (!availableTopics.includes(topic)) {
      setFeedback({
        message: `Complete other topics first before returning to ${topic}!`,
        type: 'error'
      });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }
    
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
    setStoryCreatedForCurrentQuiz(false); // Reset story creation status for new quiz
    // Reset story state
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
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
    setStoryCreatedForCurrentQuiz(false); // Reset story creation status for resumed quiz
    // Reset story state
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
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

    // Create question record for tracking
    const questionRecord = {
      id: `${Date.now()}_${currentQuestionIndex}`, // Unique ID
      timestamp: new Date().toISOString(),
      date: today,
      topic: currentTopic,
      question: currentQuiz[currentQuestionIndex].question,
      correctAnswer: currentQuiz[currentQuestionIndex].correctAnswer,
      userAnswer: userAnswer,
      isCorrect: isCorrect,
      timeTaken: timeTaken,
      options: currentQuiz[currentQuestionIndex].options,
      hint: currentQuiz[currentQuestionIndex].hint,
      standard: currentQuiz[currentQuestionIndex].standard,
      concept: currentQuiz[currentQuestionIndex].concept
    };

    // Add question to answered questions array
    updates[`answeredQuestions`] = arrayUnion(questionRecord);
  
    let feedbackMessage;
    let feedbackType = 'error';
    let shouldResetProgress = false;

    if (isCorrect) {
      feedbackType = 'success';
      setScore(score + 1);
      feedbackMessage = (
        <span className="flex items-center justify-center gap-2">
          Correct! +1 Coin! <Coins className="text-yellow-500" />
        </span>
      );
      updates.coins = increment(1);
      
      // Check if all topics will be completed after this answer
      const numQuestions = Math.max(1, Math.floor(userData.dailyGoal / 4));
      const currentTopicProgress = userData?.progress?.[today]?.[currentTopic] || { correct: 0, incorrect: 0 };
      const newCorrectCount = currentTopicProgress.correct + 1;
      
      // Check if this makes the current topic completed and if all other topics are already completed
      if (newCorrectCount >= numQuestions) {
        const allTopicsWillBeCompleted = quizTopics.every(topic => {
          if (topic === currentTopic) {
            return true; // Current topic will be completed with this answer
          }
          const topicProgress = userData?.progress?.[today]?.[topic] || { correct: 0, incorrect: 0 };
          return topicProgress.correct >= numQuestions;
        });
        
        // If all topics will be completed, we need to reset
        if (allTopicsWillBeCompleted) {
          shouldResetProgress = true;
          feedbackMessage = (
            <span className="flex flex-col items-center justify-center gap-1">
              <span className="flex items-center justify-center gap-2">
                Correct! +1 Coin! <Coins className="text-yellow-500" />
              </span>
              <span className="flex items-center justify-center gap-2 font-bold text-purple-600">
                🎉 All Topics Mastered! Progress Reset! <Award className="text-purple-500" />
              </span>
            </span>
          );
        }
      }
    } else {
      feedbackMessage = `Not quite. The correct answer is ${currentQuiz[currentQuestionIndex].correctAnswer}.`;
    }

    // Handle progress updates based on whether we're resetting or not
    if (shouldResetProgress) {
      // Reset all topic progress counters
      quizTopics.forEach(topic => {
        updates[`progress.${today}.${topic}.correct`] = 0;
        updates[`progress.${today}.${topic}.incorrect`] = 0;
        updates[`progress.${today}.${topic}.timeSpent`] = 0;
      });
      
      // Set the current topic to 1 since we just answered correctly
      updates[`progress.${today}.${currentTopic}.correct`] = 1;
      updates[`progress.${today}.${currentTopic}.timeSpent`] = timeTaken;
      
      // Update all progress (these don't get reset, they continue accumulating)
      updates[`${allProgress_path}.correct`] = increment(1);
      updates[`${allProgress_path}.timeSpent`] = increment(timeTaken);
    } else {
      // Normal increments
      if (isCorrect) {
        updates[`${allProgress_path}.correct`] = increment(1);
        updates[`${topicProgress_path}.correct`] = increment(1);
      } else {
        updates[`${allProgress_path}.incorrect`] = increment(1);
        updates[`${topicProgress_path}.incorrect`] = increment(1);
      }
      
      // Always increment time
      updates[`${allProgress_path}.timeSpent`] = increment(timeTaken);
      updates[`${topicProgress_path}.timeSpent`] = increment(timeTaken);
    }
  
    const todaysAllProgress = userData?.progress?.[today]?.all || { correct: 0, incorrect: 0 };
    const totalAnsweredToday = todaysAllProgress.correct + todaysAllProgress.incorrect;
    if (userData.dailyGoal > 0 && ((totalAnsweredToday + 1) % userData.dailyGoal === 0)) {
      feedbackType = 'success';
      const DAILY_GOAL_BONUS = 10;
      feedbackMessage = (
        <span className="flex flex-col items-center justify-center gap-1">
          {isCorrect && (
        <span className="flex items-center justify-center gap-2">
          Correct! +1 Coin! <Coins className="text-yellow-500" />
        </span>
          )}
          <span className="flex items-center justify-center gap-2 font-bold">
        Daily Goal Met! +{DAILY_GOAL_BONUS} Bonus Coins! <Award className="text-orange-500" />
          </span>
        </span>
      );
      updates.coins = increment(DAILY_GOAL_BONUS);
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
  const returnToTopics = () => { 
    setQuizState('topicSelection'); 
    setCurrentTopic(null); 
    setCurrentQuiz([]); 
    // Reset story state
    setStoryData(null);
    setShowStoryHint(false);
    setShowStoryAnswer(false);
  };
  
  const handleGoalChange = async (e) => {
    const newGoal = parseInt(e.target.value, 10);
    if (user && !isNaN(newGoal) && newGoal > 0) {
      const userDocRef = getUserDocRef(user.uid);
      if (!userDocRef) return;
      await updateDoc(userDocRef, { dailyGoal: newGoal });
    }
  };

  const resetAllProgress = async () => {
    if (!user) return;
    const userDocRef = getUserDocRef(user.uid);
    if (!userDocRef) return;
    
    const today = getTodayDateString();
    const updates = {};
    
    // Reset all topic progress counters
    quizTopics.forEach(topic => {
      updates[`progress.${today}.${topic}.correct`] = 0;
      updates[`progress.${today}.${topic}.incorrect`] = 0;
      updates[`progress.${today}.${topic}.timeSpent`] = 0;
    });
    
    await updateDoc(userDocRef, updates);
    
    setFeedback({
      message: '🎉 Progress reset! All topics are now available for a fresh start!',
      type: 'success'
    });
    setTimeout(() => setFeedback(null), 3000);
  };

  // --- Store Logic ---
  const handlePurchase = async (item) => {
    const cost = 20;
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
          // Get the current user's auth token
          if (!user) {
            console.error('❌ No user found during API call');
            throw new Error('User not authenticated');
          }
          
          console.log('🔐 Getting auth token for user:', user.uid);
          const token = await user.getIdToken();
          console.log('✅ Got auth token, making API call...');
          
          const requestBody = { 
            prompt: prompt,
            topic: currentTopic
          };
          console.log('📤 Request body:', requestBody);
          
          const response = await fetch('/.netlify/functions/gemini-proxy', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(requestBody)
          });
          
          console.log('📥 Response status:', response.status);
          
          if (!response.ok) {
              const errorData = await response.json().catch(() => ({}));
              console.error('❌ API Error:', errorData);
              throw new Error(errorData.error || `API call failed with status: ${response.status}`);
          }

          const result = await response.json();
          console.log('✅ API Success! Content length:', result.content?.length);
          setGeneratedContent(result.content);
          
          // Parse story content if this is a story problem
          if (modalTitle === '✨ A Fun Story Problem!') {
            parseStoryContent(result.content);
          }
      } catch (error) {
          console.error("Gemini API error:", error);
          setGeneratedContent(`There was an error: ${error.message}`);
      } finally {
          setIsGenerating(false);
      }
  };

  // Function to parse story content and extract components
  const parseStoryContent = (content) => {
    try {
      console.log('🔍 Parsing story content:', content);
      const lines = content.split('\n').filter(line => line.trim());
      console.log('📝 Filtered lines:', lines);
      
      let story = '';
      let question = '';
      let hint = '';
      let answer = '';
      
      let currentSection = 'story';
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        if (line.startsWith('Hint:')) {
          currentSection = 'hint';
          hint = line.replace('Hint:', '').trim();
        } else if (line.startsWith('Answer:')) {
          currentSection = 'answer';
          answer = line.replace('Answer:', '').trim();
        } else if (currentSection === 'story') {
          if (story) story += ' ';
          story += line;
        } else if (currentSection === 'hint') {
          if (hint) hint += ' ';
          hint += line;
        } else if (currentSection === 'answer') {
          if (answer) answer += ' ';
          answer += line;
        }
      }
      
      console.log('📖 Initial parsing results:', { story, question, hint, answer });
      
      // Try to extract question from the story if it wasn't explicitly provided
      if (!question && story) {
        const sentences = story.split(/[.!?]+/).filter(s => s.trim());
        for (let i = sentences.length - 1; i >= 0; i--) {
          const sentence = sentences[i].trim();
          if (sentence.includes('?') || sentence.includes('how many') || sentence.includes('what is') || sentence.includes('find')) {
            question = sentence + (sentence.endsWith('?') ? '' : '?');
            story = story.replace(sentence, '').trim();
            break;
          }
        }
      }
      
      // Clean up the story by removing the question if it was extracted
      if (question && story.includes(question)) {
        story = story.replace(question, '').trim();
      }
      
      console.log('✅ Final parsing results:', { story, question, hint, answer });
      
      setStoryData({
        story: story || 'Story content could not be parsed',
        question: question || 'Question could not be parsed',
        hint: hint || 'Hint could not be parsed',
        answer: answer || 'Answer could not be parsed'
      });
      
      // Reset story UI state
      setShowStoryHint(false);
      setShowStoryAnswer(false);
    } catch (error) {
      console.error('Error parsing story content:', error);
      setStoryData({
        story: 'Error parsing story content',
        question: 'Error parsing question',
        hint: 'Error parsing hint',
        answer: 'Error parsing answer'
      });
    }
  };

  const handleExplainConcept = () => {
    const concept = currentQuiz[currentQuestionIndex].concept;
    const explanationFile = conceptExplanationFiles[concept];

    if (explanationFile) {
        setModalTitle(`✨ Understanding ${concept}`);
        setShowModal(true);
        setIsGenerating(false);
        // Set the iframe source instead of HTML content
        setGeneratedContent(`<iframe src="${explanationFile}" style="width: 100%; height: 70vh; border: none; border-radius: 8px;" title="${concept} Explanation"></iframe>`);
    } else {
        // Fallback: show modal with basic explanation
        setModalTitle(`✨ What is ${concept}?`);
        setGeneratedContent("<p>Sorry, no detailed explanation is available for this concept yet!</p>");
        setShowModal(true);
        setIsGenerating(false);
    }
  };
  const handleCreateStoryProblem = async () => {
    if (storyCreatedForCurrentQuiz) {
      setFeedback({ message: "You've already created a story problem for this quiz!", type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const today = getTodayDateString();
    const todaysStories = userData?.dailyStories?.[today] || {};
    
    // Check if user has already created a story for this topic today
    if (todaysStories[currentTopic]) {
      setFeedback({ message: `You've already created a story problem for ${currentTopic} today! Come back tomorrow for more stories.`, type: 'error' });
      setTimeout(() => setFeedback(null), 3000);
      return;
    }

    const prompt = `Create a fun and short math story problem for a 3rd grader based on the topic of "${currentTopic}". Make it one paragraph long and then state the question clearly. 

After the question, provide a helpful hint on how to solve it in the format "Hint: [your hint]".

At the end, on a new line, provide the answer in the format "Answer: [your answer]".

Please structure it exactly like this:
[Story paragraph]
[Question]
Hint: [Hint text]
Answer: [Answer]`;
    setModalTitle(`✨ A Fun Story Problem!`);
    setShowModal(true);
    
    // Update user data to mark that a story has been created for this topic today
    if (user) {
      const userDocRef = getUserDocRef(user.uid);
      if (userDocRef) {
        await updateDoc(userDocRef, {
          [`dailyStories.${today}.${currentTopic}`]: true
        });
      }
    }
    
    setStoryCreatedForCurrentQuiz(true); // Mark that a story has been created for this quiz
    callGeminiAPI(prompt);
  };

  // --- UI Rendering ---
  const renderHeader = () => (
    <div className="absolute top-4 right-4 flex items-center gap-2 bg-white/50 backdrop-blur-sm p-2 rounded-full shadow-md z-10">
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
    
    // Get today's answered questions for accurate calculations
    const todaysQuestions = userData?.answeredQuestions?.filter(q => q.date === today) || [];
    const totalQuestionsAnswered = userData?.answeredQuestions?.length || 0;
    
    // Calculate overall stats from actual answered questions
    const correctAnswers = todaysQuestions.filter(q => q.isCorrect).length;
    const totalAnswered = todaysQuestions.length;
    const totalTimeSpent = todaysQuestions.reduce((sum, q) => sum + q.timeTaken, 0);
    
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswers / totalAnswered) * 100) : 0;
    const avgTime = totalAnswered > 0 ? (totalTimeSpent / totalAnswered).toFixed(1) : 0;
    
    // Calculate topic breakdown from actual answered questions
    const topicStats = {};
    todaysQuestions.forEach(q => {
      if (!topicStats[q.topic]) {
        topicStats[q.topic] = { correct: 0, incorrect: 0, total: 0 };
      }
      if (q.isCorrect) {
        topicStats[q.topic].correct++;
      } else {
        topicStats[q.topic].incorrect++;
      }
      topicStats[q.topic].total++;
    });
    
    const topicsPracticed = Object.keys(topicStats);

    return (
        <div className="w-full max-w-3xl mx-auto bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl mt-20">
            <h2 className="text-3xl font-bold text-gray-800 mb-2 text-center">Daily Goal Progress</h2>
            <div className="mb-8">
                <div className="flex items-center gap-4 mb-2">
                    <input type="range" min="8" max="40" step="4" value={userData?.dailyGoal || 8} onChange={handleGoalChange} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                    <span className="font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{userData?.dailyGoal || 8} Qs</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4"><div className="bg-green-500 h-4 rounded-full text-xs text-white text-center font-bold flex items-center justify-center" style={{ width: `${Math.min((totalAnswered / (userData?.dailyGoal || 1)) * 100, 100)}%` }}>{totalAnswered} / {userData?.dailyGoal || 8}</div></div>
            </div>
            
            <h3 className="text-2xl font-bold text-gray-800 mb-4 text-center border-t pt-6">Today's Performance</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center mb-8">
                <div className="bg-blue-100 p-4 rounded-lg"><p className="text-lg text-blue-800">Total Answered</p><p className="text-3xl font-bold text-blue-600">{totalAnswered}</p></div>
                <div className="bg-green-100 p-4 rounded-lg"><p className="text-lg text-green-800">Overall Accuracy</p><p className="text-3xl font-bold text-green-600">{accuracy}%</p></div>
                <div className="bg-yellow-100 p-4 rounded-lg"><p className="text-lg text-yellow-800">Avg. Time</p><p className="text-3xl font-bold text-yellow-600">{avgTime}s</p></div>
                <div className="bg-purple-100 p-4 rounded-lg"><p className="text-lg text-purple-800">All Time Total</p><p className="text-3xl font-bold text-purple-600">{totalQuestionsAnswered}</p></div>
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
                                    const stats = topicStats[topic];
                                    const topicAccuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
                                    return (
                                        <tr key={topic} className="border-b bg-white hover:bg-gray-50">
                                            <td className="p-3 font-semibold">{topic}</td>
                                            <td className="p-3 text-center text-green-600 font-semibold">{stats.correct}</td>
                                            <td className="p-3 text-center text-red-600 font-semibold">{stats.incorrect}</td>
                                            <td className="p-3 text-center font-semibold">{topicAccuracy}%</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {todaysQuestions.length > 0 && (
                <div className="mt-8">
                    <h4 className="text-xl font-bold text-gray-700 mb-4">Today's Questions:</h4>
                    <div className="max-h-60 overflow-y-auto">
                        {todaysQuestions.map((q, index) => (
                            <div key={q.id} className={`p-3 mb-2 rounded-lg border-l-4 ${q.isCorrect ? 'bg-green-50 border-green-500' : 'bg-red-50 border-red-500'}`}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-sm text-gray-600">{q.topic}</span>
                                    <span className="text-xs text-gray-500">{q.timeTaken.toFixed(1)}s</span>
                                </div>
                                <p className="text-sm text-gray-800 mb-1">{q.question}</p>
                                <div className="text-xs">
                                    <span className="text-gray-600">Your answer: </span>
                                    <span className={q.isCorrect ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{q.userAnswer}</span>
                                    {!q.isCorrect && (
                                        <>
                                            <span className="text-gray-600 ml-2">Correct: </span>
                                            <span className="text-green-600 font-semibold">{q.correctAnswer}</span>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}
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
      <div className="w-full max-w-5xl mx-auto bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl mt-20">
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
            const cost = 20;

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

  const renderTopicSelection = () => {
    const { availableTopics, unavailableTopics, allCompleted, topicStats } = getTopicAvailability(userData, userData.dailyGoal);
    const numQuestions = Math.max(1, Math.floor(userData.dailyGoal / 4));
    
    return (
      <div className="text-center mt-20">
        <div className="mb-2 flex justify-center items-center">
          {/* Using animated gif for better performance */}
          <img 
            src="/math-whiz-title.gif" 
            alt="Math Whiz!" 
            className="h-16 md:h-20 w-auto mb-4"
            style={{ imageRendering: 'auto' }}
          />
        </div>
        <p className="text-lg text-gray-600 mb-4">Choose a topic to start your 3rd Grade math adventure!</p>
        
        {/* Feedback message */}
        {feedback && (
          <div className={`mb-6 p-3 rounded-lg mx-auto max-w-md text-center font-semibold ${
            feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {feedback.message}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {quizTopics.map(topic => {
            const isAvailable = availableTopics.includes(topic);
            const isCompleted = topicStats?.find(t => t.topic === topic)?.completed || false;
            
            return (
              <button 
                key={topic} 
                onClick={() => handleTopicSelection(topic)} 
                disabled={!isAvailable}
                className={`w-full p-6 rounded-2xl shadow-lg transition-all duration-300 ease-in-out flex flex-col items-center justify-center text-center group ${
                  isAvailable 
                    ? 'bg-white/50 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 transform cursor-pointer'
                    : 'bg-gray-300/50 backdrop-blur-sm cursor-not-allowed opacity-60'
                }`}
              >
                <div className={`p-4 rounded-full mb-4 transition-colors duration-300 ${
                  isAvailable 
                    ? 'bg-blue-100 group-hover:bg-blue-500' 
                    : 'bg-gray-200'
                }`}>
                  {isCompleted ? (
                    <Award className={`${isAvailable ? 'text-green-500' : 'text-gray-400'} transition-colors duration-300`} />
                  ) : (
                    <Sparkles className={`${isAvailable ? 'text-blue-500 group-hover:text-white' : 'text-gray-400'} transition-colors duration-300`} />
                  )}
                </div>
                <h3 className={`text-xl md:text-2xl font-bold transition-colors duration-300 ${
                  isAvailable 
                    ? 'text-gray-800 group-hover:text-blue-600' 
                    : 'text-gray-500'
                }`}>
                  {topic}
                </h3>
                <p className={`mt-2 ${isAvailable ? 'text-gray-500' : 'text-gray-400'}`}>
                  {isCompleted && !isAvailable ? '✅ Waiting for others...' : 
                   isCompleted && isAvailable ? '✅ Ready to practice!' :
                   isAvailable ? 'Practice your skills!' : 'Complete other topics first'}
                </p>
              </button>
            );
          })}
        </div>
        {/* Progress Info */}
        <div className="mt-8 mb-6 bg-white/70 backdrop-blur-sm p-4 rounded-xl shadow-md max-w-2xl mx-auto">
          <p className="text-sm text-gray-700 font-medium">
            {allCompleted ? (
              <span className="text-green-600">🎉 All topics completed! Ready for a fresh start?</span>
            ) : unavailableTopics.length > 0 ? (
              <span>Complete {numQuestions} questions correctly in each available topic to unlock the others!</span>
            ) : (
              <span>Answer {numQuestions} questions correctly per topic. Topics will become unavailable once completed until others catch up.</span>
            )}
          </p>
          {topicStats && (
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {topicStats.map(stat => (
                <div key={stat.topic} className={`p-2 rounded ${stat.completed ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                  <div className="font-semibold">{stat.topic}</div>
                  <div>{stat.correctAnswers}/{numQuestions} ✓</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Reset button when all topics are completed */}
          {allCompleted && (
            <div className="mt-4">
              <button 
                onClick={resetAllProgress}
                className="bg-purple-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2 mx-auto"
              >
                <Award size={20} /> Start Fresh Cycle
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    if (currentQuiz.length === 0) return null;
    const currentQuestion = currentQuiz[currentQuestionIndex];
    const progressPercentage = ((currentQuestionIndex + 1) / currentQuiz.length) * 100;
    return (
      <>
        <div className="w-full max-w-3xl mx-auto bg-white/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-xl mt-20 flex flex-col" style={{ minHeight: 600, height: 600 }}>
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
          {showHint && !isAnswered && (<div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mb-4 rounded-r-lg"><p><span className="font-bold">Hint:</span> {currentQuestion.hint}</p></div>)}

          {/* Bottom layout: two rows, responsive */}
          <div className="mt-auto w-full">
            {/* First row: Explain Concept | Show/Hide Hint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <button onClick={handleExplainConcept} className="w-full flex items-center justify-center gap-2 text-purple-600 font-semibold py-2 px-4 rounded-lg hover:bg-purple-100 transition">
                <Sparkles size={20} /> Learn About This
              </button>
              <button onClick={() => setShowHint(!showHint)} disabled={isAnswered} className="w-full flex items-center justify-center gap-2 text-blue-600 font-semibold py-2 px-4 rounded-lg hover:bg-blue-100 transition disabled:opacity-50 disabled:cursor-not-allowed">
                <HelpCircle size={20} />{showHint ? 'Hide Hint' : 'Show Hint'}
              </button>
            </div>
            {/* Second row: Response Field | Check/Next Button */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Response Field: show feedback, selected answer, or prompt to select */}
              <div className={`flex items-center justify-center w-full min-h-[48px] rounded-lg border px-4 text-lg font-medium ${
                feedback 
                  ? feedback.type === 'success' 
                    ? 'bg-green-100 border-green-500 text-green-800' 
                    : 'bg-red-100 border-red-500 text-red-800'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
              }`}>
                {feedback 
                  ? feedback.message
                  : userAnswer !== null
                    ? <span>Selected: <span className="font-bold">{userAnswer}</span></span>
                    : <span className="italic text-gray-400">Select an answer</span>
                }
              </div>
              <div className="flex items-center justify-center w-full">
                {isAnswered
                  ? <button onClick={nextQuestion} className="w-full sm:w-auto bg-blue-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2">Next Question <ChevronsRight size={20} /></button>
                  : <button onClick={checkAnswer} disabled={userAnswer === null} className="w-full sm:w-auto bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-transform transform hover:scale-105 disabled:bg-gray-400 disabled:cursor-not-allowed">Check Answer</button>
                }
              </div>
            </div>
          </div>
          <div className="text-center mt-4"><p className="text-xs text-gray-400">CA Standard: {currentQuestion.standard}</p></div>
        </div>
      </>
    );
  };

  const renderResults = () => {
    const percentage = Math.round((score / currentQuiz.length) * 100);
    let message = ''; let emoji = '';
    if (percentage === 100) { message = "Perfect Score! You're a Math Genius!"; emoji = '🏆'; }
    else if (percentage >= 80) { message = "Excellent Work! You really know your stuff!"; emoji = '🎉'; }
    else if (percentage >= 60) { message = "Good Job! Keep practicing!"; emoji = '👍'; }
    else { message = "Nice try! Don't give up, practice makes perfect!"; emoji = '🧠'; }

    // Check if user can create a story for this topic today
    const today = getTodayDateString();
    const todaysStories = userData?.dailyStories?.[today] || {};
    const canCreateStory = !todaysStories[currentTopic] && !storyCreatedForCurrentQuiz;

    // Check if current topic has reached daily goal and some topics are still not complete
    const { availableTopics, topicStats } = getTopicAvailability(userData, userData.dailyGoal);
    const currentTopicStats = topicStats?.find(t => t.topic === currentTopic);
    const isCurrentTopicCompleted = currentTopicStats?.completed || false;
    const hasIncompleteTopics = availableTopics.length > 0;
    const shouldGreyOutTryAgain = isCurrentTopicCompleted && hasIncompleteTopics;

    return (
      <div className="text-center bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-xl max-w-md mx-auto mt-20">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Quiz Complete!</h2>
        <div className="text-6xl mb-4">{emoji}</div>
        <p className="text-xl text-gray-600 mb-2">{message}</p>
        <p className="text-2xl font-bold text-blue-600 mb-6">You scored {score} out of {currentQuiz.length} ({percentage}%)</p>
        {feedback && (
          <div className={`p-4 rounded-lg mb-4 text-center font-semibold ${feedback.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {feedback.message}
          </div>
        )}
        <div className="flex flex-col gap-4 justify-center">
            {canCreateStory ? (
              <button onClick={handleCreateStoryProblem} className="bg-purple-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-purple-700 transition-transform transform hover:scale-105 flex items-center justify-center gap-2">
                <Sparkles size={20} /> Create a Story Problem
              </button>
            ) : (
              <div className="bg-gray-100 text-gray-600 font-medium py-3 px-6 rounded-lg flex flex-col items-center justify-center gap-1">
                <div className="flex items-center gap-2">
                  <Sparkles size={20} /> Story Problem Unavailable
                </div>
                <div className="text-sm text-gray-500">
                  {todaysStories[currentTopic] 
                    ? `You've already created a story for ${currentTopic} today!` 
                    : "You've already created a story for this quiz!"}
                </div>
              </div>
            )}
            {shouldGreyOutTryAgain ? (
              <div className="bg-gray-300 text-gray-500 font-bold py-3 px-6 rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                <span>Try Again</span>
                <span className="text-xs">(Complete other topics first)</span>
              </div>
            ) : (
              <button onClick={() => { startNewQuiz(currentTopic); }} className="bg-blue-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-700 transition-transform transform hover:scale-105">Try Again</button>
            )}
            <button onClick={returnToTopics} className="bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg hover:bg-gray-300 transition-transform transform hover:scale-105">Choose New Topic</button>
        </div>
      </div>
    );
  };
  
  const renderModal = () => {
    if (!showModal) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl max-w-4xl w-full p-6 relative flex flex-col max-h-[85vh]">
                <div className='flex-shrink-0'>
                    <button onClick={() => {
                        setShowModal(false);
                        // Reset story state when modal is closed
                        if (modalTitle === '✨ A Fun Story Problem!') {
                            setStoryData(null);
                            setShowStoryHint(false);
                            setShowStoryAnswer(false);
                        }
                    }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700">
                        <X size={24} />
                    </button>
                    <h3 className="text-2xl font-bold text-gray-800 mb-4">{modalTitle}</h3>
                </div>
                <div className="flex-grow overflow-hidden">
                    {isGenerating && (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                        </div>
                    )}
                    {generatedContent && modalTitle === '✨ A Fun Story Problem!' && storyData ? (
                        <div className="space-y-6">
                            {/* Story Section */}
                            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
                                <h4 className="font-bold text-blue-800 mb-2">📖 The Story</h4>
                                <p className="text-gray-700">{storyData.story}</p>
                            </div>
                            
                            {/* Question Section */}
                            <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
                                <h4 className="font-bold text-green-800 mb-2">❓ The Question</h4>
                                <p className="text-gray-700">{storyData.question}</p>
                            </div>
                            
                            {/* Hint Section */}
                            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-yellow-800">💡 Hint</h4>
                                    <button 
                                        onClick={() => setShowStoryHint(!showStoryHint)}
                                        className="bg-yellow-500 text-white px-3 py-1 rounded text-sm hover:bg-yellow-600 transition"
                                    >
                                        {showStoryHint ? 'Hide Hint' : 'Show Hint'}
                                    </button>
                                </div>
                                {showStoryHint && (
                                    <p className="text-gray-700">{storyData.hint}</p>
                                )}
                            </div>
                            
                            {/* Answer Section */}
                            <div className="bg-purple-50 p-4 rounded-lg border-l-4 border-purple-500">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-bold text-purple-800">✅ Answer</h4>
                                    <button 
                                        onClick={() => setShowStoryAnswer(!showStoryAnswer)}
                                        className="bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600 transition"
                                    >
                                        {showStoryAnswer ? 'Hide Answer' : 'Check Answer'}
                                    </button>
                                </div>
                                {showStoryAnswer && (
                                    <p className="text-gray-700 font-semibold">{storyData.answer}</p>
                                )}
                            </div>
                        </div>
                    ) : generatedContent ? (
                        <div 
                            className="text-gray-700 whitespace-pre-wrap leading-relaxed h-full"
                            dangerouslySetInnerHTML={{ __html: generatedContent }}
                        />
                    ) : null}
                </div>
            </div>
        </div>
    );
  }

  const renderResumeModal = () => {
    if (!showResumeModal) return null;
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50">
        <div className="bg-white/50 backdrop-blur-sm rounded-2xl shadow-xl max-w-sm w-full p-8 text-center">
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
