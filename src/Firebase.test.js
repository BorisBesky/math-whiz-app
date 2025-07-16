// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
console.log('firebaseConfig', process.env.REACT_APP_FIREBASE_CONFIG);
const app = initializeApp(firebaseConfig);

test('firebaseConfig is defined', () => {
  expect(firebaseConfig).toBeDefined();
});

test('Firebase app is defined', () => {
  expect(app).toBeDefined();
});

test('Firebase auth is defined', () => {
  const auth = getAuth(app);
  expect(auth).toBeDefined();
});

test('Firebase firestore is defined', () => {
  const db = getFirestore(app);
  expect(db).toBeDefined();
});