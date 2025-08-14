import { render, screen } from '@testing-library/react';
import App from './App';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, onSnapshot } from 'firebase/firestore';

jest.mock('firebase/auth');
jest.mock('firebase/firestore');

test('renders learn react link', async () => {
  const mockUser = { uid: 'test-uid' };
  const mockUserData = {
    coins: 100,
    dailyGoals: {
      Multiplication: 5,
      Division: 5,
      Fractions: 5,
      'Measurement & Data': 5,
    },
    progress: { '2025-01-01': { all: { correct: 0, incorrect: 0, timeSpent: 0 } } },
    pausedQuizzes: {},
    ownedBackgrounds: ['default'],
    activeBackground: 'default',
    dailyStories: { '2025-01-01': {} },
    answeredQuestions: [],
  };

  onAuthStateChanged.mockImplementation((auth, callback) => {
    callback(mockUser);
    return () => {};
  });

  onSnapshot.mockImplementation((docRef, callback) => {
    callback({
      exists: () => true,
      data: () => mockUserData,
    });
    return () => {};
  });

  render(<App />);
  const linkElement = await screen.findByText(/Choose a topic to start your 3rd Grade math adventure!/i);
  expect(linkElement).toBeInTheDocument();
});
