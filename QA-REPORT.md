# Quality assurance report — 2026-11-02

## Scope

Initial Phase 2 QA for the Grade 4–12 Virtual Science Lab. The grade directory contains **268 unique lab-page links**. This pass smoke-tested one Physics, one Chemistry, and one Biology lab for each grade (27 representative pages total).

## Representative coverage

| Grade | Physics | Chemistry | Biology |
|---|---|---|---|
| 4 | `grade4-physics-electric-circuits.html` | `grade4-chemistry-acids-bases-indicators.html` | `grade4-biology-breathing-respiration.html` |
| 5 | `grade5-physics-balanced-unbalanced-forces.html` | `grade5-chemistry-acids-bases-neutralisation.html` | `grade5-biology-adaptations-environments.html` |
| 6 | `grade6-physics-circuits.html` | `grade6-chemistry-acids.html` | `grade6-biology-cells.html` |
| 7 | `grade7-physics-distance-displacement.html` | `grade7-chemistry-acids-bases.html` | `grade7-biology-cell-division.html` |
| 8 | `grade8-physics-electricity-circuits.html` | `grade8-chemistry-acids-bases-indicators.html` | `grade8-biology-cell-structure.html` |
| 9 | `grade9-physics-electric-circuits.html` | `grade9-chemistry-acids-bases.html` | `grade9-cell-structure.html` |
| 10 | `grade10-physics-circular-motion.html` | `grade10-chemistry-acids-bases.html` | `grade10-biology-biomolecules.html` |
| 11 | `grade11-physics-circular-gravitation.html` | `grade11-chemistry-atomic-orbitals.html` | `grade11-biology-cell-signalling.html` |
| 12 | `grade12-physics-ac-circuits.html` | `grade12-chemistry-acid-base-titration.html` | `grade12-biology-advanced-immunology.html` |

## Checks performed

- All 27 selected pages were fetched successfully from the current `main` branch.
- All 27 contain a lab main region, viewport metadata, and references to the shared `assets/styles.css` and `assets/main.js`.
- All inline scripts in the 27 selected pages passed JavaScript syntax compilation.
- Shared `assets/main.js` passed JavaScript syntax compilation.
- Shared CSS passed a structural brace-balance check (173 opening and 173 closing braces).
- The reduced-motion control was exercised in a mock-DOM simulation: normal pause/play state changes worked, and switching the preference to reduced motion paused and disabled the control.
- Source inspection confirmed a native button with an `aria-pressed` state and visible keyboard-focus styling, plus reduced-motion CSS and mobile breakpoints.

## Findings and limitations

- No confirmed JavaScript syntax, shared-asset wiring, or reduced-motion state defect was found in this representative pass.
- The 268 count is the number of unique lab links in the directory; this pass did **not** independently fetch every linked page.
- No live browser rendering, real keyboard navigation, touch interaction, or physical-device mobile testing was performed. No browser-test claim is made.
- Calculator outputs, experiment validation, and scientific models were not exhaustively re-tested across all 268 pages. Those require a deeper functional test pass.

## Next QA step

Continue with an automated all-page link and asset audit, then run focused functional checks for representative calculations and validation boundaries before starting advanced simulation work.

## Browser QA automation added — 2026-11-02

A Playwright-based browser smoke test and a second GitHub Actions job were added after the initial representative source checks.

- `scripts/browser-qa.mjs` is designed to open every directory-linked lab page in Chromium, check for uncaught page errors and missing shared animation controls/assets, and test mobile overflow on a representative subset.
- It also checks reduced-motion behaviour once per grade and keyboard focus plus Enter-key pause behaviour.
- `.github/workflows/qa.yml` now runs the static checker first and then installs Chromium/Playwright to run the browser checks.

**Execution status:** The scripts and workflow were fetched back from GitHub and passed JavaScript syntax checks. A completed GitHub Actions run was not exposed by the available repository connection at the time of this report update. Therefore, the Playwright browser checks are implemented but are not claimed as executed or passed. Real browser results should be reviewed in the repository's Actions tab after the workflow completes.


## Functional calculator QA added — 2026-11-02

A representative Playwright functional suite was added to `scripts/browser-qa.mjs` for five labs:

- Grade 4 Physics: Ohm's law current output and zero-resistance rejection.
- Grade 8 Physics: current calculation.
- Grade 12 Physics: series-circuit impedance calculation.
- Grade 12 Chemistry: 1:1 strong acid–strong base equivalence-volume calculation using the displayed fixed 0.1 M base concentration.
- Grade 10 Biology: enzyme-activity output and empty-temperature rejection.

The Grade 10 enzyme lab previously converted an empty temperature input to 0 °C and calculated an activity value. It now rejects empty/non-finite temperatures and temperatures at or below absolute zero, and rejects empty/non-finite or out-of-range suitability values.

**Execution status:** The updated browser runner and Grade 10 inline script passed JavaScript syntax compilation after being fetched from GitHub. These new Playwright functional checks are committed but have not yet been confirmed running in GitHub Actions; no browser execution or pass is claimed. The calculator models have only received this focused representative review, not an exhaustive scientific validation of all 268 labs.

## Expanded representative calculator coverage — 2026-11-02

The Playwright functional suite now includes additional representative checks across Grades 4–12 and all three subjects. In addition to the original five, it exercises average speed, solution concentration, pH classification, molar concentration, an illustrative genetics input model, enzyme activity, simplified stoichiometry, inelastic-collision momentum, projectile range, buffer pH, Michaelis–Menten rate, the Nernst equation, and nerve-signal travel time.

The tests assert displayed outputs from the pages' stated assumptions; they are not a substitute for a full curriculum/scientific review. The Grade 9 stoichiometry page explicitly labels its ratio comparison as a simplified 1:1 model and warns that equal mole amounts do not establish an atom-balanced equation.

**Execution status remains pending:** the expanded Playwright suite has been committed but a completed GitHub Actions run has not been returned by the repository connection. No browser-test pass is claimed.

## Browser assertion reliability and additional checks — 2026-11-02

A review of the Playwright runner found that its metrics-text normalizer was matching a literal backslash sequence rather than whitespace. This could cause valid calculator results to fail assertions when labels and values are separated by line breaks in the rendered metrics. The normalizer now collapses actual whitespace before matching expected output. Three additional representative functional cases were added: Grade 6 Biology cell-feature comparison, Grade 8 Chemistry closed-system mass conservation, and Grade 11 Physics wave speed. These checks validate the pages' documented simplified models; they do not establish experimental fidelity or replace scientific curriculum review.

**Execution status remains pending:** the runner has been corrected in source, but no completed Chromium/Playwright run has yet been confirmed.

## Grade 10 thermochemistry unit correction — 2026-11-02

A scientific unit error was confirmed in `grade10-chemistry-thermochemistry.html`: the page used a specific heat capacity of 4.18 J/(g·°C) with mass in grams, calculated heat in joules, but labelled the unconverted value as kJ. The calculation now divides by 1,000 before displaying kJ. The result is labelled as heat change in the solution so the sign is meaningful: positive values indicate heat absorbed and negative values indicate heat released. Input validation now requires a positive finite mass and a finite temperature change, while retaining valid negative temperature changes for exothermic cases. The browser suite now includes positive and negative heat-change checks plus blank-mass rejection.

**Execution status:** source changes are committed, but browser execution is still unconfirmed; expected outputs have been derived from q = mcΔT and the stated water-like specific heat assumption.

## Additional senior-grade functional coverage — 2026-11-02

The Playwright suite now includes eight further calculator cases across Grades 10–12:

- Grade 10 Physics: centripetal acceleration.
- Grade 11 Physics: centripetal acceleration at a second grade level.
- Grade 12 Physics: circular orbital speed from the gravitational parameter and orbital radius.
- Grade 11 Chemistry: simplified principal-shell capacity (2n²).
- Grade 12 Chemistry: theoretical product amount from a stated coefficient ratio.
- Grade 12 Biology: illustrative secondary immune-response index.
- Grade 10 Biology: expected trait count from an explicitly simplified probability model.
- Grade 11 Biology: fractional receptor occupancy using L/(Kd + L).

The expected values were checked against each page's displayed equation and stated assumptions. These are source/formula-derived assertions, not evidence of browser execution or a full scientific validation.
Three of the new cases also include invalid-input boundary assertions: non-positive orbital gravitational parameter, electron count above the selected shell capacity, and a non-positive receptor dissociation constant.

**Execution status remains pending:** the expanded tests are committed, but the repository connection has not returned a completed GitHub Actions run. No Playwright pass is claimed.

## Grade 11 cell-signalling terminology correction — 2026-11-02

The receptor-occupancy model calculates fractional occupancy as L/(Kd + L), where Kd is the ligand–receptor dissociation constant. The Grade 11 Biology input had been labelled “receptor affinity”, which is not equivalent to Kd (affinity is inversely related to Kd). The input label now explicitly identifies the dissociation constant, and the browser functional suite checks that terminology alongside the existing 66.67% occupancy and invalid-Kd boundary assertions.

**Execution status remains pending:** this is a source-level terminology correction and a committed browser assertion; it has not been confirmed in a completed Chromium/Playwright run.

## Grade 5 neutralisation output-label correction — 2026-11-03

A source review found that the second pH input is labelled “Solution B”, but its result was labelled “Base classification”. Because the model accepts any pH from 0 to 14 for Solution B—including acidic and neutral values—the output label incorrectly implied that Solution B must be a base. The output is now labelled “Solution B classification”, and the Playwright functional suite includes both acidic and alkaline Solution B examples. This correction clarifies the model's output without changing its calculations.

**Execution status remains pending:** the source and browser assertions are committed, but no completed Playwright/GitHub Actions run has been confirmed.

## Grade 7 acid/base classification labels — 2026-11-03

The Grade 7 pH model accepts any pH value from 0 to 14 for either input, but its output labels called input A an “Acid solution” and input B a “Base solution”. That wording was misleading when a user entered alkaline pH for A or acidic pH for B. Both outputs now use neutral “Solution A/B classification” labels while retaining the same pH classification logic. The browser suite now covers an alkaline Solution A and acidic Solution B.

**Execution status remains pending:** the source and browser assertions are committed, but no completed Playwright/GitHub Actions run has been confirmed.

## Grade 8 elements/compounds model wording — 2026-11-03

The Grade 8 particle model accepts counts of two atom types but has no input describing whether atoms are chemically bonded. Its previous output classified any mixture of two atom types as a “Compound particle model”, even though the explanatory text correctly noted that a compound requires chemical bonding. The output now reports only whether one or two atom types are represented; the explanation retains the condition that a compound requires chemically bonded atoms. Browser assertions cover both one-type and two-type compositions.

**Execution status remains pending:** this correction and its source-level browser assertions are committed; no completed browser run has been confirmed.

## Grade 10 titration calculator completion — 2026-11-03

The Grade 10 Chemical Analysis page described calculating an unknown concentration but previously accepted only the known concentration and known aliquot volume; it could report the moles in that aliquot but could not calculate the unknown concentration. A third input now captures the unknown solution's titre volume. Under an explicitly stated 1:1 equivalence assumption, the calculator uses c₁V₁ = c₂V₂ to return the unknown concentration and rejects missing, non-finite, or non-positive inputs. The Playwright suite now checks a 0.12500 mol/L example (0.1 mol/L × 25 mL ÷ 20 mL) and rejects a zero titre volume.

**Execution status remains pending:** source-level verification and test assertions are committed; no completed Chromium/Playwright run has been confirmed.

## Grade 10 Chemistry calculator validation — 2026-11-03

A focused review found four Grade 10 Chemistry calculators that accepted incomplete or physically invalid inputs: the VSEPR model had no checks on bonding/lone pairs; the pollutant-removal model accepted negative or blank concentration; the alkane formula checker accepted zero or fractional atom counts; and the cell-potential calculator converted blank inputs to zero. These now validate finite, integer, and non-negative/positive domains as appropriate. The VSEPR model is explicitly bounded to 2–6 electron domains and explains that electron-domain geometry is not always identical to molecular shape. The environmental model also clarifies that its removal fraction is illustrative rather than tied to a specific treatment process. The browser suite now includes normal-output and invalid-boundary assertions for all four.

**Execution status remains pending:** code and assertions are committed, but no completed browser run has been confirmed.

## Grade 11 lattice-attraction input and assumption clarification — 2026-11-03

The Grade 11 lattice-attraction model calculates q²/r² from a single charge-magnitude input, which implicitly assumes two equal charge magnitudes. Its previous validation accepted a negative value even though the output called it a magnitude. The input now requires a positive charge magnitude, and the explanation states the equal-charge assumption explicitly. A Playwright case checks the q=2, r=3 relative index (0.444) and rejects a negative magnitude.

**Execution status remains pending:** the source and browser assertions are committed, but no completed browser execution has been confirmed.

## Additional Chemistry precision corrections — 2026-11-03

Two further refinements were made during the senior-grade review. The Grade 10 electrochemical cell page now distinguishes positive, zero, and negative standard cell potentials as spontaneous, at equilibrium, and non-spontaneous, respectively; zero potential is no longer grouped with negative values. The Grade 12 polymer page now reports average degree of polymerisation to two decimal places rather than rounding an average ratio to a whole number. The Grade 11 lattice-attraction explanation was also refined to state that the simplified q²/r² index represents oppositely charged ions with equal charge magnitudes. Browser assertions cover all three electrochemical sign cases and a non-integer polymerisation average.

**Execution status remains pending:** these changes and assertions are committed; no completed browser run has been confirmed.

## Grade 4 Chemistry temperature-model boundaries — 2026-11-03

The Grade 4 states-of-matter model previously assigned 0°C to the liquid category and 100°C to the gas category without identifying either phase boundary. It now labels these exact water-reference temperatures as the solid/liquid and liquid/gas boundaries (at standard atmospheric pressure). The Grade 4 dissolving-rate illustration previously allowed subzero water temperatures, which could make its linear illustrative rate factor negative. Its input is now bounded to 0–100°C for the stated liquid-water classroom model, while stirring rate remains non-negative. Playwright assertions cover both phase boundaries, a normal dissolving-rate example, and rejection of a subzero input.

**Execution status remains pending:** source and test changes are committed; no completed browser execution has been confirmed.

## Physics signed temperature-change labels — 2026-11-03

The Grade 4 and Grade 5 water-heating calculators accept negative ΔT values to represent cooling and correctly calculate negative heat transfer, but their result labels called every value “Temperature rise”. Both outputs now say “Temperature change”, which is accurate for positive heating and negative cooling. Playwright assertions cover negative temperature changes on both pages.

**Execution status remains pending:** source and test changes are committed; no completed browser run has been confirmed.

## Grade 7 thermal-expansion model completion — 2026-11-03

The Grade 7 page was titled “Thermal Expansion and Heat” but its only calculation was heat transfer, Q = mcΔT; no expansion quantity was calculated. The investigation now retains the water heat-transfer calculation and adds initial length and linear expansion coefficient inputs. It calculates ΔL = αL₀ΔT and final length, with an explicit constant-coefficient assumption and validation for positive mass/length and non-negative coefficient. Browser cases cover expansion and contraction for ±50°C and reject a negative coefficient.

**Execution status remains pending:** the new model and assertions are committed, but no completed browser run has been confirmed.

## Physics model alignment refinements — 2026-11-03

The Grade 6 Newton's-law calculator treated the applied force as the net force (explicitly neglecting friction and other forces), but labelled the input/output only “Applied force”. The input and result now say “Net force”, matching F = ma. The Grade 7 Electricity and Electromagnetism page calculated current and power but had no electromagnetism quantity. It now adds a coil-turn input and a clearly labelled relative solenoid-field index proportional to N × |I|, with fixed geometry/core assumptions and whole-number turn validation. Browser tests cover both changes and their invalid-input boundaries.

**Execution status remains pending:** source changes and assertions are committed; no completed browser run has been confirmed.

## Grade 10 Physics electric-field and induction model corrections — 2026-11-03

The Grade 10 “Electric Fields and Circuits” page previously calculated only Ohm's-law current and power despite its electric-field curriculum title. It now adds plate separation and estimates the uniform parallel-plate field magnitude E = |ΔV|/d, explicitly neglecting edge effects. The Grade 10 induction model previously multiplied signed flux-change rate by turns while labelling the result an emf magnitude, and accepted zero/negative coil turns. It now requires a positive whole-number turn count and reports N × |dΦ/dt|, explaining that sign affects polarity while the displayed result is magnitude. Playwright assertions cover both models and invalid boundaries, including positive and negative flux-change rates.

**Execution status remains pending:** source changes and test assertions are committed; no completed browser execution has been confirmed.

## Grade 10 Physics model completion and validation — 2026-11-03

Three Grade 10 Physics pages were incomplete relative to their stated learning objectives. The gas-law page previously accepted pressure and volume only despite describing PV/T; it now accepts absolute temperature in kelvin and calculates the PV/T index for a fixed amount of ideal gas. The waves/optics page now includes incidence angle and refractive index, calculating reflection and refraction angles with Snell's law as well as wave speed/period. The work-energy-power page previously calculated work only; it now also accepts mass, speed and elapsed time to calculate kinetic energy and average power. The Newtonian dynamics calculator now rejects blank/non-finite net force and invalid mass, and checks the resulting acceleration. Playwright assertions cover representative outputs and invalid boundaries.

**Execution status remains pending:** source and tests are committed; no completed browser run has been confirmed.

## Grade 11 circular gravitation model completion — 2026-11-03

The Grade 11 “Circular Motion and Gravitation” page previously calculated centripetal acceleration only, despite its learning objective and explanation also promising gravitational force. It now accepts central-body and orbiting-body masses and calculates gravitational field strength, gravitational force, required centripetal force, and the percentage difference between gravitational and required centripetal force. It uses G = 6.67430 × 10⁻¹¹ SI units and marks a match within 5% as close to the circular-orbit condition; the explanation states that this is not a full orbit propagator. The Playwright test now uses an Earth/satellite example and checks the field-strength and orbit-condition outputs, plus invalid-radius rejection.

**Execution status remains pending:** source and tests are committed; no completed browser run has been confirmed.

## Biology model precision corrections — 2026-11-03

The Grade 4 and Grade 5 photosynthesis models selected a single limiting factor when both supplied resources were equal; the tie is now reported as “Both (equal)” rather than arbitrarily choosing one. The Grade 5 seed-germination model rounded an expected-value calculation to a whole seed, which obscured the statistical meaning (for example, 3 seeds at 50% gives an expected count of 1.5). It now displays one decimal place. Playwright assertions cover both equal-resource cases and the fractional expected germination count.

**Execution status remains pending:** source changes and assertions are committed; no completed browser execution has been confirmed.

## Grade 6 germination expected-value precision — 2026-11-03

The Grade 6 seed-germination model rounded expected germinated seeds to a whole number. As with the Grade 5 model, an expected count is a statistical average and may be fractional (for example, 3 seeds at a 50% germination rate has an expected value of 1.5). The display now preserves one decimal place, with a Playwright assertion for that example.

**Execution status remains pending:** source and assertion are committed; no completed browser run has been confirmed.

## Grade 7 DNA base-pairing model completion — 2026-11-03

The Grade 7 DNA/genetics page claimed to explore DNA base pairing, but its “DNA bases” input was only displayed and did not calculate complementary bases. It now accepts adenine and cytosine counts, calculates complementary thymine and guanine counts using A–T and C–G pairing, and reports the total base pairs represented. Trait probability remains a separate illustrative input; the page explicitly states that it is not inferred from the base counts. Playwright assertions check complementary bases and total base pairs.

**Execution status remains pending:** the source and test assertions are committed; no completed browser execution has been confirmed.

## Grade 10 Biology diffusion and input validation — 2026-11-03

The Grade 10 cell-biology model previously labelled equal inside/outside concentrations as “Out of cell”; it now reports “No net diffusion” and rejects blank or invalid concentration inputs. The evolution, homeostasis and microbiology models also converted blank numeric inputs to zero and accepted them as valid. They now require explicit finite inputs within their stated ranges. Playwright tests cover equal-concentration diffusion, representative model outputs, and blank-input rejection.

**Execution status remains pending:** source and test changes are committed; no completed browser execution has been confirmed.

## Grade 11 cellular respiration pathway comparison — 2026-11-03

The Grade 11 Cellular Respiration page stated that students would compare aerobic and anaerobic ATP yield, but accepted only one ATP-per-glucose value and always labelled the result aerobic. It now accepts separate aerobic and anaerobic yields and reports the total ATP amount in mol ATP for the supplied glucose amount in mol. The default teaching comparison uses 30 ATP/glucose aerobically and 2 ATP/glucose for fermentation, with an explanation that aerobic yield varies by cell and shuttle system. Playwright assertions cover both pathway outputs and reject a zero yield.

**Execution status remains pending:** source and tests are committed; no completed browser execution has been confirmed.

## Mock-DOM regression check — 2026-11-03

A lightweight execution harness ran the updated inline scripts against mocked form elements and caught a const reassignment in the Grade 10 evolution, homeostasis and microbiology calculators after their validation changes. The result arrays are now mutable where reassigned. This is a source-level mock-DOM check only; it does not replace the full Playwright/browser suite.

## Cross-subject mock-DOM verification — 2026-11-03

After the regression fix, 18 representative valid-input executions passed in a lightweight mock-DOM harness, and 15 invalid-input boundary executions produced their expected validation errors. A further 16 modified Chemistry/Physics pages passed inline JavaScript syntax compilation. These checks exercise calculator scripts with mocked form elements; they do not verify real browser rendering, keyboard interaction, responsive layout, or full Playwright execution.

## Additional mock-DOM regression fixes — 2026-11-03

The mock-DOM execution checks also exposed const reassignment in the Grade 10 titration and environmental-chemistry calculators after recent feature/validation edits. Their result arrays now use mutable declarations. The corresponding calculator executions were rerun after correction.
