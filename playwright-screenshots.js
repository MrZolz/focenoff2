const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  console.log('Navigating to http://localhost:8899/...');
  await page.goto('http://localhost:8899/', { waitUntil: 'networkidle' });

  // Wait 4 seconds for preloader to finish
  console.log('Waiting 4 seconds for preloader...');
  await page.waitForTimeout(4000);

  // Screenshot 1: Hero section (no scroll)
  console.log('Taking screenshot 1: hero...');
  await page.screenshot({
    path: 'E:/Рабочий стол/facenoff2/final_hero.png',
    fullPage: false
  });
  console.log('Screenshot 1 saved.');

  // Get visible text for hero
  const heroText = await page.evaluate(() => {
    const body = document.body.innerText;
    return body.substring(0, 500);
  });
  console.log('Hero visible text (approx):', heroText);

  // Screenshot 2: Scroll to y=500
  console.log('Scrolling to y=500...');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: 'E:/Рабочий стол/facenoff2/final_works.png',
    fullPage: false
  });
  console.log('Screenshot 2 saved.');

  const worksText = await page.evaluate(() => {
    const elements = document.elementsFromPoint(720, 450);
    return elements.map(e => e.innerText || e.textContent).filter(Boolean).join(' | ').substring(0, 300);
  });
  console.log('Works visible text (approx):', worksText);

  // Screenshot 3: Scroll to y=14000
  console.log('Scrolling to y=14000...');
  await page.evaluate(() => window.scrollTo(0, 14000));
  await page.waitForTimeout(800);
  await page.screenshot({
    path: 'E:/Рабочий стол/facenoff2/final_bottom.png',
    fullPage: false
  });
  console.log('Screenshot 3 saved.');

  const bottomText = await page.evaluate(() => {
    // Get what's visible in viewport
    const vp = { top: window.scrollY, bottom: window.scrollY + window.innerHeight };
    const elements = document.querySelectorAll('*');
    const texts = [];
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.top >= 0 && rect.top <= window.innerHeight && el.innerText && el.innerText.trim().length > 0 && el.children.length === 0) {
        texts.push(el.innerText.trim());
      }
    }
    return texts.slice(0, 30).join(' | ');
  });
  console.log('Bottom visible text:', bottomText);

  // Get page total height
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  console.log('Total page height:', pageHeight);

  await browser.close();
  console.log('Done!');
})();
