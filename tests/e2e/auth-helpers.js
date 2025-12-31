/**
 * Firebase Auth helpers for Playwright tests
 * Handles rate limiting and retries with exponential backoff
 */

/**
 * Firebase Auth error codes that indicate rate limiting or quota issues
 */
const RATE_LIMIT_ERROR_CODES = [
  'auth/too-many-requests',
  'auth/quota-exceeded',
  'auth/network-request-failed',
  'auth/internal-error',
];

/**
 * Check if an error is a rate limiting error
 */
function isRateLimitError(error) {
  if (!error) return false;
  
  const errorCode = error?.code || '';
  const errorMessage = error?.message || '';
  
  // Check error code
  if (RATE_LIMIT_ERROR_CODES.some(code => errorCode.includes(code))) {
    return true;
  }
  
  // Check error message for rate limiting indicators
  const rateLimitIndicators = [
    'too many requests',
    'too-many-requests',
    'auth/too-many-requests',
    'quota exceeded',
    'rate limit',
    'too many attempts',
    'quota',
    'network request failed',
  ];
  
  return rateLimitIndicators.some(indicator => 
    errorMessage.toLowerCase().includes(indicator.toLowerCase())
  );
}

/**
 * Wait for a specified amount of time
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff for rate limiting errors
 */
async function retryWithBackoff(fn, options = {}) {
  const {
    maxRetries = 5,
    initialDelay = 1000,
    maxDelay = 30000,
    backoffFactor = 2,
    onRetry = null,
  } = options;

  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Only retry on rate limiting errors
      if (!isRateLimitError(error)) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );
      
      if (onRetry) {
        onRetry(attempt + 1, maxRetries, delay, error);
      } else {
        console.log(
          `[Auth Retry] Attempt ${attempt + 1}/${maxRetries} after ${delay}ms (${error?.code || error?.message})`
        );
      }
      
      await wait(delay);
    }
  }
  
  throw lastError;
}

/**
 * Wait for Firebase Auth to be ready in the page
 * Handles rate limiting by retrying with backoff
 */
async function waitForAuthReady(page, options = {}) {
  const {
    timeout = 60000,
    maxRetries = 5,
    initialDelay = 2000,
  } = options;

  const startTime = Date.now();
  
  return retryWithBackoff(
    async () => {
      // Check if we've exceeded the overall timeout
      if (Date.now() - startTime > timeout) {
        throw new Error(`Auth ready check timed out after ${timeout}ms`);
      }

      // Wait for Firebase to initialize and attempt auth
      // Check for common indicators that auth is ready or failed
      try {
        // Wait for the app to load - check for topic selection UI or any app content
        const remainingTime = Math.max(5000, timeout - (Date.now() - startTime));
        
        try {
          await page.waitForSelector('[data-tutorial-id="topic-selection"]', {
            timeout: Math.min(remainingTime, 15000),
          });
        } catch (selectorError) {
          // Check if page is closed before trying to evaluate
          if (page.isClosed()) {
            throw new Error('Page was closed during auth wait');
          }
          
          // If selector times out, check for auth errors in console
          let consoleErrors = [];
          try {
            consoleErrors = await page.evaluate(() => {
              return window.__playwrightAuthErrors || [];
            });
          } catch (evalError) {
            // Page might have been closed during evaluate
            if (page.isClosed() || evalError.message.includes('closed')) {
              throw new Error('Page was closed during auth check');
            }
            // Re-throw other evaluation errors
            throw evalError;
          }
          
          // Check if we have actual rate limit errors in console
          if (consoleErrors.length > 0) {
            const rateLimitError = consoleErrors.find(err => 
              isRateLimitError({ message: err })
            );
            
            if (rateLimitError) {
              // We have a confirmed rate limit error
              const error = new Error(`Firebase Auth rate limit: ${rateLimitError}`);
              error.code = 'auth/too-many-requests';
              throw error;
            }
          }
          
          // If no rate limit error in console but selector failed,
          // wait a bit and try once more before giving up
          await wait(2000);
          
          // Check if page is still open before retrying
          if (page.isClosed()) {
            throw new Error('Page was closed during auth retry wait');
          }
          
          // Try one more time with shorter timeout
          try {
            await page.waitForSelector('[data-tutorial-id="topic-selection"]', {
              timeout: Math.min(remainingTime - 2000, 10000),
            });
          } catch (secondError) {
            // Check if page is closed
            if (page.isClosed()) {
              throw new Error('Page was closed during second auth attempt');
            }
            
            // If second attempt also fails, check console again
            let consoleErrors2 = [];
            try {
              consoleErrors2 = await page.evaluate(() => {
                return window.__playwrightAuthErrors || [];
              });
            } catch (evalError2) {
              // Page might have been closed
              if (page.isClosed() || evalError2.message.includes('closed')) {
                throw new Error('Page was closed during second auth check');
              }
              throw evalError2;
            }
            
            const rateLimitError2 = consoleErrors2.find(err => 
              isRateLimitError({ message: err })
            );
            
            if (rateLimitError2) {
              const error = new Error(`Firebase Auth rate limit: ${rateLimitError2}`);
              error.code = 'auth/too-many-requests';
              throw error;
            }
            
            // Re-throw the original selector error if no rate limit detected
            throw selectorError;
          }
        }
        
        // Check for auth errors in console after successful load
        if (!page.isClosed()) {
          try {
            const consoleErrors = await page.evaluate(() => {
              return window.__playwrightAuthErrors || [];
            });
            
            const rateLimitErrors = consoleErrors.filter(err => 
              isRateLimitError({ message: err })
            );
            
            if (rateLimitErrors.length > 0) {
              throw new Error(`Firebase Auth rate limit detected: ${rateLimitErrors[0]}`);
            }
          } catch (evalError) {
            // If page was closed, that's a different issue
            if (page.isClosed() || evalError.message.includes('closed')) {
              throw new Error('Page was closed after successful load');
            }
            throw evalError;
          }
        }
        
        return true;
      } catch (error) {
        // If it's a rate limit error, throw it so retry logic can handle it
        if (isRateLimitError(error)) {
          throw error;
        }
        
        // For timeout errors, check if they might be caused by rate limiting
        if (error.message.includes('timeout') || error.message.includes('Timeout')) {
          // Check if page is closed
          if (page.isClosed()) {
            throw new Error('Page was closed during timeout');
          }
          
          // Check if we're still within the overall timeout
          if (Date.now() - startTime < timeout) {
            // Check if page has loaded any content - if not, might be auth rate limiting
            let pageInfo;
            try {
              pageInfo = await page.evaluate(() => {
                const bodyText = document.body?.textContent?.trim() || '';
                return {
                  hasContent: bodyText.length > 0,
                  contentLength: bodyText.length,
                  hasTopicSelection: !!document.querySelector('[data-tutorial-id="topic-selection"]'),
                };
              });
            } catch (evalError) {
              // Page might have been closed
              if (page.isClosed() || evalError.message.includes('closed')) {
                throw new Error('Page was closed during page info check');
              }
              throw evalError;
            }
            
            // If page has no content or minimal content, might be stuck on auth
            // Also check if we're specifically waiting for topic selection (auth-dependent)
            if (!pageInfo.hasContent || (pageInfo.contentLength < 100 && !pageInfo.hasTopicSelection)) {
              // Treat as potential rate limit - create error that will trigger retry
              const rateLimitError = new Error('auth/too-many-requests - timeout waiting for auth');
              rateLimitError.code = 'auth/too-many-requests';
              throw rateLimitError;
            }
          }
        }
        
        throw error;
      }
    },
    {
      maxRetries,
      initialDelay,
      maxDelay: 30000,
      backoffFactor: 2,
    }
  );
}

/**
 * Navigate to the app and wait for auth to be ready
 * Handles rate limiting automatically
 */
async function navigateAndWaitForAuth(page, url = '/', options = {}) {
  // Set up console error tracking for auth errors BEFORE navigation
  await page.addInitScript(() => {
    window.__playwrightAuthErrors = [];
    const originalError = console.error;
    console.error = (...args) => {
      const message = args.join(' ');
      if (
        message.includes('Firebase') ||
        message.includes('auth') ||
        message.includes('sign-in') ||
        message.includes('rate limit') ||
        message.includes('quota') ||
        message.includes('too many requests')
      ) {
        window.__playwrightAuthErrors.push(message);
      }
      originalError.apply(console, args);
    };
  });
  
  // Navigate to the page
  await page.goto(url);
  await page.waitForLoadState('domcontentloaded');
  
  // Wait for auth to be ready with retry logic
  await waitForAuthReady(page, options);
  
  // Wait for topic selection UI as final confirmation
  await page.waitForSelector('[data-tutorial-id="topic-selection"]', {
    timeout: options.timeout || 60000,
  });
}

/**
 * Add a delay between tests to avoid rate limiting
 */
async function delayBetweenTests(ms = 1000) {
  await wait(ms);
}

export {
  isRateLimitError,
  retryWithBackoff,
  waitForAuthReady,
  navigateAndWaitForAuth,
  delayBetweenTests,
  wait,
};

