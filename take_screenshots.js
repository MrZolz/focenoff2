const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:8899/');
  await page.goto('http://localhost:8899/', { waitUntil: 'networkidle' });

  // --- Screenshot 1: wait 4s for preloader ---
  console.log('Waiting 4 seconds for preloader...');
  await page.waitForTimeout(4000);

  const hero = 'E:/Рабочий стол/facenoff2/final_hero.png';
  await page.screenshot({ path: hero, fullPage: false });
  console.log('Saved:', hero);

  // Describe what's visible
  const heroText = await page.evaluate(() => document.body.innerText.substring(0, 800));
  console.log('--- HERO TEXT (first 800 chars) ---');
  console.log(heroText);

  // --- Screenshot 2: scroll to y=500 ---
  console.log('\nScrolling to y=500...');
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(800);

  const works = 'E:/Рабочий стол/facenoff2/final_works.png';
  await page.screenshot({ path: works, fullPage: false });
  console.log('Saved:', works);

  const worksText = await page.evaluate(() => {
    // Get text from elements currently in viewport area
    const all = document.querySelectorAll('*');
    const texts = [];
    const vTop = window.scrollY;
    const vBottom = window.scrollY + window.innerHeight;
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      const absTop = rect.top + window.scrollY;
      const absBot = rect.bottom + window.scrollY;
      if (absBot >= vTop && absTop <= vBottom && el.children.length === 0 && el.innerText && el.innerText.trim()) {
        texts.push(el.innerText.trim());
      }
    }
    return [...new Set(texts)].join('\n');
  });
  console.log('--- WORKS TEXT (viewport at y=500) ---');
  console.log(worksText.substring(0, 600));

  // --- Screenshot 3: scroll to y=14000 ---
  console.log('\nScrolling to y=14000...');
  await page.evaluate(() => window.scrollTo(0, 14000));
  await page.waitForTimeout(800);

  const bottom = 'E:/Рабочий стол/facenoff2/final_bottom.png';
  await page.screenshot({ path: bottom, fullPage: false });
  console.log('Saved:', bottom);

  const bottomText = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const texts = [];
    const vTop = window.scrollY;
    const vBottom = window.scrollY + window.innerHeight;
    for (const el of all) {
      const rect = el.getBoundingClientRect();
      const absTop = rect.top + window.scrollY;
      const absBot = rect.bottom + window.scrollY;
      if (absBot >= vTop && absTop <= vBottom && el.children.length === 0 && el.innerText && el.innerText.trim()) {
        texts.push(el.innerText.trim());
      }
    }
    return [...new Set(texts)].join('\n');
  });
  console.log('--- BOTTOM TEXT (viewport at y=14000) ---');
  console.log(bottomText.substring(0, 600));

  // Extra: get background color of body at each scroll position
  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  console.log('\nBody background color:', bgColor);

  await browser.close();
  console.log('\nDone.');
})();
