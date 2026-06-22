import React, { createRef } from 'react';
import { render } from '@testing-library/react';

// firebase.js calls getAuth(app) at module load. Without the Firebase API
// key in env, that throws before any test runs. Stub the SDK + the app's
// firebase module so QuizResults' import chain doesn't touch real auth.
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  connectAuthEmulator: jest.fn(),
}));
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  connectFirestoreEmulator: jest.fn(),
  collection: jest.fn(),
  doc: jest.fn(),
}));
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));
jest.mock('../../firebase', () => ({
  app: {},
  auth: {},
  db: {},
  getStorageLazy: jest.fn(),
}));

jest.mock('../../services/topicAvailability', () => ({
  getTopicAvailability: () => ({
    availableTopics: [],
    topicStats: [],
  }),
}));

const QuizResults = require('../QuizResults').default;

describe('QuizResults', () => {
  it('attaches the math-render container ref to the results card', () => {
    const resultsContainerRef = createRef();

    render(
      <QuizResults
        score={0}
        currentQuiz={[{ correctAnswer: '3 \\(\\frac{2}{3}\\)' }]}
        userData={{}}
        selectedGrade="G4"
        currentTopic="Fractions 4th"
        storyCreatedForCurrentQuiz={false}
        feedback={{
          type: 'error',
          message: 'Not quite. The correct answer is 3 \\(\\frac{2}{3}\\).',
        }}
        handleCreateStoryProblem={jest.fn()}
        startNewQuiz={jest.fn()}
        navigateApp={jest.fn()}
        returnToTopics={jest.fn()}
        resultsContainerRef={resultsContainerRef}
      />
    );

    expect(resultsContainerRef.current).toBeInTheDocument();
    expect(resultsContainerRef.current).toHaveTextContent(
      'Not quite. The correct answer is 3 \\(\\frac{2}{3}\\).'
    );
  });
});
