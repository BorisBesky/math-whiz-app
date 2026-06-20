import React, { createRef } from 'react';
import { render } from '@testing-library/react';
import QuizResults from '../QuizResults';

jest.mock('../../services/topicAvailability', () => ({
  getTopicAvailability: () => ({
    availableTopics: [],
    topicStats: [],
  }),
}));

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
