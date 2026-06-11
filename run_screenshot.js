const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

    await page.goto('http://localhost:8899/');
    await new Promise(r => setTimeout(r, 6000));

    const outDir = path.join(__dirname, '.playwright-mcp');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    const outPath = path.join(outDir, 'hero_fixed.png');
    await page.screenshot({ path: outPath, fullPage: false });

    const title = await page.title();
    const heroInfo = await page.evaluate(() => {
        const results = [];
        const selectors = ['h1', '.hero', '[class*="hero"]', '[class*="title"]', '[class*="name"]'];
        const seen = new Set();
        selectors.forEach(sel => {
            document.querySelectorAll(sel).forEach(el => {
                if (!seen.has(el)) {
                    seen.add(el);
                    const rect = el.getBoundingClientRect();
                    const style = window.getComputedStyle(el);
                    results.push({
                        tag: el.tagName,
                        text: el.innerText,
                        classes: el.className,
                        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom },
                        fontSize: style.fontSize,
                        overflow: style.overflow,
                        clip: style.clip,
                        clipPath: style.clipPath
                    });
                }
            });
        });
        return results;
    });

    console.log('Page title:', title);
    console.log('Viewport width: 1920');
    heroInfo.forEach(el => {
        console.log('---');
        console.log('Tag:', el.tag, '| Classes:', el.classes);
        console.log('Text:', JSON.stringify(el.text));
        console.log('Rect:', JSON.stringify(el.rect));
        console.log('fontSize:', el.fontSize, '| overflow:', el.overflow, '| clip:', el.clip, '| clipPath:', el.clipPath);
    });

    await browser.close();
    console.log('Screenshot saved to:', outPath);
})().catch(console.error);
