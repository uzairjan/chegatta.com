const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 800 } });
  await page.goto('http://localhost:8599/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  const nav = page.locator('.nav-container');
  const box = await nav.boundingBox();
  console.log('nav-container width:', box ? box.width : 'n/a');

  const links = await page.locator('.nav-links').boundingBox();
  console.log('nav-links width:', links ? links.width : 'n/a');

  // Check for wrapping: measure each link's text box vs single line height
  const items = await page.locator('.nav-links a').evaluateAll((els) =>
    els.map((el) => ({
      text: el.textContent.trim(),
      height: el.getBoundingClientRect().height,
      width: el.getBoundingClientRect().width,
      lineHeight: getComputedStyle(el).lineHeight,
    }))
  );
  console.log('desktop nav links:', JSON.stringify(items, null, 2));

  // Check overall nav fit
  const navWidth = (await page.locator('.navbar').boundingBox()).width;
  const logoW = (await page.locator('.nav-logo').boundingBox()).width;
  const actionsW = (await page.locator('.nav-actions').boundingBox()).width;
  const toggle = await page.locator('.nav-toggle').isVisible();
  console.log('navbar total:', navWidth, 'logo:', logoW, 'actions:', actionsW, 'toggle visible:', toggle);

  await page.screenshot({ path: '/tmp/nav-desktop.png' });
  await browser.close();
})();
