const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8899/', { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  const outDir = 'E:/Рабочий стол/facenoff2';

  // 1. Hero screenshot at initial load (viewport only)
  await page.screenshot({ path: outDir + '/hero_check.png', fullPage: false });
  console.log('1. hero_check.png saved');

  // Get total page height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Total page height:', pageHeight);

  // 2. Scroll to ~50% of page height
  const scroll50 = Math.floor(pageHeight * 0.50);
  await page.evaluate((y) => window.scrollTo(0, y), scroll50);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outDir + '/works_check.png', fullPage: false });
  console.log('2. works_check.png saved (50% scroll, y=' + scroll50 + ')');

  // 3. Scroll to ~30-40% for works section
  const scroll35 = Math.floor(pageHeight * 0.35);
  await page.evaluate((y) => window.scrollTo(0, y), scroll35);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outDir + '/works2_check.png', fullPage: false });
  console.log('3. works2_check.png saved (35% scroll, y=' + scroll35 + ')');

  // 4. Scroll to statement/contact section (80-90%)
  const scroll85 = Math.floor(pageHeight * 0.85);
  await page.evaluate((y) => window.scrollTo(0, y), scroll85);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: outDir + '/statement_check.png', fullPage: false });
  console.log('4. statement_check.png saved (85% scroll, y=' + scroll85 + ')');

  // Also log current scroll position and visible sections
  const sectionInfo = await page.evaluate(() => {
    const sections = document.querySelectorAll('section, [data-section], .section, #hero, #works, #statement, #contact');
    return Array.from(sections).map(s => ({
      id: s.id,
      className: s.className.substring(0, 50),
      offsetTop: s.offsetTop,
      height: s.offsetHeight,
    }));
  });
  console.log('Sections found:', JSON.stringify(sectionInfo, null, 2));

  await browser.close();
  console.log('All screenshots done!');
})();
