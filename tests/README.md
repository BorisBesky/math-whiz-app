# Math Whiz App - Testing Guide

This document provides comprehensive documentation for the testing infrastructure, patterns, and best practices used in the Math Whiz application.

## Table of Contents

- [Overview](#overview)
- [Test Types](#test-types)
- [Running Tests](#running-tests)
- [Test Structure](#test-structure)
- [Writing New Tests](#writing-new-tests)
- [Mocking Patterns](#mocking-patterns)
- [CI/CD Integration](#cicd-integration)
- [Performance Testing](#performance-testing)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Math Whiz App uses a comprehensive testing strategy with multiple test types:

| Test Type | Framework | Location | Purpose |
|-----------|-----------|----------|---------|
| Unit Tests | Jest | `src/**/__tests__/` | Test individual functions and components |
| Integration Tests | Jest | `src/**/__tests__/*.integration.test.js` | Test component interactions with Firebase |
| E2E Tests | Playwright | `tests/e2e/` | Test complete user flows in browser |
| Contract Tests | Jest | `tests/api/` | Test API endpoint contracts |
| Snapshot Tests | Jest | `src/**/__tests__/*.snapshot.test.js` | Test UI visual consistency |
| Performance Tests | Lighthouse CI | `lighthouserc.js` | Test Core Web Vitals |

---

## Test Types

### Unit Tests

Unit tests verify individual functions and components in isolation.

**Location:** `src/**/__tests__/*.test.js`

**Examples:**
- `src/utils/__tests__/answer-helpers.test.js` - Answer validation logic
- `src/utils/__tests__/complexityEngine.test.js` - Difficulty scoring algorithms
- `src/components/__tests__/NumberPad.test.js` - UI component behavior

### Integration Tests

Integration tests verify components work correctly with mocked external services.

**Location:** `src/**/__tests__/*.integration.test.js`

**Examples:**
- `src/components/__tests__/QuestionReviewModal.integration.test.js` - Modal with Firebase

### E2E Tests

End-to-end tests simulate real user interactions in a browser.

**Location:** `tests/e2e/*.spec.js`

**Examples:**
- `tests/e2e/student-quiz-flow.spec.js` - Complete student quiz experience
- `tests/e2e/sketch-overlay.spec.js` - Drawing canvas functionality
- `tests/e2e/logout-teacher.spec.js` - Teacher authentication flows

### Contract Tests

Contract tests verify API endpoints conform to expected request/response formats.

**Location:** `tests/api/*.contract.test.js`

**Examples:**
- `tests/api/gemini-proxy.contract.test.js` - Story problem generation API
- `tests/api/validate-drawing.contract.test.js` - Drawing validation API
- `tests/api/classes.contract.test.js` - Class management CRUD API

### Snapshot Tests

Snapshot tests capture UI component output to detect unintended changes.

**Location:** `src/**/__tests__/*.snapshot.test.js`

**Examples:**
- `src/components/__tests__/NumberPad.snapshot.test.js`
- `src/components/__tests__/WriteInInput.snapshot.test.js`
- `src/components/__tests__/JoinClass.snapshot.test.js`

---

## Running Tests

### Unit & Integration Tests

```bash
# Run all tests in watch mode
npm test

# Run with coverage report
npm run test:coverage

# Run in CI mode (no watch, with coverage)
npm run test:ci

# Run specific test file
npm test -- --testPathPattern="answer-helpers"

# Update snapshots
npm test -- --updateSnapshot
```

### E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with browser visible
npm run test:e2e:headed

# View HTML test report
npm run test:e2e:report

# Run specific test file
npx playwright test student-quiz-flow.spec.js

# Run in debug mode
npx playwright test --debug

# Run specific browser only
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
npx playwright test --project=mobile-chrome
npx playwright test --project=mobile-safari
```

### Performance Tests

```bash
# Run Lighthouse CI (requires build)
npm run build
npm run test:lighthouse

# Collect metrics only
npm run test:lighthouse:collect
```

### Code Quality

```bash
# Run ESLint
npm run lint
```

---

## Test Structure

### Directory Layout

```
math-whiz-app/
├── src/
│   ├── __tests__/                    # App-level tests
│   │   ├── App.test.js
│   │   ├── ProtectedRoute.test.js
│   │   └── resume.test.js
│   ├── components/
│   │   └── __tests__/                # Component tests
│   │       ├── NumberPad.test.js
│   │       ├── NumberPad.snapshot.test.js
│   │       └── QuestionReviewModal.integration.test.js
│   └── utils/
│       └── __tests__/                # Utility tests
│           ├── answer-helpers.test.js
│           ├── complexityEngine.test.js
│           └── profileUtils.test.js
├── tests/
│   ├── README.md                     # This file
│   ├── setupTests.js                 # Jest setup
│   ├── api/                          # API contract tests
│   │   ├── gemini-proxy.contract.test.js
│   │   ├── validate-drawing.contract.test.js
│   │   └── classes.contract.test.js
│   └── e2e/                          # Playwright E2E tests
│       ├── auth-helpers.js           # Auth utilities
│       ├── student-quiz-flow.spec.js
│       ├── sketch-overlay.spec.js
│       └── logout-teacher.spec.js
├── playwright.config.js              # Playwright configuration
└── lighthouserc.js                   # Lighthouse CI configuration
```

### Naming Conventions

| Pattern | Type | Example |
|---------|------|---------|
| `*.test.js` | Unit/Integration test | `NumberPad.test.js` |
| `*.integration.test.js` | Integration test | `QuestionReviewModal.integration.test.js` |
| `*.snapshot.test.js` | Snapshot test | `NumberPad.snapshot.test.js` |
| `*.spec.js` | E2E test (Playwright) | `student-quiz-flow.spec.js` |
| `*.contract.test.js` | API contract test | `gemini-proxy.contract.test.js` |

---

## Writing New Tests

### Unit Test Template

```javascript
/**
 * Tests for [Component/Function Name]
 * Description of what is being tested
 */

import { functionToTest } from '../path/to/module';

describe('functionToTest', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should handle normal case', () => {
    const result = functionToTest('input');
    expect(result).toBe('expected');
  });

  it('should handle edge case', () => {
    expect(() => functionToTest(null)).toThrow();
  });

  it('should handle async operations', async () => {
    const result = await functionToTest();
    expect(result).toBeDefined();
  });
});
```

### Component Test Template

```javascript
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders correctly', () => {
    render(<MyComponent value="" onChange={mockOnChange} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    render(<MyComponent value="" onChange={mockOnChange} />);
    fireEvent.click(screen.getByRole('button'));
    expect(mockOnChange).toHaveBeenCalledWith('newValue');
  });

  it('applies disabled state', () => {
    render(<MyComponent value="" onChange={mockOnChange} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

### E2E Test Template

```javascript
import { test, expect } from '@playwright/test';
import { navigateAndWaitForAuth, delayBetweenTests } from './auth-helpers.js';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await delayBetweenTests(500);
  });

  test('should complete user flow', async ({ page }) => {
    await navigateAndWaitForAuth(page, '/');

    // Interact with page
    await page.click('button:has-text("Start")');

    // Assert expected state
    await expect(page.locator('.result')).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate error condition
    await page.route('**/api/**', route => route.abort());

    await navigateAndWaitForAuth(page, '/');

    // Verify error handling
    await expect(page.locator('.error-message')).not.toBeVisible();
  });
});
```

### Snapshot Test Template

```javascript
import React from 'react';
import { render } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent Snapshots', () => {
  it('renders default state', () => {
    const { container } = render(<MyComponent />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('renders with props', () => {
    const { container } = render(<MyComponent value="test" active />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

---

## Mocking Patterns

### Firebase Mocking

```javascript
// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({
    currentUser: { uid: 'test-user-123', getIdToken: jest.fn().mockResolvedValue('token') }
  }))
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({
    exists: () => true,
    data: () => ({ coins: 100 })
  }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined)
}));
```

### API Response Mocking

```javascript
// Mock fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'mock response' })
  })
);
```

### Context Provider Mocking

```javascript
// Wrap component with necessary providers
const renderWithProviders = (ui) => {
  return render(
    <MemoryRouter>
      <AuthProvider>
        {ui}
      </AuthProvider>
    </MemoryRouter>
  );
};
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
name: Tests
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:ci

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e

  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - run: npm run test:lighthouse
```

---

## Performance Testing

### Lighthouse CI Configuration

Performance budgets are defined in `lighthouserc.js`:

| Metric | Threshold | Severity |
|--------|-----------|----------|
| First Contentful Paint | < 2000ms | Warning |
| Largest Contentful Paint | < 4000ms | Warning |
| Cumulative Layout Shift | < 0.1 | Warning |
| Total Blocking Time | < 500ms | Warning |
| Performance Score | > 50% | Warning |
| Accessibility Score | > 70% | Warning |

### Running Performance Tests

```bash
# Build the app first
npm run build

# Run Lighthouse CI
npm run test:lighthouse

# Results are uploaded to temporary public storage
# Check console output for report URL
```

---

## Troubleshooting

### Common Issues

#### Jest Tests Failing

**Problem:** Tests fail with module import errors

**Solution:** Check that mocks are properly set up at the top of the test file

```javascript
// Mocks must be hoisted - place before imports
jest.mock('firebase/firestore');

import { myFunction } from '../module';
```

#### E2E Tests Timing Out

**Problem:** Playwright tests timeout waiting for elements

**Solution:** Use the auth helpers which include retry logic for Firebase rate limiting

```javascript
import { navigateAndWaitForAuth } from './auth-helpers.js';

// This handles rate limiting automatically
await navigateAndWaitForAuth(page, '/');
```

#### Snapshot Tests Failing

**Problem:** Snapshots show unexpected changes

**Solution:** Review the changes carefully, then update if intentional

```bash
# Update all snapshots
npm test -- --updateSnapshot

# Update specific snapshot
npm test -- --testPathPattern="NumberPad" --updateSnapshot
```

#### Coverage Threshold Not Met

**Problem:** CI fails due to coverage threshold

**Solution:** Add tests for uncovered code or adjust thresholds in `package.json`

```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 20,
        "functions": 20,
        "lines": 20,
        "statements": 20
      }
    }
  }
}
```

### Debug Commands

```bash
# Run Jest in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run Playwright debug mode
npx playwright test --debug

# View Playwright traces
npx playwright show-trace path/to/trace.zip
```

---

## Best Practices

1. **Test behavior, not implementation** - Focus on what the code does, not how it does it

2. **Keep tests independent** - Each test should be able to run in isolation

3. **Use descriptive test names** - Names should describe the expected behavior

4. **Avoid test interdependence** - Don't rely on test execution order

5. **Mock external services** - Keep tests fast and reliable by mocking APIs

6. **Test edge cases** - Include tests for error conditions and boundary values

7. **Maintain test coverage** - Aim to test critical paths and business logic

8. **Review snapshot changes** - Don't blindly accept snapshot updates

---

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
