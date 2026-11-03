# Curriculum Alignment Audit

**Status:** In progress  
**Last reviewed:** 2026-11-03  
**Repository:** Osdmaverick Virtual Science Lab

## Governing framework

This audit uses the current Texas Essential Knowledge and Skills (TEKS) for Science as the reference framework, because the lab collection is organized for Texas Grade 4–12 science learning.

- K–5 science: TEKS adopted in 2021, implemented beginning in 2024–2025.
- Grades 6–8 science: TEKS adopted in 2021, implemented beginning in 2024–2025.
- High-school Biology, Chemistry, and Physics: TEKS adopted in 2020.
- STAAR preparation is an assessment-alignment objective, not a substitute for the underlying TEKS. A lab should teach the relevant grade/course expectation and provide opportunities to use scientific and engineering practices; it should not imply that every enrichment calculation is itself a tested grade-level expectation.

Official references:
- Texas Education Agency, [Science TEKS and implementation resources](https://tea.texas.gov/educators/subject-areas/science/science)
- Texas Education Agency, [Science TEKS review and adoption information](https://tea.texas.gov/curriculum-and-instruction/curriculum-standards/teks-review/science-teks-review)
- Texas Education Agency, [Grade 4 TEKS (June 2024 PDF)](https://tea.texas.gov/curriculum-and-instruction/curriculum-standards/grade4-teks-062024.pdf)
- Texas Education Agency, [Grade 5 TEKS (June 2024 PDF)](https://tea.texas.gov/academics/curriculum-standards/teks/grade5-teks-062024-0.pdf)

## Alignment rules

1. Cite the exact grade/course and student expectation code only after checking the official TEKS text.
2. Separate the primary grade-level learning target from enrichment, prerequisite review, and advanced mathematical treatment.
3. Align each objective with the activity, model variables, output, scientific explanation, and a student evidence task.
4. Include scientific and engineering practices where appropriate: question/prediction, investigation design, variable control, data interpretation, explanation from evidence, and model limitations.
5. Do not label a lab “STAAR aligned” solely because its topic appears in science. Confirm that the task and cognitive demand support the relevant student expectation.
6. Record partial matches and gaps honestly; do not force a single standard code onto a lab that spans several concepts.

## Verified finding

### Grade 4 Physics — Simple Electric Circuits

**Relevant expectations**
- **4.8(C):** Demonstrate and describe how electrical energy travels in a closed path that can produce light and thermal energy.
- **4.8(B):** Identify conductors and insulators of thermal and electrical energy, where material properties are part of the investigation.

**Issue identified:** The original learning objective foregrounded the quantitative relationship between voltage, resistance, and current (Ohm's law). The official Grade 4 expectation instead emphasizes complete/closed circuit paths and energy transformation. Quantitative Ohm's law is not the Grade 4 learning target.

**Correction committed:** The primary learning objective and core scientific explanation now foreground TEKS 4.8(C). The Ohm's law calculator remains as an explicitly labelled enrichment extension, not the Grade 4 standard.

**Commit:** `289a17138b8d903697c28d27931aea62cf63ecfb`

## Audit inventory and next steps

The navigation page contains 268 lab links:
- Grade 4–12 Physics: 90
- Grade 4–12 Chemistry: 90
- Grade 4–12 Biology: 88

A complete page-by-page TEKS crosswalk has **not** yet been established. This document records the governing framework and the first verified correction; it must not be interpreted as certification that all 268 labs are aligned.

Next review sequence:
1. Grade 4–5 elementary science expectations, including scientific practices and recurring themes.
2. Grades 6–8 middle-school science expectations, with vertical progression and grade-specific scope.
3. High-school Biology, Chemistry, and Physics course expectations.
4. Add an exact standards crosswalk for every lab, then add missing practice/assessment evidence.
5. Recheck all mappings against the official TEKS Guide before describing the collection as fully aligned.

### Grade 4 Physics — Floating and Sinking

**Relevant expectation:** **4.6(A)**, which includes classifying and describing matter using observable physical properties such as relative density (the ability to sink or float in water).

**Correction committed:** The learning objective now explicitly targets relative density and evidence-based float/sink prediction, with the Grade 4 expectation cited in the lab. The science explanation clarifies that the mass/volume threshold is an idealized model and that shape, trapped air, and surface effects can affect real objects.

### Grade 4 Physics — Pushes, Pulls and Friction

**Relevant expectation:** **4.7**, investigating patterns of forces including friction.

**Correction committed:** The objective now foregrounds investigating friction as a force and its effect on motion. The explanation identifies the one-dimensional net-force subtraction as a simplified model and explains the sign of the result.

**Commits:** `7f7d324d7f7a17e51e099b0624070fe6a2c468a5`, `08d1cfc952a72d9c958f0cfe36a091a7ed83cd40`.

## Additional Grade 4 Physics scope clarifications

The following review distinguished direct Grade 4 expectations from useful enrichment and cross-curricular material:

- **Light and Shadows:** added a scope note identifying this as a bridge to Grade 5 Science **5.8(C)** (light travels in a straight line and can be reflected, refracted, or absorbed), rather than a Grade 4 mastery expectation.
- **Work and Simple Machines:** labelled the lever investigation as enrichment connected to force/engineering concepts, not a direct Grade 4 science student expectation.
- **Motion and Speed:** clarified that the quantitative average-speed calculation is a mathematical enrichment model, not a direct Grade 4 science content expectation.
- **Measurement and Units:** identified this as cross-curricular measurement and unit-conversion practice that should also be mapped to Grade 4 mathematics expectations.
- **Magnets and Magnetic Forces:** its stated concept fits Grade 4 Science **4.7**, which includes investigation of magnetic forces.
- **Heat and Temperature:** the physical-property framing should be checked against Grade 4 Science **4.6(A)**; thermal-energy transfer and energy-system claims need a separate 4.8 alignment check.

These scope notes prevent enrichment material from being misrepresented as a required Grade 4 science outcome. They do not replace the pending full page-by-page crosswalk.

**Commits:** `e5b8f39f2054b49326e190a1a80044443fb45de2`, `7ad903ecf69cc3dd58e345aad82de8199547d5c4`, `d7c439ae01d804b8ee6cb9446ab4071f246216c4`, `d46c8e0a2ac61c6fcba487e8fb530d9fff16b4a3`.

## Grade 5 Physics — initial TEKS alignment corrections

The Grade 5 science expectations relevant to these labs include **5.7(A)** (equal and unequal forces and their effects on motion and energy transfer), **5.8(A)** (energy transformations in systems), **5.8(B)** (electrical energy transformations in complete circuits and circuit requirements), and **5.8(C)** (straight-line travel, reflection, refraction, and absorption of light). These expectations are documented in the adopted Grade 5 TEKS and reflected in TEA's assessed-curriculum comparison resources.

Corrections:

- **Series Circuits and Ohm's Law:** the main objective now targets complete circuits and energy transformations under **5.8(B)**. Ohm's law/current/power calculations are explicitly labelled enrichment.
- **Energy Forms and Transfers:** the objective now targets energy transformation in a system under **5.8(A)**. Efficiency and useful/dissipated energy calculations are labelled enrichment.
- **Reflection and Refraction of Light:** the objective now targets the full light behaviour expectation under **5.8(C)**. Quantitative angle/refractive-index calculations are labelled enrichment.
- **Motion and Distance–Time Graphs:** the page now clarifies that the graph and average-speed calculations are mathematical enrichment; they do not, by themselves, meet **5.7(A)** without an explanation of how equal/unequal forces cause motion patterns.
- **Balanced and Unbalanced Forces:** the objective now explicitly matches **5.7(A)**, including motion patterns and energy transfer.

**Commits:** `c1d8b61bcbdda9a903f8d0f4442d4d5b23564582`, `62632af4ca5a05a0bf004cb5fed94ecbb17c56f9`, `2c9eed430548e5432089240a04dc02ab00146d6a`, `3ccdd77d61a4593b803863118612927d87a19261`, `99a242a858f80074293888111607152fb3859fdf`.

**Additional official reference:** [TEA Grade 5 TEKS (adopted 2021; June 2024 PDF)](https://tea.texas.gov/laws-and-rules/state-board-education/teks/grade5-teks-062024-0.pdf).

### Grade 5 circuit model made instructionally complete

The first TEKS alignment correction exposed a second issue: the Grade 5 circuit page had only voltage and resistance inputs, so it could not demonstrate the complete/open circuit requirement or let students explore the different energy transformations named in 5.8(B). The model now includes a circuit-path selector (complete/closed or broken/open) and an output selector (light, sound, motion, or thermal). An open path produces zero current and no load output; a closed path illustrates the selected transformation. Quantitative current and power remain clearly marked as enrichment. Playwright coverage now includes closed-light, open-path, closed-motion, and invalid-resistance cases; the inline script also passed a mock-DOM execution check.

**Commits:** `656388a0d88d0871329c345355a0ad21fa022ddb`, `7e7b8473da046a9fdbad3895da511b8baf807144`.

## Grade 5 Biology — initial TEKS alignment and scope review

Current Grade 5 expectations relevant to this sample include **5.12(A)** (organisms interacting with biotic and abiotic factors in a healthy ecosystem), **5.12(B)** (predicting how ecosystem changes affect matter cycling and energy flow in a food web), and **5.13(A)** (analyzing structures and functions that help different species survive in the same environment). The official Grade 5 TEKS and STAAR assessed-curriculum references are linked below.

- **Adaptations and Environmental Change:** objective now targets species structures/functions and biotic/abiotic interactions under **5.13(A)** and **5.12(A)**. The tolerance score is explicitly described as an illustrative index, not a biological measurement.
- **Food Webs and Ecosystem Balance:** objective now targets predicting effects of ecosystem change on energy flow under **5.12(B)**. The page notes that the simplified energy-transfer calculation is only part of the expectation; students must explain a specific food-web change and its effects.
- **Factors Affecting Photosynthesis:** detailed limiting-factor calculation is labelled enrichment. The page connects the concept to producers and energy flow but does not misrepresent it as the Grade 5 standard itself.
- **Plant Transport Systems:** xylem/transpiration is labelled plant-biology enrichment, not a direct Grade 5 science student expectation.
- **Respiration and Energy Release:** quantitative cellular respiration is labelled enrichment, not a direct Grade 5 science student expectation.

**Commits:** `479c4bab27d77f676dca737b6309e19c4b62e6c7`, `5b2c287e5ec9ec100977634e871efa989651f7bb`, `f79376ff70a0d60dd34036f3ff72aa0ac7290621`, `acdf69b678d48cdf6aa140b23c231bc396a19c16`, `e10710ac94e784bf7ae948ba7ff109ad8c68a9cb`.

**Additional official references:** [Grade 5 TEKS PDF](https://tea.texas.gov/laws-and-rules/state-board-education/teks/grade5-teks-062024-0.pdf); [STAAR Science resources](https://tea.texas.gov/data-reports/staar/staar-science-resources), including assessed curriculum updated August 2025.
