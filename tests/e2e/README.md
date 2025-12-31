# E2E Test Helpers

## Firebase Auth Rate Limiting

The E2E tests use Firebase Auth with anonymous sign-in. When running multiple tests in parallel, Firebase may rate limit authentication requests. The `auth-helpers.js` module provides utilities to handle these rate limiting scenarios.

### Features

- **Automatic Retry**: Retries failed auth operations with exponential backoff
- **Rate Limit Detection**: Identifies Firebase Auth rate limiting errors
- **Delayed Navigation**: Adds delays between tests to reduce concurrent auth requests
- **Error Tracking**: Monitors console errors for auth-related issues

### Usage

Import the helpers in your test files:

```javascript
import { navigateAndWaitForAuth, delayBetweenTests } from './auth-helpers';
```

Use `navigateAndWaitForAuth` instead of `page.goto()` in your `beforeEach` hooks:

```javascript
test.beforeEach(async ({ page }) => {
  await navigateAndWaitForAuth(page, '/', {
    timeout: 60000,
    maxRetries: 5,
    initialDelay: 2000,
  });
  
  // Add a small delay between tests
  await delayBetweenTests(500);
});
```

### Configuration Options

- `timeout`: Maximum time to wait for auth (default: 60000ms)
- `maxRetries`: Maximum number of retry attempts (default: 5)
- `initialDelay`: Initial delay before first retry (default: 2000ms)
- `maxDelay`: Maximum delay between retries (default: 30000ms)
- `backoffFactor`: Multiplier for exponential backoff (default: 2)

### Firebase Auth Error Codes Handled

The following error codes trigger retry logic:
- `auth/too-many-requests`
- `auth/quota-exceeded`
- `auth/network-request-failed`
- `auth/internal-error`

### Playwright Configuration

The Playwright config has been adjusted to reduce parallelism:
- Workers reduced from 8 to 2 (local) or 1 (CI)
- Test timeout increased to 60 seconds
- Retries enabled (1 local, 2 CI)

This helps prevent hitting Firebase Auth rate limits when running tests in parallel.

