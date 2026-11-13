import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const baseUrl = process.argv[2] || "http://127.0.0.1:4173";
const screenshotDir = "artifacts/public-release-preview";
mkdirSync(screenshotDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const failures = [];
const checked = {};

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const homeResponse = await page.goto(baseUrl + "/index.html", { waitUntil: "networkidle" });
  if (!homeResponse?.ok()) failures.push("Homepage did not return a successful response");
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: screenshotDir + "/homepage-desktop.png", fullPage: true });
  checked.homepageDesktopScreenshot = true;

  for (const href of ["grade-levels.html", "roadmap.html"]) {
    const response = await page.request.get(baseUrl + "/" + href);
    if (!response.ok()) failures.push("Public link target did not load: " + href);
  }

  const homeLinks = await page.locator("header .nav a, main a, footer a").evaluateAll(nodes => nodes.map(a => a.getAttribute("href")).filter(Boolean));
  for (const forbidden of ["auth.html", "student-learning.html", "student-portfolio.html", "teacher-dashboard.html", "classes.html", "assignments.html"]) {
    if (homeLinks.includes(forbidden)) failures.push("Homepage exposes unreleased destination: " + forbidden);
  }
  if (!(await page.locator(".development-strip").count())) failures.push("Homepage development update strip is missing");
  if (!(await page.locator(".roadmap-preview").count())) failures.push("Homepage roadmap preview is missing");
  checked.publicNavigation = true;

  const accessibilitySmoke = await page.evaluate(() => {
    const hasName = element => Boolean(
      (element.innerText || "").trim() ||
      element.getAttribute("aria-label") ||
      element.getAttribute("title") ||
      element.querySelector("img[alt]")?.getAttribute("alt")
    );
    return {
      documentLanguage: Boolean(document.documentElement.lang),
      pageTitle: Boolean(document.title.trim()),
      mainLandmark: document.querySelectorAll("main").length === 1,
      primaryHeading: document.querySelectorAll("h1").length === 1,
      skipLink: Boolean(document.querySelector('a.skip-link[href="#main-content"]')),
      labelledNavigation: Boolean(document.querySelector("nav[aria-label]")),
      namedButtons: [...document.querySelectorAll("button")].every(hasName),
      namedLinks: [...document.querySelectorAll("a[href]")].every(hasName),
      imageAlternatives: [...document.images].every(img => img.hasAttribute("alt"))
    };
  });
  for (const [check, passed] of Object.entries(accessibilitySmoke)) {
    if (!passed) failures.push("Accessibility smoke check failed: " + check);
  }
  checked.accessibilitySmoke = accessibilitySmoke;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) failures.push("Homepage has horizontal overflow at a 390px viewport");
  await page.screenshot({ path: screenshotDir + "/homepage-mobile.png", fullPage: true });
  checked.homepageMobileScreenshot = true;

  const toggle = page.locator(".menu-toggle");
  await toggle.click();
  if ((await toggle.getAttribute("aria-expanded")) !== "true") failures.push("Mobile menu did not open");
  await page.keyboard.press("Escape");
  if ((await toggle.getAttribute("aria-expanded")) !== "false") failures.push("Escape did not close the mobile menu");
  if (!(await toggle.evaluate(el => el === document.activeElement))) failures.push("Escape did not restore focus to the menu toggle");
  checked.mobileNavigation = true;

  // Explicitly restore desktop dimensions before capturing the roadmap desktop image.
  await page.setViewportSize({ width: 1440, height: 900 });
  const roadmapResponse = await page.goto(baseUrl + "/roadmap.html", { waitUntil: "networkidle" });
  if (!roadmapResponse?.ok()) failures.push("Roadmap did not return a successful response");
  await page.evaluate(() => document.fonts.ready);
  const roadmapText = await page.locator("body").innerText();
  for (const phrase of ["Available on public site", "Built in development · not released", "In progress · draft PR", "not integrated into the live release"]) {
    if (!roadmapText.includes(phrase)) failures.push("Roadmap release-status message is missing: " + phrase);
  }
  await page.screenshot({ path: screenshotDir + "/roadmap-desktop.png", fullPage: true });
  checked.roadmapDesktopScreenshot = true;

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  if (await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth)) failures.push("Roadmap has horizontal overflow at a 390px viewport");
  await page.screenshot({ path: screenshotDir + "/roadmap-mobile.png", fullPage: true });
  checked.roadmapMobileScreenshot = true;
  checked.roadmapTransparency = true;

  await page.goto(baseUrl + "/index.html#how-it-works", { waitUntil: "domcontentloaded" });
  if (!(await page.locator("#how-it-works").count())) failures.push("Homepage how-it-works anchor is missing");
  checked.anchorNavigation = true;
} catch (error) {
  failures.push("Public release browser QA error: " + (error.stack || error.message));
} finally {
  await browser.close();
}

console.log(JSON.stringify({ checked, failures, screenshots: screenshotDir }, null, 2));
if (failures.length) process.exitCode = 1;
