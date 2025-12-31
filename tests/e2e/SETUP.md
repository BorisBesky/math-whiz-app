# Playwright E2E Test Setup

## Running Tests

### Option 1: Use React Dev Server (Default)

By default, Playwright will start `npm start` (React dev server on port 3000):

```bash
npx playwright test
```

### Option 2: Use Netlify Dev Server

If you prefer to use `netlify dev` (runs on port 8888), set the environment variable:

```bash
PLAYWRIGHT_USE_NETLIFY_DEV=true npx playwright test
```

Or export it first:

```bash
export PLAYWRIGHT_USE_NETLIFY_DEV=true
npx playwright test
```

### Option 3: Use Existing Server

If you already have a server running, Playwright will detect and reuse it:

```bash
# Terminal 1: Start your server
npm start
# or
npm run dev

# Terminal 2: Run tests (will reuse existing server)
npx playwright test
```

## Troubleshooting

### Tests Timeout Waiting for Server

If tests timeout while waiting for the server to start:

1. **Check if the server is actually starting:**
   - Look for output from the webServer command
   - Check if the port is already in use: `lsof -i :3000` or `lsof -i :8888`

2. **Increase server startup timeout:**
   - Edit `playwright.config.js` (in project root)
   - Increase the `timeout` value in `webServer` config (currently 180 seconds)

3. **Check for compilation errors:**
   - The server might be failing to compile
   - Check stderr output from the webServer

4. **Try using the existing server:**
   - Start the server manually first
   - Then run tests (they will reuse the existing server)

### Server Starts But Tests Still Timeout

If the server starts successfully but tests timeout:

1. **Check Firebase Auth rate limiting:**
   - Tests include retry logic for Firebase Auth rate limits
   - Reduce parallelism: Set `workers: 1` in `playwright.config.js` (in project root)
   - Add delays between tests (already included in auth-helpers.js)

2. **Increase test timeouts:**
   - Global timeout is 60 seconds (configurable in `playwright.config.js` in project root)
   - Action timeout is 30 seconds (configurable per action)

3. **Check network connectivity:**
   - Ensure Firebase services are accessible
   - Check firewall/proxy settings

### Port Already in Use

If you get "port already in use" errors:

1. **Kill the process using the port:**
   ```bash
   # Find process using port 3000
   lsof -ti:3000 | xargs kill -9
   
   # Or for port 8888
   lsof -ti:8888 | xargs kill -9
   ```

2. **Use a different port:**
   - Set `PORT=3001 npm start` and update baseURL in `playwright.config.js` (in project root)
   - Or use the existing server (reuseExistingServer: true)

## Environment Variables

- `PLAYWRIGHT_USE_NETLIFY_DEV`: Set to `true` to use `netlify dev` instead of `npm start`
- `CI`: Automatically set in CI environments, affects retries and workers

## Best Practices

1. **Run tests in isolation:** Each test should be independent
2. **Use existing server when developing:** Faster iteration
3. **Clean state between tests:** Tests handle cleanup automatically
4. **Monitor Firebase Auth rate limits:** Tests include retry logic, but be mindful of parallel execution

