#!/usr/bin/env node
/**
 * Real-browser smoke tests for the Grade 4–12 Virtual Science Lab.
 * Requires Playwright and a local static server:
 *   node scripts/browser-qa.mjs http://127.0.0.1:4173
 */
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const root = process.cwd();
const baseUrl = (process.argv[2] || "http://127.0.0.1:4173").replace(/\/$/, "");
const directory = fs.readFileSync(path.join(root, "grade-levels.html"), "utf8");
const pages = [...new Set([...directory.matchAll(/href=["']([^"'#?]+\.html)["']/gi)]
  .map((match) => match[1])
  .filter((href) => /^grade\d+[-\w]*\.html$/i.test(href)))];
const failures = [];
const checked = { pages: 0, mobile: 0, reducedMotion: 0, keyboard: 0 };
const sampleByGrade = new Map();

for (const href of pages) {
  const grade = Number(href.match(/^grade(\d+)/i)?.[1]);
  if (grade && !sampleByGrade.has(grade)) sampleByGrade.set(grade, href);
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

try {
  for (const href of pages) {
    const errors = [];
    const onPageError = (error) => errors.push(error.message);
    page.on("pageerror", onPageError);
    const response = await page.goto(`${baseUrl}/${encodeURI(href)}`, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });
    await page.locator("main.lab").waitFor({ state: "attached", timeout: 10000 });
    await page.locator(".science-motion").waitFor({ state: "attached", timeout: 10000 });
    const state = await page.evaluate(() => ({
      title: document.title,
      hasMotionToggle: Boolean(document.querySelector(".motion-toggle")),
      sharedCss: [...document.styleSheets].some((sheet) => sheet.href?.includes("assets/styles.css")),
      sharedJs: [...document.scripts].some((script) => script.src.includes("assets/main.js")),
      viewportWidth: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
    }));
    if (!response?.ok()) failures.push(`${href}: HTTP ${response?.status() ?? "no response"}`);
    if (!state.hasMotionToggle || !state.sharedCss || !state.sharedJs) {
      failures.push(`${href}: shared animation/assets/control missing`);
    }
    if (errors.length) failures.push(`${href}: uncaught browser error: ${errors.join(" | ")}`);
    checked.pages += 1;
    page.off("pageerror", onPageError);
  }

  const mobileSamples = [...pages.filter((href) => /grade\d+/i.test(href))]
    .filter((href, index) => index % Math.max(1, Math.floor(pages.length / 27)) === 0)
    .slice(0, 27);
  for (const href of mobileSamples) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}/${encodeURI(href)}`, { waitUntil: "domcontentloaded" });
    const width = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    if (width.content > width.viewport + 1) {
      failures.push(`${href}: horizontal overflow at 390px (${width.content}px > ${width.viewport}px)`);
    }
    checked.mobile += 1;
  }

  for (const [grade, href] of sampleByGrade) {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(`${baseUrl}/${encodeURI(href)}`, { waitUntil: "domcontentloaded" });
    const reduced = await page.locator(".motion-toggle").evaluate((button) => ({
      disabled: button.disabled,
      pressed: button.getAttribute("aria-pressed"),
      text: button.textContent,
      paused: button.closest(".science-motion")?.classList.contains("motion-paused"),
    }));
    if (!reduced.disabled || reduced.pressed !== "true" || !reduced.paused) {
      failures.push(`Grade ${grade} reduced-motion preference was not respected`);
    }
    checked.reducedMotion += 1;
  }

  await page.emulateMedia({ reducedMotion: "no-preference" });
  const keyboardPage = sampleByGrade.values().next().value;
  if (keyboardPage) {
    await page.goto(`${baseUrl}/${encodeURI(keyboardPage)}`, { waitUntil: "domcontentloaded" });
    const button = page.locator(".motion-toggle");
    await button.focus();
    const focus = await button.evaluate((element) => ({
      active: document.activeElement === element,
      outlineStyle: getComputedStyle(element).outlineStyle,
      outlineWidth: getComputedStyle(element).outlineWidth,
    }));
    if (!focus.active || focus.outlineStyle === "none" || focus.outlineWidth === "0px") {
      failures.push("Animation control has no visible keyboard focus indicator");
    }
    await page.keyboard.press("Enter");
    if (await button.getAttribute("aria-pressed") !== "true") {
      failures.push("Keyboard Enter did not pause the animation or update aria-pressed");
    }
    checked.keyboard += 1;
  }

  // Exercise representative calculator outputs and input-validation boundaries.
  const functionalCases = [
    {
      href: "grade4-physics-electric-circuits.html",
      checks: [{ a: "6", b: "3", expected: "Current 2.00 A" }],
      invalid: { a: "6", b: "0", expectedError: "Resistance must be greater than zero." },
    },
    {
      href: "grade8-physics-electricity-circuits.html",
      checks: [{ a: "9", b: "3", expected: "Current 3.000 A" }],
    },
    {
      href: "grade12-physics-ac-circuits.html",
      checks: [{ a: "30", b: "40", expected: "Impedance: 50.000 Ω" }],
    },
    {
      href: "grade12-chemistry-acid-base-titration.html",
      checks: [{ a: "0.1", b: "25", expected: "Equivalence base volume: 25.00 mL" }],
    },
    {
      href: "grade10-biology-biomolecules.html",
      checks: [{ a: "37", b: "8", expected: "Relative enzyme activity: 80.0%" }],
      invalid: { a: "", b: "8", expectedError: "Enter a valid temperature above absolute zero" },
    },
    { href: "grade4-physics-motion-speed.html", checks: [{ a: "60", b: "12", expected: "Average speed 5.00 m/s" }] },
    { href: "grade5-chemistry-mixtures-solutions.html", checks: [{ a: "10", b: "0.5", expected: "Concentration 20.00 g/L" }] },
    { href: "grade5-chemistry-acids-bases-neutralisation.html", checks: [{ a: "3", b: "5", expected: "Solution B classification Acidic" }, { a: "3", b: "11", expected: "Solution B classification Alkaline" }] },
    { href: "grade7-chemistry-acids-bases.html", checks: [{ a: "10", b: "4", expected: "Solution A classification Alkaline" }, { a: "10", b: "4", expected: "Solution B classification Acidic" }] },
    { href: "grade8-chemistry-atoms-elements-compounds.html", checks: [{ a: "2", b: "1", expected: "Particle composition Two atom types represented" }, { a: "3", b: "0", expected: "Particle composition One atom type represented" }] },
    { href: "grade6-chemistry-acids.html", checks: [{ a: "3", b: "10", expected: "Solution A Acidic" }] },
    { href: "grade6-biology-cells.html", checks: [{ a: "5", b: "3", expected: "Comparison More plant features" }] },
    { href: "grade7-chemistry-moles-concentration.html", checks: [{ a: "0.5", b: "1", expected: "Molar concentration: 0.500 mol/L" }] },
    { href: "grade7-biology-dna-genetics.html", checks: [{ a: "100", b: "50", expected: "Trait probability: 50%" }] },
    { href: "grade8-biology-enzymes.html", checks: [{ a: "37", b: "8", expected: "Relative enzyme activity: 80.0%" }] },
    { href: "grade8-chemistry-reactions-conservation-mass.html", checks: [{ a: "12", b: "8", expected: "Product mass 20.0 g" }] },
    { href: "grade9-chemistry-stoichiometry.html", checks: [{ a: "2", b: "2", expected: "Simplified 1:1 comparison: Amounts are equal" }] },
    { href: "grade9-physics-momentum-collisions.html", checks: [{ a: "2", b: "4", c: "3", d: "0", expected: "Final shared velocity 1.60 m/s" }] },
    { href: "grade10-physics-projectile-motion.html", checks: [{ a: "20", b: "45", expected: "Horizontal range 40.77 m" }] },
    { href: "grade10-chemistry-analysis.html", checks: [{ a: "0.1", b: "25", c: "20", expected: "Unknown concentration (1:1) 0.12500 mol/L" }], invalid: { a: "0.1", b: "25", c: "0", expectedError: "positive finite concentration and both positive solution volumes" } },
    { href: "grade10-chemistry-bonding.html", checks: [{ a: "2", b: "2", expected: "Electron domains 4" }], invalid: { a: "0", b: "2", expectedError: "2–6 total electron domains" } },
    { href: "grade10-chemistry-environment.html", checks: [{ a: "50", b: "80", expected: "Remaining concentration 10.00 mg/L" }], invalid: { a: "-1", b: "80", expectedError: "non-negative finite pollutant concentration" } },
    { href: "grade10-chemistry-organic.html", checks: [{ a: "2", b: "6", expected: "Matches CₙH₂ₙ₊₂" }], invalid: { a: "0", b: "2", expectedError: "positive whole-number carbon count" } },
    { href: "grade10-chemistry-redox.html", checks: [{ a: "0.8", b: "0.3", expected: "Cell potential 0.500 V" }], invalid: { a: "", b: "0.3", expectedError: "finite cathode and anode potentials" } },
    { href: "grade10-chemistry-stoichiometry.html", checks: [{ a: "2", b: "3", expected: "Limiting reactant in 1:1 model: A" }] },
    { href: "grade10-chemistry-thermochemistry.html", checks: [{ a: "100", b: "5", expected: "Heat change in solution 2.09 kJ" }, { a: "100", b: "-5", expected: "Heat change in solution -2.09 kJ" }], invalid: { a: "", b: "5", expectedError: "Enter a positive solution mass and a valid temperature change." } },
    { href: "grade11-physics-mechanical-waves.html", checks: [{ a: "4", b: "2", expected: "Wave speed 8.000 m/s" }] },
    { href: "grade11-chemistry-bonding-lattice-energy.html", checks: [{ a: "2", b: "3", expected: "Relative attraction index 0.444" }], invalid: { a: "-2", b: "3", expectedError: "positive charge magnitude and a positive separation" } },
    { href: "grade11-chemistry-buffers.html", checks: [{ a: "4.76", b: "1", expected: "Estimated pH 4.760" }] },
    { href: "grade11-biology-enzyme-kinetics.html", checks: [{ a: "5", b: "2", expected: "Reaction rate: 71.43 units" }] },
    { href: "grade12-chemistry-electrochemistry-nernst.html", checks: [{ a: "1.1", b: "1", expected: "Cell potential: 1.1000 V" }] },
    { href: "grade12-biology-neurobiology.html", checks: [{ a: "1", b: "50", expected: "Signal travel time: 20.000 ms" }] },
    { href: "grade10-physics-circular-motion.html", checks: [{ a: "12", b: "4", expected: "Centripetal acceleration 36.00 m/s²" }] },
    { href: "grade11-physics-circular-gravitation.html", checks: [{ a: "2", b: "5", expected: "Centripetal acceleration 0.800 m/s²" }] },
    { href: "grade12-physics-orbital-mechanics.html", checks: [{ a: "3.986e14", b: "7000000", expected: "Orbital speed 7.546 km/s" }], invalid: { a: "0", b: "7000000", expectedError: "Enter a positive gravitational parameter" } },
    { href: "grade11-chemistry-atomic-orbitals.html", checks: [{ a: "11", b: "3", expected: "Remaining capacity 7" }], invalid: { a: "19", b: "3", expectedError: "whole-number electron count from 0 to the shell capacity" } },
    { href: "grade10-chemistry-redox.html", checks: [{ a: "0.8", b: "0.3", expected: "Thermodynamic status Spontaneous" }, { a: "0.3", b: "0.3", expected: "Thermodynamic status At equilibrium" }, { a: "0.3", b: "0.8", expected: "Thermodynamic status Non-spontaneous" }] },
    { href: "grade12-chemistry-polymer-chemistry.html", checks: [{ a: "2500", b: "1000", expected: "Average degree of polymerisation 2.50" }] },
    { href: "grade12-chemistry-advanced-stoichiometry.html", checks: [{ a: "2", b: "3", expected: "Theoretical product amount 6.000 mol" }] },
    { href: "grade12-biology-advanced-immunology.html", checks: [{ a: "10", b: "5", expected: "Secondary response index 50.00" }] },
    { href: "grade10-biology-genetics.html", checks: [{ a: "50", b: "40", expected: "Expected trait count 20.0" }] },
    { href: "grade11-biology-cell-signalling.html", inputLabel: "Dissociation constant", checks: [{ a: "2", b: "1", expected: "Receptor occupancy 66.67%" }], invalid: { a: "2", b: "0", expectedError: "positive dissociation constant" } },
  ];

  for (const test of functionalCases) {
    await page.goto(`${baseUrl}/${encodeURI(test.href)}`, { waitUntil: "domcontentloaded" });
    if (test.inputLabel) {
      const inputLabel = (await page.locator("label:has(#b)").innerText()).replace(/\s+/g, " ").trim();
      if (!inputLabel.includes(test.inputLabel)) failures.push(`${test.href}: expected input label containing "${test.inputLabel}", received "${inputLabel}"`);
    }
    for (const check of test.checks) {
      await page.locator("#a").fill(check.a);
      await page.locator("#b").fill(check.b);
      if (check.c !== undefined) await page.locator("#c").fill(check.c);
      if (check.d !== undefined) await page.locator("#d").fill(check.d);
      await page.locator("#run").click();
      const metrics = (await page.locator("#metrics").innerText()).replace(/\s+/g, " ");
      if (!metrics.includes(check.expected)) {
        failures.push(`${test.href}: expected result "${check.expected}", received "${metrics}"`);
      }
    }
    if (test.invalid) {
      await page.locator("#a").fill(test.invalid.a);
      await page.locator("#b").fill(test.invalid.b);
      if (test.invalid.c !== undefined) await page.locator("#c").fill(test.invalid.c);
      if (test.invalid.d !== undefined) await page.locator("#d").fill(test.invalid.d);
      await page.locator("#run").click();
      const error = await page.locator("#error").innerText();
      if (!error.includes(test.invalid.expectedError)) {
        failures.push(`${test.href}: expected validation message "${test.invalid.expectedError}", received "${error}"`);
      }
    }
    checked.functional = (checked.functional || 0) + 1;
  }
} catch (error) {
  failures.push(`Browser QA runner error: ${error.stack || error.message}`);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ checked, failures }, null, 2));
if (failures.length) process.exitCode = 1;
