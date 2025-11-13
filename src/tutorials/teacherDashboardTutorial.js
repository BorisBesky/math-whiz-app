export const teacherDashboardTutorial = {
  id: 'teacherDashboard',
  title: 'Welcome to Teacher Dashboard!',
  description: 'Let\'s explore your teacher dashboard and learn how to manage your classes and track student progress.',
  steps: [
    {
      title: 'Welcome to Teacher Dashboard',
      description: 'This is your central hub for managing classes, tracking student progress, and monitoring learning outcomes.',
      targetSelector: '[data-tutorial-id="dashboard-header"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Overview Statistics',
      description: 'View key metrics about your students\' performance, including total students, daily activity, and overall progress.',
      targetSelector: '[data-tutorial-id="overview-stats"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Navigation Tabs',
      description: 'Switch between different views: Overview for stats, Students for individual progress, and Classes for class management.',
      targetSelector: '[data-tutorial-id="navigation-tabs"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'Create New Class',
      description: 'Click here to create a new class. You\'ll get a class code that students can use to join your class.',
      targetSelector: '[data-tutorial-id="create-class-button"]',
      position: 'bottom',
      action: 'highlight',
      requiredView: 'classes'
    },
    {
      title: 'Classes List',
      description: 'View all your classes here. Click on any class to see detailed information and manage students.',
      targetSelector: '[data-tutorial-id="classes-list"]',
      position: 'bottom',
      action: 'highlight',
      requiredView: 'classes'
    },
    {
      title: 'Student Management',
      description: 'In the Students tab, you can view all students across your classes, track their progress, and manage their learning goals.',
      targetSelector: '[data-tutorial-id="students-tab"]',
      position: 'bottom',
      action: 'highlight',
      requiredView: 'students'
    },
    {
      title: 'Student Progress Tracking',
      description: 'Monitor individual student performance, see their accuracy rates, questions answered, and topic mastery levels.',
      targetSelector: '[data-tutorial-id="student-progress"]',
      position: 'bottom',
      action: 'highlight',
      requiredView: 'students'
    },
    {
      title: 'Class Analytics',
      description: 'View detailed analytics for each class, including average performance, topic coverage, and student engagement.',
      targetSelector: '[data-tutorial-id="class-analytics"]',
      position: 'bottom',
      action: 'highlight',
      requiredView: 'classes'
    },
    {
      title: 'Export Data',
      description: 'Export student progress data and class reports for record-keeping and parent communication.',
      targetSelector: '[data-tutorial-id="export-button"]',
      position: 'bottom',
      action: 'highlight',
      requiredView: 'students'
    },
    {
      title: 'Settings & Profile',
      description: 'Access your teacher profile, manage account settings, and configure class preferences.',
      targetSelector: '[data-tutorial-id="teacher-settings"]',
      position: 'bottom',
      action: 'highlight'
    },
    {
      title: 'You\'re Ready to Teach!',
      description: 'You now know how to use the Teacher Dashboard! Create your first class and start tracking your students\' math learning journey.',
      targetSelector: '[data-tutorial-id="dashboard-header"]',
      position: 'bottom',
      action: 'highlight'
    }
  ]
};
