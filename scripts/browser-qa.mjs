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
      href: "grade5-physics-electric-circuits.html",
      checks: [
        { a: "9", b: "3", selects: { c: "closed", d: "light" }, expected: "Energy output Light" },
        { a: "9", b: "3", selects: { c: "open", d: "light" }, expected: "Current (enrichment) 0.00 A" },
        { a: "9", b: "3", selects: { c: "closed", d: "motion" }, expected: "Energy output Motion" },
      ],
      invalid: { a: "9", b: "0", expectedError: "positive resistance" },
    },
    {
      href: "grade4-physics-electric-circuits.html",
      checks: [{ a: "6", b: "3", expected: "Current 2.00 A" }],
      invalid: { a: "6", b: "0", expectedError: "Resistance must be greater than zero." },
    },
    { href: "grade6-physics-forces.html", checks: [{ a: "10", b: "2", expected: "Net force 10 N" }, { a: "0", b: "2", expected: "Force balance Balanced" }], invalid: { a: "10", b: "0", expectedError: "positive mass" } },
    { href: "grade7-physics-electromagnetism.html", checks: [{ a: "24", b: "8", c: "100", expected: "Magnetic field strength index 300.0 relative units" }], invalid: { a: "24", b: "8", c: "0", expectedError: "positive whole-number coil-turn count" } },
    {
      href: "grade7-physics-thermal-expansion.html",
      checks: [{ a: "1", b: "50", c: "1", d: "0.000012", expected: "Linear expansion 0.600 mm" }, { a: "1", b: "-50", c: "1", d: "0.000012", expected: "Linear expansion -0.600 mm" }],
      invalid: { a: "1", b: "50", c: "1", d: "-0.000012", expectedError: "non-negative expansion coefficient" },
    },
    {
      href: "grade8-physics-electricity-circuits.html",
      checks: [{ a: "9", b: "3", expected: "Current 3.000 A" }],
    },
    { href: "grade8-physics-forces-friction.html", checks: [{ a: "20", b: "5", c: "3", expected: "Acceleration 5.00 m/s²" }, { a: "5", b: "5", c: "2", expected: "Acceleration 0.00 m/s²" }], invalid: { a: "20", b: "5", c: "0", expectedError: "positive object mass" } },
    {
      href: "grade12-physics-ac-circuits.html",
      checks: [{ a: "30", b: "40", expected: "Impedance: 50.000 Ω" }],
    },
    {
      href: "grade12-chemistry-acid-base-titration.html",
      checks: [{ a: "0.1", b: "25", expected: "Equivalence base volume: 25.00 mL" }],
    },
    { href: "grade10-biology-cell-biology.html", checks: [{ a: "5", b: "5", expected: "Net diffusion direction No net diffusion" }], invalid: { a: "", b: "5", expectedError: "non-negative finite concentrations" } },
    { href: "grade10-biology-molecular-biology.html", checks: [{ a: "90", b: "30", expected: "Complete codons 30" }], invalid: { a: "10", b: "4", expectedError: "three bases are required for each complete codon" } },
    { href: "grade10-biology-human-physiology.html", checks: [{ a: "6", b: "70", expected: "Illustrative active heart rate 104 bpm" }], invalid: { a: "", b: "70", expectedError: "whole-number activity level from 1 to 10" } },
    { href: "grade10-biology-plant-physiology.html", checks: [{ a: "80", b: "70", expected: "Relative activity index 70%" }], invalid: { a: "", b: "70", expectedError: "finite water and light availability values" } },
    { href: "grade10-biology-evolution.html", checks: [{ a: "50", b: "20", expected: "Illustrative next frequency 51.0%" }], invalid: { a: "", b: "20", expectedError: "starting trait frequency and selection advantage" } },
    { href: "grade10-biology-homeostasis.html", checks: [{ a: "-10", b: "50", expected: "Remaining deviation -5.0" }], invalid: { a: "", b: "50", expectedError: "finite signed glucose deviation" } },
    { href: "grade10-biology-microbiology.html", checks: [{ a: "80", b: "50", expected: "Residual index 40.0%" }], invalid: { a: "", b: "50", expectedError: "exposure index and prevention coverage" } },
    {
      href: "grade10-biology-biomolecules.html",
      checks: [{ a: "37", b: "8", expected: "Relative enzyme activity: 80.0%" }],
      invalid: { a: "", b: "8", expectedError: "Enter a valid temperature above absolute zero" },
    },
    { href: "grade4-physics-heat-temperature.html", checks: [{ a: "2", b: "-5", expected: "Temperature change -5 °C" }] },
    { href: "grade5-physics-heat-transfer.html", checks: [{ a: "1", b: "-5", expected: "Temperature change -5 °C" }] },
    { href: "grade4-physics-motion-speed.html", checks: [{ a: "60", b: "12", expected: "Average speed 5.00 m/s" }] },
    { href: "grade4-chemistry-states-of-matter.html", checks: [{ a: "0", expected: "At melting/freezing point (solid/liquid boundary)" }, { a: "100", expected: "At boiling point (liquid/gas boundary)" }] },
    { href: "grade4-chemistry-dissolving-solubility.html", checks: [{ a: "25", b: "30", expected: "Relative dissolving rate 2.25×" }], invalid: { a: "-1", b: "30", expectedError: "water temperature from 0 to 100 °C" } },
    { href: "grade5-chemistry-mixtures-solutions.html", checks: [{ a: "10", b: "0.5", expected: "Concentration 20.00 g/L" }] },
    { href: "grade5-chemistry-acids-bases-neutralisation.html", checks: [{ a: "3", b: "5", expected: "Solution B classification Acidic" }, { a: "3", b: "11", expected: "Solution B classification Alkaline" }] },
    { href: "grade7-chemistry-acids-bases.html", checks: [{ a: "10", b: "4", expected: "Solution A classification Alkaline" }, { a: "10", b: "4", expected: "Solution B classification Acidic" }] },
    { href: "grade8-chemistry-atoms-elements-compounds.html", checks: [{ a: "2", b: "1", expected: "Particle composition Two atom types represented" }, { a: "3", b: "0", expected: "Particle composition One atom type represented" }] },
    { href: "grade6-chemistry-acids.html", checks: [{ a: "3", b: "10", expected: "Solution A Acidic" }] },
    { href: "grade4-biology-photosynthesis-growth.html", checks: [{ a: "50", b: "50", expected: "Limiting factor Both (equal)" }] },
    { href: "grade5-biology-photosynthesis-factors.html", checks: [{ a: "50", b: "50", expected: "Limiting factor Both (equal)" }] },
    { href: "grade5-biology-reproduction-life-cycles.html", checks: [{ a: "3", b: "50", expected: "Expected germinated seeds 1.5" }] },
    { href: "grade6-biology-reproduction.html", checks: [{ a: "3", b: "50", expected: "Expected germinated seeds 1.5" }] },
    { href: "grade6-biology-cells.html", checks: [{ a: "5", b: "3", expected: "Comparison More plant features" }] },
    { href: "grade7-chemistry-moles-concentration.html", checks: [{ a: "0.5", b: "1", expected: "Molar concentration: 0.500 mol/L" }] },
    { href: "grade7-biology-dna-genetics.html", checks: [{ a: "100", b: "50", expected: "Trait probability: 50%" }] },
    { href: "grade7-biology-dna-genetics.html", checks: [{ a: "30", b: "20", c: "50", expected: "Complementary thymine bases (T) 30" }, { a: "30", b: "20", c: "50", expected: "Base pairs represented 50" }] },
    { href: "grade8-biology-enzymes.html", checks: [{ a: "37", b: "8", expected: "Relative enzyme activity: 80.0%" }] },
    { href: "grade8-chemistry-reactions-conservation-mass.html", checks: [{ a: "12", b: "8", expected: "Product mass 20.0 g" }] },
    { href: "grade9-chemistry-stoichiometry.html", checks: [{ a: "2", b: "2", expected: "Simplified 1:1 comparison: Amounts are equal" }] },
    { href: "grade9-physics-momentum-collisions.html", checks: [{ a: "2", b: "4", c: "3", d: "0", expected: "Final shared velocity 1.60 m/s" }] },
    { href: "grade10-physics-electric-fields.html", checks: [{ a: "24", b: "8", c: "0.02", expected: "Electric field strength 1200.0 V/m" }], invalid: { a: "24", b: "8", c: "0", expectedError: "positive resistance and plate separation" } },
    { href: "grade10-physics-magnetic-induction.html", checks: [{ a: "200", b: "0.03", expected: "Induced emf magnitude 6.000 V" }, { a: "200", b: "-0.03", expected: "Induced emf magnitude 6.000 V" }], invalid: { a: "0", b: "0.03", expectedError: "positive whole-number coil-turn count" } },
    { href: "grade10-physics-thermal-physics.html", checks: [{ a: "100", b: "10", c: "300", expected: "PV/T index 3.333 kPa·L/K" }], invalid: { a: "100", b: "10", c: "0", expectedError: "positive finite pressure, volume, and absolute temperature" } },
    { href: "grade10-physics-waves-optics.html", checks: [{ a: "500", b: "0.6", c: "30", d: "1.5", expected: "Angle of refraction 19.5°" }], invalid: { a: "500", b: "0.6", c: "30", d: "0.5", expectedError: "refractive index of at least 1" } },
    { href: "grade10-physics-work-energy-power.html", checks: [{ a: "80", b: "6", c: "2", d: "5", e: "3", expected: "Average power from work 160.00 W" }], invalid: { a: "80", b: "-1", c: "2", d: "5", e: "3", expectedError: "non-negative displacement and speed" } },
    { href: "grade10-physics-newtonian-dynamics.html", checks: [{ a: "-60", b: "12", expected: "Acceleration -5.00 m/s²" }], invalid: { a: "60", b: "0", expectedError: "positive mass" } },
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
    { href: "grade11-physics-circular-gravitation.html", checks: [{ a: "7500", b: "7000000", c: "5.972e24", d: "1000", expected: "Gravitational field strength 8.134 m/s²" }, { a: "7500", b: "7000000", c: "5.972e24", d: "1000", expected: "Orbit condition Close to circular-orbit condition" }], invalid: { a: "7500", b: "0", c: "5.972e24", d: "1000", expectedError: "positive radius and both positive masses" } },
    { href: "grade12-physics-orbital-mechanics.html", checks: [{ a: "3.986e14", b: "7000000", expected: "Orbital speed 7.546 km/s" }], invalid: { a: "0", b: "7000000", expectedError: "Enter a positive gravitational parameter" } },
    { href: "grade11-chemistry-atomic-orbitals.html", checks: [{ a: "11", b: "3", expected: "Remaining capacity 7" }], invalid: { a: "19", b: "3", expectedError: "whole-number electron count from 0 to the shell capacity" } },
    { href: "grade10-chemistry-redox.html", checks: [{ a: "0.8", b: "0.3", expected: "Thermodynamic status Spontaneous" }, { a: "0.3", b: "0.3", expected: "Thermodynamic status At equilibrium" }, { a: "0.3", b: "0.8", expected: "Thermodynamic status Non-spontaneous" }] },
    { href: "grade12-chemistry-polymer-chemistry.html", checks: [{ a: "2500", b: "1000", expected: "Average degree of polymerisation 2.50" }] },
    { href: "grade12-chemistry-advanced-stoichiometry.html", checks: [{ a: "2", b: "3", expected: "Theoretical product amount 6.000 mol" }] },
    { href: "grade12-biology-advanced-immunology.html", checks: [{ a: "10", b: "5", expected: "Secondary response index 50.00" }] },
    { href: "grade10-biology-genetics.html", checks: [{ a: "50", b: "40", expected: "Expected trait count 20.0" }] },
    { href: "grade11-biology-cellular-respiration.html", checks: [{ a: "2", b: "30", c: "2", expected: "Aerobic ATP yield 60.0 mol ATP" }, { a: "2", b: "30", c: "2", expected: "Anaerobic ATP yield 4.0 mol ATP" }], invalid: { a: "2", b: "30", c: "0", expectedError: "positive aerobic and anaerobic ATP yields" } },
    { href: "grade11-biology-cell-signalling.html", inputLabel: "Dissociation constant", checks: [{ a: "2", b: "1", expected: "Receptor occupancy 66.67%" }], invalid: { a: "2", b: "0", expectedError: "positive dissociation constant" } },
    { href: "grade7-earth-space-solar-system.html", checks: [{ selects: { planet: "Earth" }, expected: "Mean orbital distance 1 AU" }] },
    { href: "grade7-earth-space-plate-tectonics.html", checks: [{ selects: { boundary: "transform", evidence: "fossils" }, expected: "Plates slide horizontally past one another" }] },
    { href: "grade7-earth-space-water-systems.html", checks: [{ inputs: { mass: "500", volume: "1000", removal: "40" }, expected: "After assumed treatment 0.300 mg/L" }], invalid: { inputs: { mass: "500", volume: "0", removal: "40" }, expectedError: "positive runoff volume" } },
    { href: "grade8-earth-space-universe.html", checks: [{ inputs: { temp: "5800", lum: "1" }, selects: { stage: "main", galaxy: "spiral", evidence: "cmb" }, expected: "Spectral class (approx.) G" }], invalid: { inputs: { temp: "0", lum: "1" }, expectedError: "positive temperature and luminosity" } },
    { href: "grade8-earth-space-weather-climate.html", checks: [{ inputs: { sst: "29", moisture: "75" }, selects: { air: "rising", rotation: "organized", pattern: "trade", current: "warm" }, expected: "Warm ocean (about 26.5°C or higher) Yes" }] },
    { href: "grade8-earth-space-carbon-cycle.html", checks: [{ inputs: { human: "10", natural: "1", land: "3", ocean: "2" }, expected: "Net atmospheric change +6.00 GtC/year" }], invalid: { inputs: { human: "-1", natural: "1", land: "3", ocean: "2" }, expectedError: "non-negative carbon flows" } },
    { href: "grade4-earth-space-seasons-moon.html", checks: [{ selects: { season: "summer", phase: "full" }, expected: "Season pattern Summer" }] },
    { href: "grade4-earth-space-water-cycle.html", checks: [{ selects: { process: "evaporation", sun: "high", surface: "erosion", timescale: "weather" }, expected: "Surface process Erosion — particles move" }] },
    { href: "grade4-earth-space-resources.html", checks: [{ selects: { resource: "coal", rock: "porous", action: "recycle" }, expected: "Resource type Nonrenewable" }] },
    { href: "grade5-earth-space-day-night.html", checks: [{ selects: { time: "noon" }, expected: "Shadow length Shortest" }] },
    { href: "grade5-earth-space-earth-processes.html", checks: [{ selects: { process: "sediment" }, expected: "Selected process Sedimentary rock formation" }] },
    { href: "grade5-earth-space-resources.html", checks: [{ selects: { resource: "water", solution: "conserve" }, expected: "Resource Water" }] },
    { href: "grade6-earth-space-seasons-tides.html", checks: [{ selects: { season: "june", tide: "spring" }, expected: "Orbital position June solstice" }] },
    { href: "grade6-earth-space-earth-systems.html", checks: [{ selects: { sphere: "hydrosphere", layer: "mantle", rock: "metamorphic" }, expected: "Selected sphere Hydrosphere" }] },
    { href: "grade6-earth-space-resource-management.html", checks: [{ selects: { challenge: "water", strategy: "efficiency" }, expected: "Challenge Water pollution and scarcity" }] },
    { href: "grade8-chemistry-acids-bases-indicators.html", checks: [{ a: "6.5", expected: "Universal indicator Yellow-green" }] },
    { href: "grade7-physics-friction.html", checks: [{ a: "10", b: "10", expected: "Direction Balanced", expectedExplanation: "remains at rest or continues at constant velocity" }] },
    { href: "grade11-biology-immune-response.html", checks: [{ a: "10", b: "5", expected: "Secondary response index 50.0", expectedExplanation: "5.00 memory multiplier" }] },
    { href: "grade10-physics-kinematics.html", checks: [{ a: "10", b: "1", expected: "Final velocity after 10 s 20.00 m/s" }] },
    { href: "grade10-physics-momentum-collisions.html", checks: [{ a: "2", b: "5", expected: "Momentum A 10.00 kg·m/s" }] },
    { href: "grade12-biology-gene-technology.html", checks: [{ a: "1000", b: "2", expected: "DNA fragments 3" }] },
  ];

  for (const test of functionalCases) {
    await page.goto(`${baseUrl}/${encodeURI(test.href)}`, { waitUntil: "domcontentloaded" });
    if (test.inputLabel) {
      const inputLabel = (await page.locator("label:has(#b)").innerText()).replace(/\s+/g, " ").trim();
      if (!inputLabel.includes(test.inputLabel)) failures.push(`${test.href}: expected input label containing "${test.inputLabel}", received "${inputLabel}"`);
    }
    for (const check of test.checks) {
      for (const [id, value] of Object.entries(check.inputs || {})) await page.locator("#" + id).fill(value);
      for (const id of ["a", "b", "c", "d", "e"]) {
        if (check[id] !== undefined) await page.locator("#" + id).fill(check[id]);
      }
      for (const [id, value] of Object.entries(check.selects || {})) await page.locator("#" + id).selectOption(value);
      await page.locator("#run").click();
      const metrics = (await page.locator("#metrics").innerText()).replace(/:\s*/g, " ").replace(/\s+/g, " ");
      const expected = check.expected.replace(/:\s*/g, " ");
      if (!metrics.includes(expected)) {
        const validationMessage = await page.locator("#error").innerText();
        failures.push(`${test.href}: expected result "${expected}", received "${metrics}" (validation: "${validationMessage}")`);
      }
      if (check.expectedExplanation) {
        const explanation = (await page.locator("#explain").innerText()).replace(/\s+/g, " ");
        if (!explanation.includes(check.expectedExplanation)) {
          failures.push(test.href + ': expected explanation containing "' + check.expectedExplanation + '", received "' + explanation + '"');
        }
      }
    }
    if (test.invalid) {
      for (const [id, value] of Object.entries(test.invalid.inputs || {})) await page.locator("#" + id).fill(value);
      for (const id of ["a", "b", "c", "d", "e"]) {
        if (test.invalid[id] !== undefined) await page.locator("#" + id).fill(test.invalid[id]);
      }
      for (const [id, value] of Object.entries(test.invalid.selects || {})) await page.locator("#" + id).selectOption(value);
      await page.locator("#run").click();
      const error = await page.locator("#error").innerText();
      if (!error.includes(test.invalid.expectedError)) {
        failures.push(`${test.href}: expected validation message "${test.invalid.expectedError}", received "${error}"`);
      }
    }
    checked.functional = (checked.functional || 0) + 1;
  }

  // Verify the student notebook saves, restores, filters, edits and deletes reports.
  await page.goto(`${baseUrl}/student-lab-notebook.html`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator("#report-title").fill("Browser QA investigation");
  await page.locator("#report-grade").selectOption("Grade 7");
  await page.locator("#report-subject").selectOption("Physics");
  await page.locator("#report-prediction").fill("Acceleration increases with net force.");
  await page.locator("#report-observations").fill("The measured acceleration increased.");
  await page.locator("#report-conclusion").fill("The results support the prediction.");
  await page.locator("#report-form button[type='submit']").click();
  if (!(await page.locator("#report-list").innerText()).includes("Browser QA investigation")) {
    failures.push("Student notebook did not display a newly saved report");
  }
  await page.reload({ waitUntil: "domcontentloaded" });
  if (!(await page.locator("#report-list").innerText()).includes("Browser QA investigation")) {
    failures.push("Student notebook did not restore a report after reload");
  }
  await page.locator("#report-filter").fill("Physics");
  if (!(await page.locator("#report-list").innerText()).includes("Browser QA investigation")) {
    failures.push("Student notebook report filter did not find the saved report");
  }
  await page.locator("[data-edit]").click();
  await page.locator("#report-conclusion").fill("Edited conclusion saved by browser QA.");
  await page.locator("#report-form button[type='submit']").click();
  page.once("dialog", dialog => dialog.accept());
  await page.locator("[data-delete]").click();
  if (await page.locator("#report-list").innerText().then(text => text.includes("Browser QA investigation"))) {
    failures.push("Student notebook did not delete a report");
  }
  const notebookState = await page.evaluate(() => localStorage.getItem("osdmaverick-lab-notebook-v1"));
  if (notebookState !== "[]") failures.push("Student notebook did not persist the empty report list after deletion");
  checked.notebook = 1;


  // Verify the teacher workflow imports a student backup and saves rubric feedback.
  await page.goto(`${baseUrl}/teacher-dashboard.html`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  const backup = {
    application: "OSDMaverick Virtual Science Lab",
    reports: [{
      id: "qa-student-report-001",
      title: "QA Forces Investigation",
      grade: "Grade 7",
      subject: "Physics",
      question: "How does force affect acceleration?",
      prediction: "More force increases acceleration.",
      method: "Change force while holding mass constant.",
      observations: "Acceleration increased as force increased.",
      evidence: "At double force, acceleration doubled.",
      conclusion: "The results support the prediction."
    }]
  };
  await page.locator("#import-file").setInputFiles({
    name: "student-report-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup))
  });
  await page.locator("#student-name").fill("QA Student");
  await page.locator("#import-button").click();
  await page.waitForFunction(() => document.querySelector("#import-status")?.textContent?.includes("imported." ) || document.querySelector("#import-status")?.textContent?.startsWith("Import failed:"), null, { timeout: 5000 });
  if (!(await page.locator("#submission-list").innerText()).includes("QA Forces Investigation")) {
    failures.push("Teacher dashboard did not import the student report backup");
  }
  await page.locator("[data-open]").click();
  await page.locator("#score-question").selectOption("3");
  await page.locator("#score-method").selectOption("4");
  await page.locator("#score-evidence").selectOption("3");
  await page.locator("#score-conclusion").selectOption("4");
  await page.locator("#teacher-feedback").fill("Clear investigation. Explain how the evidence supports the conclusion.");
  await page.locator("#assessment-form button[type='submit']").click();
  if (!(await page.locator("#submission-list").innerText()).includes("14/16")) {
    failures.push("Teacher dashboard did not save and display the rubric total");
  }
  const gradebookState = await page.evaluate(() => JSON.parse(localStorage.getItem("osdmaverick-teacher-gradebook-v1") || "[]"));
  if (gradebookState.length !== 1 || gradebookState[0].assessment?.feedback !== "Clear investigation. Explain how the evidence supports the conclusion.") {
    failures.push("Teacher dashboard did not persist assessment scores and feedback");
  }
  checked.teacherDashboard = 1;

  // Verify the account page explains setup safely when project credentials are absent.
  await page.goto(`${baseUrl}/auth.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#auth-status")?.textContent?.includes("Authentication is not connected yet"), null, { timeout: 5000 });
  if (!(await page.locator("#auth-status").innerText()).includes("Phase 1 setup guide")) {
    failures.push("Account page did not show safe Supabase setup guidance when unconfigured");
  }
  checked.authSetup = 1;

  // Verify class management presents safe setup guidance before Supabase is configured.
  await page.goto(`${baseUrl}/classes.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#classes-status")?.textContent?.includes("Class management is not connected yet"), null, { timeout: 5000 });
  if (!(await page.locator("#classes-status").innerText()).includes("Phase 2 administrator guides")) {
    failures.push("Class management did not show safe backend setup guidance when unconfigured");
  }
  checked.classManagementSetup = 1;


  // Verify the assignments workspace explains backend setup safely when unconfigured.
  await page.goto(`${baseUrl}/assignments.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#assignment-status")?.textContent?.includes("Assignments are not connected yet"), null, { timeout: 5000 });
  if (!(await page.locator("#assignment-status").innerText()).includes("three database migrations")) {
    failures.push("Assignments page did not show safe Supabase setup guidance when unconfigured");
  }
  checked.assignmentsSetup = 1;


  // Verify the formative quiz engine marks answers, explains results and persists history.
  await page.goto(`${baseUrl}/quizzes.html`, { waitUntil: "domcontentloaded" });
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.locator('[data-quiz="grade7-science-core"]').click();
  const quizInputs = page.locator("#question-list input[type=radio]");
  const quizCount = await quizInputs.count();
  if (quizCount !== 24) failures.push(`Quiz expected 24 answer options, found ${quizCount}`);
  for (let i = 0; i < 6; i++) await page.locator(`input[name="q-${i}"][value="${[1,2,3,1,1,1][i]}"]`).check();
  await page.locator("#submit-quiz").click();
  if (!(await page.locator("#quiz-score").innerText()).includes("6 / 6")) failures.push("Quiz did not calculate the expected 6/6 score");
  if (!(await page.locator("#question-list").innerText()).includes("Newton’s second law")) failures.push("Quiz did not show explanatory feedback");
  const quizState = await page.evaluate(() => JSON.parse(localStorage.getItem("osdmaverick-quiz-attempts-v1") || "[]"));
  if (quizState.length !== 1 || quizState[0].score !== 6) failures.push("Quiz attempt was not persisted to local storage");
  await page.reload({ waitUntil: "domcontentloaded" });
  if (!(await page.locator("#attempt-history").innerText()).includes("Grade 7 Science Foundations")) failures.push("Quiz attempt history did not restore after reload");
  checked.quizEngine = 1;

  // Content studio must fail safely and explain setup when Supabase is not configured.
  await page.goto(`${baseUrl}/content-studio.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#content-status")?.textContent?.includes("Content studio is not connected yet"), null, { timeout: 5000 });
  if (!(await page.locator("#content-status").innerText()).includes("migrations 1–7")) {
    failures.push("Content studio did not show safe Supabase setup guidance when unconfigured");
  }
  if (await page.locator("#content-workspace").isVisible()) failures.push("Content studio exposed the workspace without backend configuration");
  checked.contentStudioSetup = 1;

  // Student learning must explain setup and keep its workspace hidden without Supabase.
  await page.goto(`${baseUrl}/learning.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#learn-status")?.textContent?.includes("My learning is not connected yet"), null, { timeout: 5000 });
  if (!(await page.locator("#learn-status").innerText()).includes("migrations 1–8")) {
    failures.push("Student learning page did not show safe Supabase setup guidance when unconfigured");
  }
  if (await page.locator("#learn-workspace").isVisible()) failures.push("Student learning exposed content without backend configuration");
  checked.studentLearningSetup = 1;

  // Progress analytics must fail safely when Supabase is not configured.
  await page.goto(`${baseUrl}/progress.html`, { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => document.querySelector("#progress-status")?.textContent?.includes("Supabase is not configured"), null, { timeout: 5000 });
  if (await page.locator("#progress-content").isVisible()) failures.push("Progress analytics exposed a dashboard without backend configuration");
  checked.progressAnalyticsSetup = 1;

} catch (error) {
  failures.push(`Browser QA runner error: ${error.stack || error.message}`);
} finally {
  await browser.close();
}

console.log(JSON.stringify({ checked, failures }, null, 2));
if (failures.length) process.exitCode = 1;
