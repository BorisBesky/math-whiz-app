export const mainAppTutorial = {
  id: 'mainApp',
  title: 'Welcome to Math Whiz!',
  description: 'Let\'s take a quick tour to help you get started with your math learning journey.',
  steps: [
    {
      title: 'Welcome to Math Whiz!',
      description: 'Welcome to your personalized math learning platform! This tutorial will show you all the key features to help you succeed in math.',
      targetSelector: '[data-tutorial-id="welcome-header"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Choose Your Topic',
      description: 'Start by selecting a math topic you want to practice. Each topic has different difficulty levels and will help you master specific skills.',
      targetSelector: '[data-tutorial-id="topic-selection"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Navigation Menu',
      description: 'Use this menu to navigate between different sections of the app, including your progress, store, and help resources.',
      targetSelector: '[data-tutorial-id="navigation-menu"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Settings & Profile',
      description: 'Click to create an account and save your progress!',
      targetSelector: '[data-tutorial-id="settings-menu"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Store & Rewards',
      description: 'Earn coins by completing questions and use them to buy fun backgrounds and rewards in the store!',
      targetSelector: '[data-tutorial-id="store-button"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Dashboard',
      description: 'View your daily progress and goals in the dashboard!',
      targetSelector: '[data-tutorial-id="dashboard-button"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Home',
      description: 'Click to return to the topic selection page!',
      targetSelector: '[data-tutorial-id="return-to-topics-button"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Logout',
      description: 'Click to logout of your account and return to the login page!',
      targetSelector: '[data-tutorial-id="logout-button"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Ready to Start!',
      description: 'Now that you know the basics, click on any topic to begin your math learning adventure. You\'ll discover more features as you progress!',
      targetSelector: '[data-tutorial-id="topic-selection"]',
      position: 'top',
      action: 'highlight'
    }
  ]
};
