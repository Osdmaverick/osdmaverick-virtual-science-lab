import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.argv[2] || 'http://127.0.0.1:4173';
const browser = await chromium.launch({ headless: true });
const failures = [];
const results = {};
const screenshotDir = 'artifacts/assignments-preview';
mkdirSync(screenshotDir, { recursive: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const consoleErrors = [];
  page.on('pageerror', error => consoleErrors.push(error.message));

  const response = await page.goto(baseUrl + '/assignments.html', { waitUntil: 'networkidle' });
  assert.ok(response?.ok(), 'assignments page should return HTTP success');
  assert.equal(await page.locator('main h1').count(), 1, 'page should have one primary heading');
  assert.equal(await page.locator('main').count(), 1, 'page should have one main landmark');
  assert.equal(await page.locator('a.skip-link[href="#main-content"]').count(), 1, 'page should include a skip link');
  assert.equal(await page.locator('#assignments-status').getAttribute('role'), 'status');
  assert.equal(await page.locator('#assignments-content').isHidden(), true, 'unconfigured backend must not expose authenticated controls');
  assert.match(await page.locator('#assignments-status').innerText(), /not connected yet/i);
  for (const id of ['assignment-class','assignment-title','assignment-instructions','assignment-points','assignment-due']) {
    assert.equal(await page.locator('label[for="' + id + '"]').count(), 1, 'form control ' + id + ' has a label');
  }
  assert.equal(await page.locator('header nav[aria-label="Main navigation"]').count(), 1);
  results.desktopStructure = true;
  await page.screenshot({ path: screenshotDir + '/assignments-desktop.png', fullPage: true });

  const desktopOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(desktopOverflow, false, 'desktop layout must not overflow horizontally');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: 'networkidle' });
  const mobileOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  assert.equal(mobileOverflow, false, 'mobile layout must not overflow horizontally');
  results.mobileLayout = true;
  await page.screenshot({ path: screenshotDir + '/assignments-mobile.png', fullPage: true });

  const menuToggle = page.locator('.menu-toggle');
  if (await menuToggle.count()) {
    await menuToggle.click();
    assert.equal(await menuToggle.getAttribute('aria-expanded'), 'true', 'mobile menu should open');
    await page.keyboard.press('Escape');
    assert.equal(await menuToggle.getAttribute('aria-expanded'), 'false', 'Escape should close mobile menu');
  }
  results.mobileNavigation = true;
  assert.deepEqual(consoleErrors, [], 'page should not raise uncaught JavaScript errors');
  results.runtimeErrors = true;
} catch (error) {
  failures.push(error.stack || error.message);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ results, failures }, null, 2));
if (failures.length) process.exitCode = 1;
