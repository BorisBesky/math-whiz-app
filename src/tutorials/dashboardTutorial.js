export const dashboardTutorial = {
  id: 'dashboard',
  title: 'Dashboard Overview',
  description: 'Learn how to track your progress and manage your daily goals.',
  steps: [
    {
      title: 'Welcome to Your Dashboard',
      description: 'This is your personal dashboard where you can track your learning progress and manage your daily practice goals.',
      targetSelector: '[data-tutorial-id="dashboard-title"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Daily Goals',
      description: 'Set your daily practice goals for each topic. Completing these goals earns you coins and helps track your progress! You can adjust goals anytime.',
      targetSelector: '[data-tutorial-id="daily-goals"]',
      position: 'top',
      action: 'highlight'
    },
    {
      title: 'Progress Statistics',
      description: 'View your daily performance including total questions answered, accuracy rate, and average time per question. Track your improvement over time!',
      targetSelector: '[data-tutorial-id="progress-stats"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Navigation',
      description: 'Use the navigation menu at the top to return to topic selection, visit the store, or access other features. Keep up the great work!',
      targetSelector: '[data-tutorial-id="navigation-menu"]',
      position: 'bottom',
      action: 'highlight'
    }
  ]
};
