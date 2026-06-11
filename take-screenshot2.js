const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8899/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  // Take viewport-only screenshot (not full page) to keep size manageable
  await page.screenshot({ path: './screenshot_viewport.png', fullPage: false });
  await browser.close();
  console.log('Screenshot saved to screenshot_viewport.png');
})();
