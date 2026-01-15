/**
 * Lighthouse CI Configuration
 * Performance testing and budgets for Math Whiz App
 */

module.exports = {
  ci: {
    collect: {
      // Run against the local development server
      url: ['http://localhost:3000/'],
      startServerCommand: 'npm start',
      startServerReadyPattern: 'compiled successfully',
      startServerReadyTimeout: 60000,
      numberOfRuns: 3,
      settings: {
        // Chrome flags for CI environment
        chromeFlags: '--no-sandbox --disable-gpu --headless',
        // Throttling settings (simulate mobile 4G)
        throttlingMethod: 'devtools',
        throttling: {
          cpuSlowdownMultiplier: 4,
          downloadThroughputKbps: 1600,
          uploadThroughputKbps: 768,
          rttMs: 150,
        },
        // Only run performance-related audits for speed
        onlyCategories: ['performance', 'accessibility', 'best-practices'],
        // Skip audits that require authentication
        skipAudits: ['uses-http2', 'is-on-https'],
      },
    },
    assert: {
      // Performance budgets - these are starting thresholds
      // Adjust based on your app's actual performance
      assertions: {
        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['warn', { maxNumericValue: 500 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],

        // Performance score (0-1 scale)
        'categories:performance': ['warn', { minScore: 0.5 }],
        'categories:accessibility': ['warn', { minScore: 0.7 }],
        'categories:best-practices': ['warn', { minScore: 0.7 }],

        // Resource hints
        'uses-rel-preconnect': 'warn',
        'uses-rel-preload': 'off',

        // Images
        'uses-webp-images': 'warn',
        'uses-optimized-images': 'warn',
        'offscreen-images': 'warn',

        // JavaScript
        'unused-javascript': 'warn',
        'unminified-javascript': 'error',
        'legacy-javascript': 'warn',

        // CSS
        'unused-css-rules': 'warn',
        'unminified-css': 'error',

        // Network
        'render-blocking-resources': 'warn',
        'uses-text-compression': 'warn',
        'efficient-animated-content': 'warn',

        // DOM
        'dom-size': ['warn', { maxNumericValue: 1500 }],

        // Fonts
        'font-display': 'warn',
      },
    },
    upload: {
      // Upload results to temporary public storage (optional)
      target: 'temporary-public-storage',
    },
  },
};
