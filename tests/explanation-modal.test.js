const { chromium } = require('playwright');
const path = require('path');

(async () => {
  let browser;
  try {
    console.log("🚀 Launching browser...");
    browser = await chromium.launch({
      headless: true // Set to false to watch the test run
    });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Capture console messages to debug KaTeX rendering
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.type() === 'warn') {
        console.log(`Browser ${msg.type()}: ${msg.text()}`);
      }
    });

    const appUrl = 'http://127.0.0.1:3000'; // Using explicit IP
    console.log(`🌍 Navigating to ${appUrl}...`);
    await page.goto(appUrl, { waitUntil: 'load', timeout: 60000 }); // Changed to 'load'
    console.log("✅ Page loaded.");

    // Click the 4th Grade button
    console.log("4️⃣ Clicking '4th Grade' button...");
    await page.click('button:has-text("4th Grade")');
    console.log("✅ Clicked '4th Grade'.");

    // Click the 'Operations & Algebraic Thinking' topic button
    console.log("🧠 Clicking 'Operations & Algebraic Thinking' topic...");
    await page.click('button:has-text("Operations & Algebraic Thinking")');
    console.log("✅ Clicked topic.");
    
    // Give the UI a moment to update the question context
    await page.waitForTimeout(500);

    // Click the 'Learn About This' button to open the modal
    console.log("📖 Clicking 'Learn About This' button...");
    await page.click('button:has-text("Learn About This")');
    console.log("✅ Clicked 'Learn About This'.");

    // Wait for the modal to be visible. We'll use a selector that targets the modal's overlay.
    console.log("🔍 Waiting for explanation modal...");
    const modalSelector = '.bg-white\\/50.backdrop-blur-sm.rounded-2xl'; // Target the modal content container
    await page.waitForSelector(modalSelector, { state: 'visible', timeout: 5000 });
    console.log("✅ Modal is visible.");

    // Specifically wait for a KaTeX rendered element to be present inside the modal
    const katexSelector = `${modalSelector} .katex`;
    await page.waitForSelector(katexSelector, { state: 'attached', timeout: 5000 });
    console.log("✅ KaTeX content has rendered.");

    // Scroll down to the Long Division section within the modal
    console.log("📜 Scrolling to Long Division section...");
    await page.evaluate(() => {
      // Find the heading containing "Long Division"
      const longDivisionHeading = Array.from(document.querySelectorAll('h2'))
        .find(h => h.textContent.includes('Long Division'));
      
      if (longDivisionHeading) {
        longDivisionHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    // Wait a moment for smooth scroll to complete
    await page.waitForTimeout(1000);
    console.log("✅ Scrolled to Long Division section.");

    // Debug: Check what the actual HTML content looks like
    console.log("🔍 Checking HTML content in Long Division section...");
    const longDivisionHTML = await page.evaluate(() => {
      const longDivisionHeading = Array.from(document.querySelectorAll('h2'))
        .find(h => h.textContent.includes('Long Division'));
      
      if (longDivisionHeading) {
        // Get the next few sibling elements to see the long division content
        let content = '';
        let sibling = longDivisionHeading.nextElementSibling;
        let count = 0;
        while (sibling && count < 5) {
          content += sibling.outerHTML + '\n';
          sibling = sibling.nextElementSibling;
          count++;
        }
        return content;
      }
      return 'Long Division section not found';
    });
    
    console.log("📝 Long Division HTML content:");
    console.log(longDivisionHTML);

    // Take a screenshot of the modal content area focused on long division
    const screenshotPath = path.join(__dirname, 'long-division-katex-render.png');
    const modalElement = await page.$(modalSelector);
    
    if (modalElement) {
      await modalElement.screenshot({ path: screenshotPath });
      console.log(`📸 Screenshot saved to: ${screenshotPath}`);
    } else {
      throw new Error('Could not find modal element to screenshot.');
    }

    console.log("🎉 Test script completed successfully!");

  } catch (error) {
    console.error("❌ An error occurred during the test run:", error);
    process.exit(1);
  } finally {
    if (browser) {
      await browser.close();
      console.log("🚪 Browser closed.");
    }
  }
})();
