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
