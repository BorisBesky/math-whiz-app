export const storeTutorial = {
  id: 'store',
  title: 'Rewards Store',
  description: 'Learn how to use your coins to purchase new backgrounds and customize your experience.',
  steps: [
    {
      title: 'Store Overview',
      description: 'Welcome to the Rewards Store! Here you can spend your coins to buy new backgrounds for your learning experience.',
      targetSelector: '[data-tutorial-id="store-title"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Earning Coins',
      description: 'You earn coins by completing practice questions correctly. The coins you\'ve earned are shown in the navigation menu.',
      targetSelector: '[data-tutorial-id="store-description"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Browse Backgrounds',
      description: 'Browse through different background themes below. Each item shows a preview image and the price in coins.',
      targetSelector: '[data-tutorial-id="store-items"]',
      position: 'top',
      action: 'highlight'
    },
    {
      title: 'Purchase Items',
      description: 'Click "Buy" on any item to purchase it with your coins. Make sure you have enough coins! Once purchased, you can activate it anytime.',
      targetSelector: '[data-tutorial-id="store-items"]',
      position: 'top',
      action: 'highlight'
    },
    {
      title: 'Navigation',
      description: 'Use the navigation menu at the top to return to topic selection, view your dashboard, or access other features. Happy shopping!',
      targetSelector: '[data-tutorial-id="navigation-menu"]',
      position: 'bottom',
      action: 'highlight'
    }
  ]
};
