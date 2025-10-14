import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const TutorialContext = createContext();

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

export const TutorialProvider = ({ children }) => {
  const [activeTutorial, setActiveTutorial] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [tutorialsCompleted, setTutorialsCompleted] = useState({});
  const [tutorialsSkipped, setTutorialsSkipped] = useState({});

  // Load tutorial state from localStorage on mount
  useEffect(() => {
    const loadTutorialState = () => {
      try {
        const completed = localStorage.getItem('tutorials_completed');
        const skipped = localStorage.getItem('tutorials_skipped');
        
        if (completed) {
          setTutorialsCompleted(JSON.parse(completed));
        }
        if (skipped) {
          setTutorialsSkipped(JSON.parse(skipped));
        }
      } catch (error) {
        console.error('Error loading tutorial state:', error);
      }
    };

    loadTutorialState();
  }, []);

  // Save tutorial state to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('tutorials_completed', JSON.stringify(tutorialsCompleted));
    } catch (error) {
      console.error('Error saving completed tutorials:', error);
    }
  }, [tutorialsCompleted]);

  useEffect(() => {
    try {
      localStorage.setItem('tutorials_skipped', JSON.stringify(tutorialsSkipped));
    } catch (error) {
      console.error('Error saving skipped tutorials:', error);
    }
  }, [tutorialsSkipped]);

  const startTutorial = useCallback((tutorialId, tutorialConfig) => {
    setActiveTutorial({ id: tutorialId, config: tutorialConfig });
    setCurrentStep(0);
    setIsVisible(true);
  }, []);

  const nextStep = useCallback(() => {
    if (activeTutorial && currentStep < activeTutorial.config.steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [activeTutorial, currentStep]);

  const previousStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const endTutorial = useCallback(() => {
    setActiveTutorial(null);
    setCurrentStep(0);
    setIsVisible(false);
  }, []);

  const skipTutorial = useCallback(() => {
    if (activeTutorial) {
      setTutorialsSkipped(prev => ({
        ...prev,
        [activeTutorial.id]: true
      }));
      endTutorial();
    }
  }, [activeTutorial, endTutorial]);

  const completeTutorial = useCallback(() => {
    if (activeTutorial) {
      setTutorialsCompleted(prev => ({
        ...prev,
        [activeTutorial.id]: true
      }));
      endTutorial();
    }
  }, [activeTutorial, endTutorial]);

  const isTutorialCompleted = useCallback((tutorialId) => {
    return tutorialsCompleted[tutorialId] === true;
  }, [tutorialsCompleted]);

  const isTutorialSkipped = useCallback((tutorialId) => {
    return tutorialsSkipped[tutorialId] === true;
  }, [tutorialsSkipped]);

  const shouldShowTutorial = useCallback((tutorialId) => {
    return !isTutorialCompleted(tutorialId) && !isTutorialSkipped(tutorialId);
  }, [isTutorialCompleted, isTutorialSkipped]);

  const resetTutorial = useCallback((tutorialId) => {
    setTutorialsCompleted(prev => {
      const newState = { ...prev };
      delete newState[tutorialId];
      return newState;
    });
    setTutorialsSkipped(prev => {
      const newState = { ...prev };
      delete newState[tutorialId];
      return newState;
    });
  }, []);

  const getCurrentStep = useCallback(() => {
    if (!activeTutorial || !activeTutorial.config.steps[currentStep]) {
      return null;
    }
    return activeTutorial.config.steps[currentStep];
  }, [activeTutorial, currentStep]);

  const getProgress = useCallback(() => {
    if (!activeTutorial) return { current: 0, total: 0 };
    return {
      current: currentStep + 1,
      total: activeTutorial.config.steps.length
    };
  }, [activeTutorial, currentStep]);

  const value = {
    // State
    activeTutorial,
    currentStep,
    isVisible,
    tutorialsCompleted,
    tutorialsSkipped,
    
    // Actions
    startTutorial,
    nextStep,
    previousStep,
    skipTutorial,
    completeTutorial,
    endTutorial,
    
    // Utilities
    isTutorialCompleted,
    isTutorialSkipped,
    shouldShowTutorial,
    resetTutorial,
    getCurrentStep,
    getProgress,
  };

  return (
    <TutorialContext.Provider value={value}>
      {children}
    </TutorialContext.Provider>
  );
};
