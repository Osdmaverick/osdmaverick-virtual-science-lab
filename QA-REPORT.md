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
