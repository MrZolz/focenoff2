const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8899/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  // Take multiple scrolled screenshots
  for (let i = 0; i < 5; i++) {
    await page.screenshot({ path: `./screenshot_scroll_${i}.png`, fullPage: false });
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(800);
  }

  await browser.close();
  console.log('Screenshots saved');
})();
