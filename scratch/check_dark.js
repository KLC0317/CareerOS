const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Go to page
  await page.goto('http://localhost:3000');

  // Click quick login
  await page.click('button:has-text("Quick Login")');
  await page.waitForTimeout(2000);

  // Open dropdown
  await page.click('button:has-text("Kian Lok")');
  await page.waitForTimeout(500);

  // Go to settings
  await page.click('button:has-text("Profile Settings")');
  await page.waitForTimeout(1000);

  // Print initial classes
  const htmlClassBefore = await page.evaluate(() => document.documentElement.className);
  console.log('HTML classes before toggle:', htmlClassBefore);

  // Toggle dark mode
  await page.click('button:has-text("Dark Mode")');
  await page.waitForTimeout(500);

  // Save settings
  await page.click('button:has-text("Save Changes")');
  await page.waitForTimeout(1000);

  // Go back to dashboard
  await page.click('button:has-text("Back to Dashboard")');
  await page.waitForTimeout(1000);

  // Print HTML classes after toggle
  const htmlClassAfter = await page.evaluate(() => document.documentElement.className);
  const bodyClassAfter = await page.evaluate(() => document.body.className);
  console.log('HTML classes after toggle:', htmlClassAfter);
  console.log('Body classes after toggle:', bodyClassAfter);

  // Check if body background is computed correctly
  const bodyBg = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log('Body computed background color:', bodyBg);

  await browser.close();
})();
