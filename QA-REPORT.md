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

## Mock-DOM verification totals — 2026-11-03

After fixing the additional result-array declaration errors found during execution, the cross-subject mock-DOM harness passed **34 valid-output checks** and **22 invalid-input checks** across the updated Chemistry, Physics and Biology calculators. These are targeted script executions with mocked DOM elements, not full browser tests. The expanded Playwright suite contains 65 functional page cases; its real Chromium execution remains unverified.

## Curriculum alignment audit progress — 2026-11-03

Started a standards-based curriculum alignment review using current Texas Science TEKS and TEA STAAR assessed-curriculum resources. Created `CURRICULUM-ALIGNMENT.md` to record exact standards, enrichment boundaries, and unresolved gaps. Verified and corrected the initial Grade 4 and Grade 5 Physics, Biology, and Chemistry samples. In particular, grade-level objectives are now separated from advanced calculator extensions, and the Grade 5 circuit lab now models open/closed paths and four possible energy outputs. The Playwright suite now contains 66 functional page cases. The current navigation inventory contains 268 linked science labs (including eight Grade 9 Biology pages whose filenames do not include the `biology` prefix).

**Validation caveat:** source-level and mock-DOM checks are available for the recent circuit model, but a full Chromium run and successful GitHub Actions workflow have not been confirmed. The complete TEKS crosswalk for all labs remains in progress.

## Curriculum alignment review: Grade 6 — 2026-11-03

Completed an initial Grade 6 sample review across Physics, Chemistry, and Biology using the adopted Grade 6 TEKS. Updated learning objectives to distinguish direct expectations from enrichment, corrected the Grade 6 motion page objective so it no longer claims to calculate acceleration, and clarified the difference between Newton's Third Law force pairs and the optional (F=ma) calculation. The Grade 6 force model now reports balanced/unbalanced status. Circuit model and force model updates passed targeted mock-DOM checks, including open/closed circuit outcomes and balanced/unbalanced force classification.

**Execution status:** targeted mock-DOM checks passed; full browser/Playwright execution remains unconfirmed.

## Grade 7–8 curriculum scope review — 2026-11-03

An initial sample-based alignment review was completed against the adopted 2021 Texas Grade 7 and Grade 8 Science TEKS. The review identified several pages whose calculator focus exceeded or did not fully represent the grade-level expectation. The lab objectives and explanatory notes were updated to distinguish direct expectations from enrichment:

- Grade 7: acceleration, momentum/impulse, mechanical-energy calculations, molarity, ionic/covalent bonding, detailed mitosis/meiosis, and DNA base-pairing/probability are now identified as extensions where appropriate. The Grade 7 motion and matter objectives now distinguish the actual standard from those advanced calculations.
- Grade 8: the forces/friction model now accepts mass and calculates acceleration from net force using Newton's Second Law. The work equation is marked enrichment. The sound-wave page states that longitudinal sound and wave-speed calculation do not by themselves cover the transverse-wave/electromagnetic-spectrum requirement. Cell-organelle functions and genes-on-chromosomes expectations are now explicit in the sampled Biology pages.
- Grade 8 Chemistry notes distinguish the mass-conservation principle from the current idealized model, which assigns product mass equal to reactant mass rather than simulating an actual reaction.

The Playwright functional suite was repaired after inspection found three malformed object boundaries in its functional-case list. A new Grade 8 Physics functional case checks acceleration for a 15 N net force on a 3 kg object (5.00 m/s²), zero acceleration at zero net force, and rejection of zero mass. The suite now contains **67 functional page cases**.

**Execution status:** these changes and test assertions are committed to main, but no completed Chromium/Playwright run or successful GitHub Actions result has been confirmed. The curriculum review covers selected pages only; it does not establish complete Grade 7–8 or Grade 4–12 alignment.

### Grade 7–8 follow-up corrections — 2026-11-03

The Grade 7 chemical-equation page now states that its single-element atom-count comparison is a Grade 8 bridge and does not balance a full equation. The Grade 8 g/L solutions calculator is explicitly marked enrichment rather than a named Grade 8 student expectation. The browser functional-case array was checked for balanced object/array delimiters after repair; this is a source-structure check, not a Chromium test.

## High-school course TEKS sample review — 2026-11-03

Started the high-school course crosswalk against adopted 2020 Biology, Chemistry and Physics TEKS. The review records that the repository's Grade 9–12 labels are a sequencing structure, while the state standards are organized by course (Biology §112.42, Chemistry §112.43, Physics §112.45), not separate grade-level Physics/Chemistry/Biology standards.

Sampled findings and corrections:
- **Biology:** Grade 9 DNA/protein synthesis maps to gene expression and protein synthesis; Grade 10 enzyme activity is relevant to the enzyme expectation; the page title was narrowed to Enzyme Activity Factors to match the actual task; Grade 11 receptor occupancy is advanced enrichment; Grade 12 immune-response multiplication is an illustrative index rather than a physiological model.
- **Chemistry:** Grade 9's 1:1 amount comparison is now explicitly identified as preparatory, not complete stoichiometry; Grade 10 q = mcΔT is connected to calorimetry/heat calculations and is labelled solution heat rather than reaction enthalpy; Grade 11 Henderson–Hasselbalch and Grade 12 Nernst calculations are labelled advanced extensions beyond the explicitly named student expectations.
- **Physics:** Grade 9 kinematics and Grade 10 projectile motion map to course motion expectations; projectile assumptions are now explicit. Grade 11 circular gravitation is connected to Newton's Second Law/universal gravitation. Grade 12 AC impedance is labelled extension beyond the explicitly named series/parallel and Ohm's-law expectations.

**Execution status:** source updates and audit documentation are committed, but the sample review is not a complete course crosswalk. No completed Chromium/Playwright run or successful GitHub Actions result has been confirmed.

### High-school sample follow-up corrections — 2026-11-03

Additional page reviews found and clarified several scope gaps:
- Grade 11 Physics vectors now describes a single-vector component calculation, not multi-vector resultant displacement.
- Grade 12 Physics wave-optics page was retitled to single-slit diffraction because its calculator does not model polarisation.
- Grade 9 Chemistry pH is labelled classification-only; Grade 10 limiting-reactant comparison is labelled fixed 1:1; Grade 11 reaction-rate output is identified as an illustrative index; Grade 12 advanced stoichiometry is bounded to a single supplied coefficient ratio and one limiting reactant.
- Grade 10 Biology homeostasis is labelled an illustrative correction index; Grade 11 gene-expression title/objective now match codon-count arithmetic rather than claiming transcription/translation; Grade 12 genomics is labelled a sequence-identity comparison rather than a bioinformatics alignment workflow.

## Grade 7–8 expanded objective and model-scope review — 2026-11-03

Expanded the review across the directory's **60 Grade 7–8 labs** by examining each subject page's learning objective and principal model inputs/outputs. This is not a claim that all scientific prose, equations, or interactions have received a complete audit.

Key updates committed:
- Biology: 14 Grade 7–8 pages received explicit TEKS scope/model-limit notes, covering organ systems, digestive absorption, trophic energy transfer, microorganisms, plant physiology, cell transport, population/resource indices, enzyme curves, feedback, photosynthesis, respiration and evolution.
- Chemistry: sampled pages now distinguish Grade 7 pH, isotopes, organic formulas, periodic trends, reaction-rate indices and redox from the direct grade expectations; Grade 8 acid/base classification is linked to 8.6(D), while separation, group/period coordinates, pollution treatment, and combustion are labelled appropriately. The Grade 8 water-state page was retitled to **Water Phase Changes** because it does not model chemical change.
- Physics: Grade 7 distance/displacement, friction and thermal transfer are connected to 7.7/7.8; Newton's Second Law, electrical current/power, vector components, expansion, and wave calculations are labelled enrichment or Grade 8 bridges. Grade 8 heat, light, magnetism, measurement, speed, and pressure pages now distinguish direct standards from review or extension content.

The official adopted TEKS state that Grade 7 and Grade 8 students should spend at least 40% of instructional time planning and safely conducting classroom, laboratory, and field investigations. The curriculum document now explicitly states that virtual simulations supplement rather than replace hands-on investigations and evidence-based student work.

**Execution status:** no Chromium/Playwright run or successful CI result has been confirmed. The objective/scope review is broader than the previous sample, but detailed science-equation, accessibility, and interaction validation remain separate workstreams.

## Grade 9 Physics/Chemistry and Grade 10 Biology QA — 2026-11-03

Additional targeted model review and fixes:
- Grade 9 Chemistry Atomic Structure title/objective corrected to match proton/neutron, atomic-number and mass-number inputs; the calculator does not provide electron configuration.
- Grade 9 Periodic Trends now discloses that valence-electron count is supplied independently and is not derived from atomic number.
- Grade 9 Reaction Kinetics now labels its temperature/catalyst multiplier an illustrative index rather than an empirical rate law.
- Grade 9 Physics Kinematics clarifies average speed and interval-average acceleration, without claiming graph interpretation. Momentum/collisions now explicitly states its perfectly inelastic, one-dimensional assumption.
- Grade 10 Biology Molecular Biology now validates whole-number base/codon counts and rejects a codon count requiring more bases than supplied. Human Physiology validates activity and heart-rate ranges and labels its multiplier illustrative. Plant Physiology validates finite 0–100% inputs and identifies its minimum-factor output as an index, not a measured rate.
- Added three functional Playwright cases for these Grade 10 Biology calculators. The suite contains **76 functional case entries across 74 distinct pages**.

The directory currently lists **110 high-school labs**: 40 Physics, 40 Chemistry, and 30 Biology pages. This corrects an earlier count of 90 that omitted the Grade 9 Physics and Chemistry collections. The high-school curriculum review remains sample-based, not a complete audit of all 110 pages.

**Test execution:** source assertions and case-list structure have been checked. No completed Chromium/Playwright run or successful CI status is confirmed.

## Grade 11–12 scope and QA follow-up — 2026-11-03

Additional high-school model descriptions were corrected:
- Grade 11 Chemistry: electron shell capacity is no longer described as orbital/quantum-number modelling; ionic attraction is no longer described as lattice-energy/covalent-polarity calculation; the q = mcΔT page is correctly titled calorimetry/heat transfer; gas-law output is explicitly a relative T/P volume index.
- Grade 11 Physics: DC circuits is correctly scoped to a single resistive circuit and Ohm's law, not Kirchhoff network analysis; the mechanical-wave page is correctly scoped to v = fλ, not interference.
- Grade 12 Chemistry titration now states its fixed 0.10 M base and 1:1 assumption. Grade 12 induction reports emf magnitude only, not Lenz-law direction.
- Fixed browser QA metric comparison to normalize the colon delimiter in displayed Label: value metrics before matching the expected text. This repairs a systematic assertion-format mismatch in the functional runner.

The suite now contains 76 functional case entries across 74 distinct pages. The runner source has been structurally reviewed, but no completed browser run is claimed.

## Earth and Space Science expansion — 2026-11-03

Added six Grade 7–8 Earth and Space Science labs and linked them in `grade-levels.html`:
- Grade 7: solar-system motion/gravity; plate tectonics and evidence of Earth's change; watershed and water-system impacts.
- Grade 8: stars/galaxies/cosmological evidence; weather/ocean/atmospheric interactions; carbon cycling and climate influences.

Each new page includes a learning objective with TEKS references, prediction/conclusion fields, an interactive model, and explicit scope limitations. Static source checks confirmed all six pages contain the shared assets, a main lab container, learning objective, TEKS note, and syntactically valid inline JavaScript. All six navigation links were confirmed in the grade directory.

The Playwright runner was extended to fill named input fields as well as the existing generic a/b/c/d controls, and six Earth/Space cases were added, including invalid-input checks for watershed volume, star temperature, and negative carbon flow. The suite now contains **76 functional case entries across 74 distinct pages**.

The directory's linked-lab inventory is now **274** (previously 268). Grade 7 and Grade 8 each have 33 labs, including three new Earth and Space Science labs.

**Important execution distinction:** inline JavaScript syntax and source structure were checked, but no actual Chromium/Playwright execution or successful GitHub Actions result has been confirmed. These new pages are not yet browser-rendering validated.

### Additional Grade 11–12 Biology scope corrections — 2026-11-03

- Evolutionary-tree page now discloses that its shared-trait × lineage-count score is not a phylogenetic tree.
- Developmental-biology page retitled to Cell Division and Population Growth and states its idealized doubling assumptions.
- Endocrine and climate-ecology pages identify their outputs as illustrative arithmetic indices, not physiological or species-distribution predictions.
- Evolutionary-genomics page is explicitly scoped to uncorrected p-distance.
- Research-methods page retitled to Biological Data Summary: Mean and Range because the calculator accepts precomputed summary values, not raw datasets.

### Earth and Space lab refinement and test inputs

The Grade 8 universe lab now includes a student-selected star life-cycle stage; QA selects the main-sequence stage. Its limitation is explicit: it does not infer the stage or render a complete H–R diagram. The weather/climate lab now exposes global atmospheric pattern and warm/cold ocean-current selectors, and the browser case sets both explicitly. The Grade 7 watershed lab is correctly bounded to direct watershed impacts under 7.11(A), with downstream/coastal connections treated as context for 7.11(B).

### Earth and Space lab mock-DOM validation

Executed the six new inline lab scripts against a lightweight mock DOM with representative valid inputs. All six produced the expected output metrics and explanations. Additional invalid-input checks confirmed rejection of zero watershed volume, zero star temperature, and negative carbon flow. The browser QA runner's JavaScript source also passed a syntax compilation check and now contains 76 functional case entries across 74 distinct pages.

**Not a browser pass:** these checks do not validate actual Chromium rendering, responsive layout, keyboard navigation, accessibility-tree output, or real browser event behaviour. No CI status check has been reported for the latest commit.

## CI findings and correction — 2026-11-03

The push-triggered GitHub Actions run on commit `fa1a12e` exposed two static-check failures:
1. The directory-linked lab inventory had grown to **274** pages, but the smoke-check constant still expected 268. The inventory assertion is now updated to 274.
2. `grade4-physics-simple-machines.html` contained an apostrophe inside a single-quoted JavaScript message, causing a parse error. The message punctuation is corrected, and the calculator now rejects blank/non-finite/non-positive force inputs.

The browser functional list currently contains **85 case entries across 83 distinct pages**. Two pages have separate case entries to exercise different calculations on the same page. The assertion normalizes the colon in displayed metric labels before matching.

**CI status:** the failed run was a genuine static-smoke-check failure, so the browser job was skipped. The two identified source issues are fixed in later commits; the next push-triggered run must complete before the static and browser suites can be marked passed.

## Browser QA findings: legacy Grade 9 Biology page structure — 2026-11-03

The browser run passed its initial static gate but failed while visiting the Grade 9 Biology collection. Two older pages used `main.lab-wrap` without the exact `lab` class token, so the shared animation initializer did not attach its `.science-motion` section or pause control, and the browser runner could not find `main.lab`.

Corrected both pages to use `class="lab lab-wrap"`, preserving their local layout class while enabling shared lab behavior. Tightened the static smoke check to require the exact `lab` class token rather than a substring match, preventing this structural mismatch from passing static QA again.

A prior browser attempt on commit `a127162` completed static checks but failed the browser step after 156 pages due to this legacy markup issue. The next run will verify the corrected pages and continue through all 283 pages.

## Grade 4–6 Earth and Space Science expansion — 2026-11-03

Added nine Earth and Space Science labs and linked them in the directory:
- Grade 4: seasons/Moon patterns; water cycle/weather and surface processes; natural resources and conservation.
- Grade 5: Earth's rotation/day-night/shadows; water cycle, sedimentary rocks and landforms; natural-resource solutions.
- Grade 6: seasons/tides; Earth spheres/structure/rock cycle; resource management.

The new pages use the shared stylesheet and JavaScript, include TEKS-referenced objectives, prediction/conclusion fields, interactive selectors, and scope notes in the activity text. The directory inventory is now **283 unique lab links** (previously 274). The static smoke-check expected inventory was updated from 274 to 283.

The browser QA runner now has **85 functional case entries across 83 distinct pages**, including one case per new Grade 4–6 Earth/Space page. Full Chromium execution is still not confirmed.

### Grade 4–6 Earth and Space mock-DOM validation

All nine new Grade 4–6 Earth and Space inline scripts passed JavaScript syntax compilation and representative mock-DOM output checks. The Grade 6 Earth-systems page initially exposed an apostrophe syntax error; the message was corrected and the script then passed. Grade 4 water-cycle and resources objectives were tightened to explicitly cover the full 4.10(A)–(C) and 4.11(A)–(C) ranges. The browser runner now has **85 functional case entries across 83 distinct pages**; the static inventory check expects **283** linked labs.

**Execution status:** these are source and mock-DOM checks, not a real Chromium/Playwright run. The prior push-triggered CI run failed its static checks because of the 268-vs-274 inventory constant and a Grade 4 simple-machines quote error; both issues have since been corrected, and the inventory constant is now 283. No successful current CI result has yet been confirmed.
The Grade 6 Earth-systems page now includes an interactive Earth-layer selector for crust, mantle, outer core, and inner core; the browser case selects the mantle in addition to the hydrosphere and metamorphic rock.

## Successful full browser QA — 2026-11-03

GitHub Actions run [41690207972](https://github.com/Osdmaverick/osdmaverick-virtual-science-lab/actions/runs/41690207972), commit `e953af6107fc9e9964e1b113db846795f2dd3501`, completed successfully.

- Static smoke check: **passed** — 283/283 directory-linked pages exist and pass required structure and inline JavaScript syntax checks; shared JavaScript and CSS checks also passed.
- Chromium browser smoke check: **passed** — 283 pages visited, 27 mobile-width samples checked, reduced-motion preference checked across 9 grades, and keyboard focus/Enter behavior checked.
- Functional calculator suite: **passed** — all 85 functional case entries across 83 distinct pages passed, including valid outputs and invalid-input boundaries.
- Browser result: `failures: []`.

The final defect found in this cycle was a Grade 10 Biology enzyme calculator assigning to a `const` array after calculating activity. The result list is now mutable, and the functional case passes. The Grade 4 simple-machines quote error, stale 268/274 inventory constants, Grade 9 Biology legacy main classes, metric-label normalization, and mixed input/select test handling were also corrected before this successful run.

**Scope note:** this verifies the current smoke and representative functional suite; it is not an exhaustive scientific validation of every calculator, nor a complete TEKS crosswalk of all 283 labs.

### Grade 8 Chemistry follow-up — 2026-11-03

Clarified two model/objective gaps:
- Atoms/Elements/Compounds now states that the atom-count model does not represent chemical bonds; two atom types alone do not establish a compound.
- Conservation of Mass now identifies TEKS 8.6(E) and explains that product mass is set equal to reactant mass for an ideal closed-system illustration, not calculated from a balanced reaction.
