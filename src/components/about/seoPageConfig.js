import React from 'react';

export const SEO_PAGES = [
  {
    slug: 'best-math-app-3rd-grade',
    tabLabel: '3rd Grade',
    title: 'Best Math App for 3rd Graders — Free & Adaptive | Math Whiz',
    metaDescription:
      'Looking for the best math app for 3rd graders? Math Whiz offers adaptive practice in multiplication, division, fractions, and geometry — aligned to Common Core standards.',
    keyword: 'best math app for 3rd graders',
    component: React.lazy(() => import('./pages/BestMathApp3rdGrade')),
  },
  {
    slug: 'best-math-app-4th-grade',
    tabLabel: '4th Grade',
    title: 'Best Math App for 4th Graders — Free & Adaptive | Math Whiz',
    metaDescription:
      'Find the best math app for 4th graders. Math Whiz covers multi-digit multiplication, fractions, geometry, and measurement with adaptive difficulty and teacher dashboards.',
    keyword: 'best math app for 4th graders',
    component: React.lazy(() => import('./pages/BestMathApp4thGrade')),
  },
  {
    slug: 'math-practice-app-3rd-grade',
    tabLabel: 'Practice',
    title: 'Math Practice App for 3rd Grade — Daily Practice That Works | Math Whiz',
    metaDescription:
      'Help your 3rd grader build math fluency with daily adaptive practice. Math Whiz covers multiplication, division, fractions, and more with progress tracking.',
    keyword: 'math practice app 3rd grade',
    component: React.lazy(() => import('./pages/MathPracticeApp3rdGrade')),
  },
  {
    slug: 'teacher-dashboard',
    tabLabel: 'Teacher Dashboard',
    title: 'Math App with Teacher Dashboard — Class Management & Analytics | Math Whiz',
    metaDescription:
      'Manage your math classroom with real-time analytics, per-student assignments, custom content, and AI question generation. Free teacher dashboard included.',
    keyword: 'math app with teacher dashboard',
    component: React.lazy(() => import('./pages/TeacherDashboard')),
  },
  {
    slug: 'standards-aligned-math-app',
    tabLabel: 'Standards',
    title: 'Standards-Aligned Math App for Elementary — Common Core | Math Whiz',
    metaDescription:
      'Every question in Math Whiz maps to Common Core standards for 3rd and 4th grade math. See exactly which standards your students are practicing.',
    keyword: 'standards-aligned math app elementary',
    component: React.lazy(() => import('./pages/StandardsAlignedMathApp')),
  },
  {
    slug: 'multiplication-practice-3rd-grade',
    tabLabel: 'Multiplication',
    title: 'Multiplication Practice App for 3rd Grade — Build Fluency | Math Whiz',
    metaDescription:
      'Help your 3rd grader master multiplication with adaptive practice, arrays, word problems, and visual tools. Free multiplication app aligned to Common Core.',
    keyword: 'multiplication practice app 3rd grade',
    component: React.lazy(() => import('./pages/MultiplicationPractice3rdGrade')),
  },
  {
    slug: 'fractions-app-for-kids',
    tabLabel: 'Fractions',
    title: 'Fractions App for Kids — Visual & Adaptive Practice | Math Whiz',
    metaDescription:
      'Make fractions click for your child. Math Whiz uses visual models, adaptive difficulty, and step-by-step explanations to build real fraction understanding.',
    keyword: 'fractions app for kids',
    component: React.lazy(() => import('./pages/FractionsAppForKids')),
  },
  {
    slug: 'fun-math-app-elementary',
    tabLabel: 'Fun Math',
    title: 'Fun Math App for Elementary School — Rewards & Drawing | Math Whiz',
    metaDescription:
      'Math practice that kids actually enjoy. Earn coins, unlock rewards, draw your work, and level up with adaptive challenges. Free for elementary students.',
    keyword: 'fun math app elementary school',
    component: React.lazy(() => import('./pages/FunMathAppElementary')),
  },
  {
    slug: 'free-math-practice-app',
    tabLabel: 'Free',
    title: 'Free Math Practice App for Elementary — No Ads, No Limits | Math Whiz',
    metaDescription:
      'Math Whiz is 100% free with no ads, no paywalls, and no limits. Full access to adaptive practice, teacher tools, and all topics for 3rd and 4th graders.',
    keyword: 'free math practice app elementary',
    component: React.lazy(() => import('./pages/FreeMathPracticeApp')),
  },
  {
    slug: 'adaptive-math-app',
    tabLabel: 'Adaptive',
    title: 'Adaptive Math App for Kids — Personalized Practice | Math Whiz',
    metaDescription:
      'Math Whiz adapts to your child\'s level in real time. Questions get harder as they improve and easier when they struggle — no frustration, no boredom.',
    keyword: 'adaptive math app for kids',
    component: React.lazy(() => import('./pages/AdaptiveMathAppForKids')),
  },
  {
    slug: 'common-core-math-app',
    tabLabel: 'Common Core',
    title: 'Common Core Math App for 3rd & 4th Grade | Math Whiz',
    metaDescription:
      'Every Math Whiz question maps to specific Common Core standards. See topic-by-standard breakdowns for 3rd and 4th grade math.',
    keyword: 'common core math app 3rd 4th grade',
    component: React.lazy(() => import('./pages/CommonCoreMathApp')),
  },
  {
    slug: 'math-app-with-rewards',
    tabLabel: 'Rewards',
    title: 'Math App with Rewards for Kids — Coins & Store | Math Whiz',
    metaDescription:
      'Kids earn coins for correct answers and spend them in the store. Math Whiz uses rewards to keep students motivated without pay-to-win mechanics.',
    keyword: 'math app with rewards for kids',
    component: React.lazy(() => import('./pages/MathAppWithRewards')),
  },
  {
    slug: 'division-practice-3rd-grade',
    tabLabel: 'Division',
    title: 'Division Practice App for 3rd Grade — Master the Basics | Math Whiz',
    metaDescription:
      'Build division fluency for 3rd graders with adaptive practice, word problems, and visual tools. Connects division to multiplication for deeper understanding.',
    keyword: 'division practice app 3rd grade',
    component: React.lazy(() => import('./pages/DivisionPractice3rdGrade')),
  },
];

export function getPageBySlug(slug) {
  return SEO_PAGES.find((p) => p.slug === slug) || null;
}
