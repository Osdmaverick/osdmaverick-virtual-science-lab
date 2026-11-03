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

## Grade 5 Chemistry — initial TEKS scope review

The current Grade 5 matter expectations relevant to this sample are in **5.6(A)–(D)**: physical properties including solubility and conductivity; mixtures; properties and conservation of matter in solutions; and particle models of matter too small to see.

- **Mixtures and Solutions:** objective now targets comparison of properties before/after solution formation under **5.6(A)** and **5.6(C)**. The g/L concentration calculation is labelled quantitative extension; the student explanation should explicitly identify what is conserved.
- **Acids, Bases and Neutralisation:** pH/neutralisation is labelled chemistry enrichment, not a direct Grade 5 science expectation.
- **Atomic Models and Elements:** detailed protons/neutrons/electrons are labelled enrichment beyond **5.6(D)**, which asks students to illustrate that matter consists of particles too small to see.
- **Physical and Chemical Reactions:** comparison of chemical reactions/new substances is labelled as enrichment/bridge content, not a direct Grade 5 expectation.
- **Separation Techniques:** filtration/evaporation is identified as an applied extension of **5.6(A)–(C)**, rather than a separate stated Grade 5 student expectation.

**Commits:** `664c968d8d8ec97bf7c35da2658fa2ea1bd2a05b`, `5482d518f280981f8c2a8685b09dd14f29679d8e`, `84a8c215bd563565d39166cf04c5cae916846e9d`, `e809e658f55821ec04c3861315fdfef35ab75bd5`, `0cde39d6c9d432a1c17511ff2df87b5fa001ce56`.

## Grade 6 Physics — initial TEKS alignment corrections

The adopted Grade 6 TEKS describe force and motion through **6.7(A)–(C)**, including gravity/friction/magnetism/applied forces, net force and balanced/unbalanced forces, and Newton's Third Law force pairs. Energy standards include **6.8(B)** (energy conservation through transfers and transformations in systems such as circuits) and **6.8(C)** (energy transfer through transverse and longitudinal waves).

- **Electric Circuits and Resistance:** objective now foregrounds energy transfer/transformation in circuits under **6.8(B)**; Ohm's law/current/power are marked quantitative enrichment.
- **Forces and Newton's Laws:** objective now foregrounds net force, balanced/unbalanced classification and interaction force pairs under **6.7(A)–(C)**. The calculator now explicitly labels acceleration via (F=ma) as an extension and explains that Newton's Third Law pairs act on different objects. A balanced-force test was added.
- **Gravity, Mass and Weight:** the page now identifies gravity as the Grade 6 force concept under **6.7(A)** and labels quantitative weight comparisons as an enrichment application.
- **Heat Capacity and Temperature Change:** the page connects thermal energy transfer to **6.8(B)** while labelling the specific-heat equation as quantitative extension.
- **Waves, Frequency and Wavelength:** the objective now foregrounds energy transfer through transverse and longitudinal waves under **6.8(C)**; wave-speed and period calculations are marked mathematical extension.

**Commits:** `c7d4a85a38919d6bb6da0e1ee6696436937d3f68`, `0f65e875a5247409a621529d8fd6a9af8e0c2d82`, `b07d84cc75d22e990e8b333c7b87d4150abc631b`, `194d1a5a31da688ad35cbb32b0e6bb0815dbe10b`, `68be96de460ff8b3ba3eddbbde72406a93bdcb1d`, `0924895e4e9ce0bf5433d68da6d53a9d124d8923`.

**Official reference:** [19 TAC §112.26 Grade 6 Science, adopted 2021](https://tea.texas.gov/about-tea/laws-and-rules/sboe-rules-tac/sboe-adopted/24-03-112-26.pdf).

## Grade 6 Chemistry — initial TEKS scope review

The Grade 6 matter strand includes **6.6(A)** (atomic structure and states of matter), **6.6(B)** (distinguishing pure substances, homogeneous mixtures, and heterogeneous mixtures), **6.6(C)** (classifying elements by physical properties), **6.6(D)** (density relative to fluids), and **6.6(E)** (evidence of chemical change).

- **Acids, Alkalis and pH:** pH classification is labelled chemistry enrichment; it is not listed as a standalone Grade 6 expectation.
- **Atoms, Elements and Compounds:** the page distinguishes the broad atomic model connection to **6.6(A)** from ion/proton/electron detail as enrichment; it notes that compounds are developed in later grades.
- **Mixtures and Separation:** objective now targets distinguishing mixtures under **6.6(B)**. Filtration is identified as an applied separation extension.
- **Periodic Table and Element Groups:** objective now targets element classification by physical properties under **6.6(C)**; atomic-number/valence-electron patterns are supporting enrichment.
- **Chemical Reactions and Rates:** objective now targets evidence of new substance formation under **6.6(E)**; temperature/surface-area rate index is labelled enrichment.

**Commits:** `0d5fc93ded3e9102e8dbb8019a7374f5b3ada749`, `8156ed41465186c4cb5469bfbd6cd614b9aee9fd`, `c74214bf10a02076c7e56714b441dd3c66a8881e`, `7302ef1872a259c3993158ee935d43f463eeb883`, `5ca53b4c5d99d3d0910b67e9d1a36fbd0a46abcd`.

## Grade 6 Biology — initial TEKS scope review

Relevant adopted Grade 6 expectations include **6.8(B)** (energy transfers and transformations in systems such as food webs and photosynthesis), **6.12(A)–(C)** (ecosystem dependence, organism relationships, and hierarchical organization), and **6.13(A), (C)** (cell theory/basic unit of life; population variation and survival).

- **Cell Structure and Function:** objective now includes the cell as the basic unit of structure and function under **6.13(A)**; the feature-identification scores are clarified as learning checks rather than biological measurements.
- **Ecosystems and Food Webs:** objective now connects energy flow with ecosystem interdependence under **6.8(B)** and **6.12(A)–(C)**; the page notes the two-level energy model is not a complete food web.
- **Variation and Inheritance:** objective now foregrounds population variation and survival under **6.13(C)**. The simple trait-probability calculation is clearly identified as an illustrative extension, not a full inheritance or natural-selection model.
- **Photosynthesis and Limiting Factors:** linked to energy transfer/transformation under **6.8(B)**; detailed photosynthesis chemistry and limiting-factor calculations are labelled enrichment.
- **Respiration and Energy:** cellular respiration and quantitative energy-yield calculations are labelled enrichment connected to the broader energy-transfer concept, not a direct Grade 6 biochemical pathway expectation.

**Commits:** `980264a0035610ca43b37431494aa3b5e24c3c4b`, `8452a949d335f8abc110310c3ef072541591a164`, `42ae0a53172d20985d0f3fd13b9b6e92ec04912e`, `5ca2d86922cb91e960ddd257d20f087490b2100f`, `0e013b9a68825e4de36241f170599f498133ab54`.

### Additional Grade 6 Physics scope review

- **Magnetism and Electromagnets:** connected to magnetic forces under **6.7(A)**; the coil-turn/current solenoid calculation is labelled enrichment.
- **Measurement and SI Units:** objective now targets density relative to fluids under **6.6(D)**.
- **Pressure in Solids and Liquids:** pressure calculation is labelled an applied extension of force concepts under **6.7(A)–(B)**, not a separate Grade 6 student expectation.
- **Speed and Acceleration:** corrected the objective to match the actual average-speed calculation. The page now explicitly says it does not calculate acceleration because no velocity-change input is supplied; average speed is a mathematical extension, not a direct Grade 6 student expectation.
- **Work, Energy and Power:** objective now connects force/displacement to energy transfer under **6.8(A)–(B)**; work and power equations are labelled quantitative enrichment.

**Commits:** `250ec1f241cdaac3d102ef10abe34c4a59daff26`, `ec62d14f7c52e412903d675c031a7e2df59f68ab`, `450d86f15c541b18cc4d3ae498d6f5ab75d1c974`, `76046d9c0315892bf360ad8902932938bde5f16a`, `bcf6b2bee4d1fa465dbc5dd42f54ee8451debfe1`.

## Grade 7 — initial TEKS scope review

The Grade 7 audit uses adopted 2021 middle-school Science TEKS, particularly **7.6(A)–(E)** (elements, compounds, physical/chemical changes, aqueous solutions and dissolution), **7.7(A)–(D)** (average speed, speed versus velocity, distance-time graphs, and balanced/unbalanced forces under Newton's First Law), **7.8(A)–(C)** (thermal transfer, equilibrium, and temperature/particle kinetic energy), **7.12(A)–(B)** (energy flow through trophic levels and cycling of matter), and **7.13(A)–(D)** (human systems, organization, reproduction, natural/artificial selection).

- **Velocity and Acceleration:** the existing acceleration calculator is now labelled an extension. It does not replace the Grade 7 motion expectations for average speed, speed versus velocity, distance-time graphs, and Newton's First Law.
- **Momentum and Impulse:** explicitly identified as enrichment, not a Grade 7 student expectation. The current page calculates momentum only; it does not calculate impulse.
- **Mechanical Energy Conservation:** identified as an idealized extension rather than a direct Grade 7 expectation. The Grade 7 energy strand's stated focus is trophic energy flow and matter cycling.
- **Moles and Solution Concentration:** the objective now foregrounds solute, solvent, concentration, and dilution in aqueous solutions under **7.6(D)**. Molarity (mol/L) is labelled an advanced quantitative extension.
- **Ionic and Covalent Bonding:** electron-transfer/sharing models are identified as enrichment. Grade 7 **7.6(A)–(B)** focuses on distinguishing elements and compounds, atoms and molecules, symbols/formulas, and identifying atoms in formulas.
- **Cell Division:** mitosis/meiosis is identified as enrichment; Grade 7's direct reproduction expectation is comparing sexual and asexual reproduction and their relationship to offspring diversity/population change under **7.13(C)**.
- **DNA and Genetics:** the page now connects genes/DNA to inherited traits while labelling detailed base pairing and independent probability calculations as extensions beyond the Grade 7 focus in **7.13(C)–(D)**.
- **Evolution and Natural Selection:** the topic is relevant to **7.13(D)**, but the page's one-generation index remains explicitly illustrative, not a population-genetics simulation.

## Grade 8 — initial TEKS scope review

The Grade 8 audit uses adopted 2021 middle-school Science TEKS, especially **8.6(A)–(E)** (classification of matter, atoms in reactions, water properties, acids/bases and pH, and conservation of mass in chemical reactions), **8.7(A)–(B)** (Newton's Second Law and the simultaneous operation of all three laws in systems), **8.8(A)–(B)** (amplitude, frequency and wavelength in transverse waves, including the electromagnetic spectrum and applications), **8.12(A)–(C)** (ecosystem disruptions, succession, biodiversity), and **8.13(A)–(C)** (organelle functions, genes on chromosomes, and adaptation/variation).

- **Forces, Friction and Motion:** expanded the model to include object mass and calculate acceleration from net force using Newton's Second Law. The simplified model treats friction as opposite to the applied force; it is not a full free-body-diagram simulator.
- **Work, Energy and Simple Machines:** the work = force × displacement calculation is now labelled enrichment. Grade 8's explicit force-and-motion expectation is Newton's Second Law and how all three laws act together in systems under **8.7**.
- **Sound and Wave Properties:** clarified that sound is longitudinal and the current calculator's wave-speed output is enrichment. It is not sufficient by itself for **8.8(A)**, which explicitly requires amplitude, frequency and wavelength comparisons in transverse waves, including the electromagnetic spectrum.
- **Solutions and Concentration:** the g/L concentration calculator is an applied extension; Grade 8's matter expectations focus on matter classification, atoms in reactions, water properties, acids/bases and conservation of mass.
- **Chemical Reactions and Conservation of Mass:** aligned to **8.6(E)**, with an explicit limitation: the current closed-system model sets product mass equal to reactant mass to illustrate the principle; it does not simulate a balanced reaction or actual measured product yield.
- **Atoms, Elements and Compounds:** the model now reports atom-type composition only. Two atom types do not establish a compound unless the atoms are chemically bonded; the page explains this limitation.
- **Cell Structure:** the objective now lists the organelles and functions required by **8.13(A)**. Numeric ratings remain discussion prompts, not measures of organelle performance.
- **Genetics and Inheritance:** the objective now foregrounds genes on chromosomes and inherited traits under **8.13(B)**. The probability input is labelled illustrative enrichment because no parental genotypes are supplied.

**Audit boundary:** this is an initial sample-based review, not a completed standard-by-standard audit of all 60 Grade 7–8 labs. Labs outside the sampled pages still require review, including the Grade 7 taxonomy, human systems, ecosystems and thermal/solar-system topics, and Grade 8 climate, universe, ecosystem, cell-transport, photosynthesis and respiration topics.

**Official standards sources:** [19 TAC §112.27 Grade 7 Science, adopted 2021](https://www.law.cornell.edu/regulations/texas/19-Tex-Admin-Code-SS-112-27); [19 TAC §112.28 Grade 8 Science, adopted 2021](https://www.law.cornell.edu/regulations/texas/19-Tex-Admin-Code-SS-112-28); [TEA Science TEKS adoption and implementation information](https://tea.texas.gov/curriculum-and-instruction/curriculum-standards/teks-review/science-teks-review).

### Grade 7–8 follow-up scope notes

- **Grade 7 Balancing Chemical Equations:** the page is now identified as a Grade 8 bridge/enrichment. Its single-element atom-count check does not balance a complete chemical equation; Grade 8 introduces mass conservation in reactions under **8.6(E)**.
- **Grade 8 Solutions and Concentration:** the g/L calculator is explicitly labelled applied enrichment, not a named Grade 8 matter expectation.

## High-school course alignment — initial sample review

**Important course-mapping rule:** Texas high-school Science TEKS are course-based, not separate Grade 9, Grade 10, Grade 11, and Grade 12 Physics/Chemistry/Biology standards. The directory's grade labels are the lab collection's learning sequence; they do not create different state standards by grade. The adopted courses are Biology under **19 TAC §112.42**, Chemistry under **§112.43**, and Physics under **§112.45**. Biology is recommended for Grades 9–11, Chemistry for Grades 10–12, and Physics for Grades 9–12. Each lab should be crosswalked to its course expectation, with the directory grade treated as sequencing metadata.

### Biology course crosswalk

The adopted Biology course is organized around biological structures/functions/processes, genetics, evolution, and environmental interdependence. Relevant expectations include **5(A)–(D)** biomolecules, cell types, homeostasis/cellular transport, viruses; **6(A)–(C)** cell cycle, differentiation, and cell-cycle disruption; **7(A)–(D)** DNA, gene expression/protein synthesis, DNA changes, and molecular technologies; **8(A)–(B)** meiosis and genetic crosses; **9(A)–(B)** evidence for common ancestry and fossil change; **10(A)–(D)** natural selection and other evolutionary mechanisms; **11(A)–(B)** photosynthesis, respiration, and enzymes; **12(A)–(B)** animal and plant systems; and **13(A)–(D)** ecological relationships, energy/matter cycles, and biodiversity.

- **Grade 9 DNA and Protein Synthesis:** the DNA → RNA → protein modelling task is directly relevant to **7(A)–(B)**. Review still needs to check that the codon table, start/stop handling, and strand orientation are correct throughout the full page.
- **Grade 10 Biological Molecules and Enzymes:** the page currently models temperature/pH effects on enzyme activity and is relevant to **11(B)**. The page title has been narrowed to **Enzyme Activity Factors** because it does not compare carbohydrates, lipids, proteins, and nucleic acids under **5(A)**. The activity curve is explicitly identified as an illustrative index rather than empirical kinetics.
- **Grade 11 Cell Signalling and Receptors:** receptor occupancy using L/(Kd + L) is advanced enrichment, not a named Biology TEKS expectation. It is now described as an extension to cell processes/homeostasis.
- **Grade 12 Advanced Immunology:** immune defense connects to **12(A)**, but the response × memory-factor output is only an illustrative index, not a measured immune-response model.

### Chemistry course crosswalk

The adopted Chemistry course includes **5(A)–(C)** periodic trends; **6(A)–(E)** atomic theory and structure; **7(A)–(D)** ionic/covalent/metallic bonding and molecular geometry; **8(A)–(D)** mole, molar mass, Avogadro's number, percent composition, and formulas; **9(A)–(D)** balanced equations, reaction types, stoichiometry, and limiting reactants; **10(A)–(C)** kinetic molecular theory and gas laws; **11(A)–(F)** solution chemistry, solubility, molarity, and dilution; **12(A)–(E)** acids/bases and pH; **13(A)–(D)** thermodynamics and calorimetry; and **14(A)–(C)** nuclear chemistry.

- **Grade 9 Chemical Equations and Stoichiometry:** the current page compares supplied amounts using a simplified 1:1 ratio. It is now explicitly labelled preparatory only; it does not provide balanced-equation coefficients and therefore does not meet the full stoichiometry expectations in **9(C)–(D)**.
- **Grade 10 Thermochemistry and Enthalpy:** q = mcΔT, with heat reported in kJ, is relevant to calorimetry and heat/specific-heat calculations under **13(B), 13(D)**. The page calculates heat change in the solution, not reaction enthalpy directly.
- **Grade 11 Acid–Base Equilibria and Buffer Solutions:** the Henderson–Hasselbalch model is now labelled an advanced extension. The explicit course pH calculation expectation is **12(E)**, based on hydrogen-ion concentration.
- **Grade 12 Electrochemistry and the Nernst Equation:** redox is within **9(B)**, but the Nernst equation is not explicitly named as a student expectation; the page is now labelled enrichment and its fixed 25°C, n = 2 assumptions remain visible.

### Physics course crosswalk

The adopted Physics course includes **5(A)–(H)** motion graphs, vectors, kinematics, projectile/circular motion, Newton's laws, and universal gravitation; **6(A)–(E)** electric force/fields, magnetism, charge conservation, circuits, and Ohm's law; **7(A)–(E)** work, power, mechanical/kinetic/potential energy, energy conservation, impulse, and momentum; **8(A)–(G)** wave motion, transverse/longitudinal waves, wave characteristics, wave behaviours, electromagnetic spectrum, spectra, and image formation; and **9(A)–(D)** quantum phenomena.

- **Grade 9 Motion and Kinematics:** average speed and acceleration calculations map to **5(A), 5(C)**. The task should be interpreted with its stated constant-rate/simplified motion assumptions.
- **Grade 10 Projectile Motion:** flight time and horizontal range map to **5(D)**. The page now states the ideal assumptions: no air resistance, constant g, and equal launch/landing heights.
- **Grade 11 Circular Motion and Gravitation:** the centripetal/gravitational force comparison maps to **5(F), 5(H)**. The 5% match is a model check, not a full orbit propagator.
- **Grade 12 AC Circuits and Impedance:** the series-RLC impedance equation is now explicitly labelled enrichment. Physics **6(D)–(E)** names series/parallel circuits and Ohm's-law quantities; AC impedance is not a separately stated student expectation.

**Audit boundary:** these are targeted sample findings, not a full audit of the 110 high-school lab pages. Remaining work includes checking every course expectation against all relevant labs, reviewing the grade 9–12 sequence for duplicate/omitted standards, and validating the scientific equations, assumptions, units, and student evidence tasks beyond the sampled pages.

**Official standards reference:** use the TEA's [current 19 TAC Chapter 112 Science TEKS page](https://tea.texas.gov/about-tea/laws-and-rules/texas-administrative-code/19-tac-chapter-112), which lists the adopted high-school Biology (§112.42), Chemistry (§112.43), Integrated Physics and Chemistry (§112.44), and Physics (§112.45) course sections. The TEA's [Science TEKS Review page](https://tea2.tea.texas.gov/curriculum-and-instruction/curriculum-standards/teks-review/science-teks-review) confirms final approval of the high-school course standards on November 20, 2020. Use the current Chapter 112 sections as the controlling reference rather than relying solely on the older adoption attachment PDF.

### High-school sample follow-up: additional pages

- **Physics, Grade 11 Vectors:** the page now states that it resolves one vector into components; it does not add multiple vectors or calculate a multi-leg resultant displacement.
- **Physics, Grade 12 Wave Optics:** the title and objective were corrected to single-slit diffraction. Polarisation is not modelled by its current calculator.
- **Chemistry, Grade 9 Acids/Bases:** the page classifies supplied pH values; it does not calculate pH from hydrogen-ion concentration under **12(E)**.
- **Chemistry, Grade 10 Stoichiometry:** the calculator uses a fixed 1:1 ratio. It is not a general limiting-reactant calculator for balanced equations with arbitrary coefficients.
- **Chemistry, Grade 11 Reaction Rates:** the exponential rate index is now identified as illustrative, not an experimentally determined rate law. The explicit dissolution-factor investigation expectation is **11(C)**.
- **Chemistry, Grade 12 Advanced Stoichiometry:** the coefficient-ratio product calculation supports part of **9(C)**, but assumes one limiting reactant and does not calculate percent yield or compare competing reactants.
- **Biology, Grade 10 Homeostasis:** the correction percentage is now identified as a teaching index, not a physiological glucose/hormone simulation.
- **Biology, Grade 11 Gene Expression:** the page title/objective now match its actual codon-count arithmetic; it does not transcribe DNA, identify codons, or translate amino acids, so it is not a complete **7(B)** model.
- **Biology, Grade 12 Genomics:** the page is described as a simple sequence-identity percentage, not an alignment algorithm or bioinformatics workflow.

## Grade 7–8 expanded objective and model-scope review

The review has now examined the objectives and principal input/output models across the **60 Grade 7–8 labs listed in the directory**. This is an expanded title/objective/scope review, not a line-by-line verification of every scientific statement, full TEKS sub-strand crosswalk, or browser interaction.

### Grade 7 refinements

- **Biology:** Human circulatory/respiratory and digestive-system activities are connected to **7.13(A)**; trophic energy transfer is connected to **7.12(A)–(B)**; selection is connected to **7.13(D)**; and plant organization is connected to **7.13(B)**. The microbiology disease-prevention index is labelled health-literacy enrichment, while bacterial/ecological context is linked to **7.14(B)**. Photosynthesis/respiration input indices, digestion efficiency, activity-related heart-rate multipliers, plant limiting-factor indices, and ecosystem transfer efficiency are explicitly distinguished from measured biological quantities.
- **Chemistry:** pH classification is identified as a Grade 8 bridge (**8.6(D)**); atomic isotope arithmetic, hydrocarbon formula patterns, periodic group/valence-electron prediction, reaction-rate indices, and redox electron-transfer counts are marked as enrichment where they exceed the Grade 7 expectations. Environmental pollutant-removal modelling is connected to human effects on watersheds and water systems (**7.11(A)–(B)**). Existing Grade 7 solution concentration and bonding pages retain their enrichment boundaries.
- **Physics:** Distance/displacement and scalar/vector distinctions are connected to **7.7(B)**; friction/net-force comparisons to **7.7(D)**; thermal transfer to **7.8(A)–(C)**. The F = ma calculator is explicitly identified as a Grade 8 preview (**8.7(A)**), while current/power, trigonometric vector components, linear expansion, specific-heat calculations, and wave-speed/frequency/period calculations are marked as enrichment or bridge material where appropriate.

### Grade 8 refinements

- **Biology:** Cell transport is limited to a concentration-gradient direction check; it does not quantitatively model osmosis or membrane selectivity. The population resource-capacity index is not a carrying-capacity model. Enzyme activity, temperature feedback, human-system heart-rate multipliers, and glucose-energy calculations are marked as illustrative/enrichment. Photosynthesis is connected to **8.6(E)**, but the factor calculator does not balance the reaction or calculate conservation of mass. The evolution index is connected to **8.13(C)** but is not a population-genetics simulation.
- **Chemistry:** pH classification is linked to **8.6(D)**; combustion is described as a conceptual chemical-change example. Metals/nonmetals is identified as a spiral review of Grade 6 content. Separation methods, periodic-table coordinates, and water-pollution treatment are bounded as applied extensions. The page formerly titled “Physical and Chemical Changes” was retitled **“Water Phase Changes”** because its actual model only classified water's physical state at a supplied temperature; it did not model chemical change.
- **Physics:** Light reflection/refraction, pressure, and detailed heat calculations are identified as extensions or bridges; magnetism is labelled a spiral review of Grade 6; average speed is identified as Grade 7 review; measurement conversions are linked to SI-data practice **8.1(E)**. Grade 8's core force and wave expectations remain **8.7(A)–(B)** and **8.8(A)–(B)**; the sound-wave calculator alone does not cover the transverse-wave and electromagnetic-spectrum expectations.

### Instructional-use caveat

The adopted Grade 7 and Grade 8 TEKS require students, for at least **40% of instructional time**, to plan and safely conduct classroom, laboratory, and field investigations. These virtual labs should therefore supplement, not replace, hands-on investigations, repeated measurements, evidence collection, graphing, and student explanations. The official standards also require students to identify model limitations; the notes above make those limits explicit for the simplified calculators.

**Official source:** [TEA, 19 TAC Chapter 112, Subchapter B (August 2024 update), Grade 7 §112.27 and Grade 8 §112.28](https://tea.texas.gov/laws-and-rules/sboe-rules-tac/sboe-tac-currently-effect/ch112b.pdf). The detailed expectations are listed in the official PDF: Grade 7 matter/motion/thermal/ecosystems/human systems/taxonomy; Grade 8 matter, Newton's Second Law, transverse waves, climate, ecosystem stability, organelles and inherited traits.


### Grade 9 Physics/Chemistry and Grade 10 Biology follow-up — 2026-11-03

- **Grade 9 Chemistry — Atomic Structure:** corrected the title and objective to proton/neutron counts, atomic number and mass number. The prior title promised electron configuration, which the calculator did not model.
- **Grade 9 Chemistry — Periodic Trends:** clarified that valence-electron count is user-supplied and the calculator does not derive electron configurations or determine full periodic trends.
- **Grade 9 Chemistry — Reaction Kinetics:** labelled its temperature × catalyst-factor output an illustrative index, not an experimentally determined rate law.
- **Grade 9 Physics — Kinematics:** clarified that the calculator returns average speed and interval-average acceleration; it does not plot or interpret motion graphs.
- **Grade 9 Physics — Momentum/Collisions:** clarified that the collision is one-dimensional and perfectly inelastic, with shared final velocity; elastic and two-dimensional collisions are not modelled.
- **Grade 10 Biology — Molecular Biology:** added whole-number validation and a consistency check that three bases are needed for each complete codon. Clarified that it does not transcribe or translate a real sequence.
- **Grade 10 Biology — Human Physiology:** added finite/range validation for activity level and resting heart rate; labelled the 8% multiplier illustrative, not a physiological prediction.
- **Grade 10 Biology — Plant Physiology:** added finite 0–100% validation and labelled the minimum-factor output a teaching index rather than measured plant activity.

The Grade 10 Biology changes have three new functional browser cases (valid output and invalid-input boundary checks). The functional suite now contains **70 cases**. Its source structure is verified; actual Chromium execution remains unconfirmed.

### High-school scope follow-up: Grade 11–12 models

- **Grade 11 Chemistry — Electron Shell Capacity:** the page is now titled and described as a 2n² principal-shell capacity exercise; it does not calculate orbital filling, subshells, quantum numbers, or full electron configurations.
- **Grade 11 Chemistry — Ionic Attraction:** corrected the page title/objective because its q²/r² index does not calculate lattice energy or covalent bond polarity.
- **Grade 11 Chemistry — Calorimetry:** retitled the q = mcΔT page to Calorimetry and Heat Transfer. It uses a fixed specific heat capacity of 4.18 J/(g·°C) and does not calculate reaction enthalpy.
- **Grade 11 Chemistry — Gas Laws:** clarified that the output is a relative volume index proportional to T/P for a fixed amount of gas, not a complete initial/final combined-gas-law solver.
- **Grade 11 Physics — DC Circuits:** retitled the Ohm's-law single-resistor calculator; it does not solve Kirchhoff multi-loop networks.
- **Grade 11 Physics — Mechanical Waves:** retitled the v = fλ calculator; it does not simulate superposition or interference.
- **Grade 12 Chemistry — Titration:** documented the fixed 0.10 M base and 1:1 stoichiometric assumption; polyprotic/non-1:1 systems and titration curves are outside the model.
- **Grade 12 Physics — Electromagnetic Induction:** clarified that the output is induced-emf magnitude only, not polarity/direction under Lenz's law.

The browser runner's metric-text assertion now normalizes the colon between a metric label and its value. The page metrics render as Label: value; without normalization, existing assertions authored as Label value would fail despite correct numerical output.

## Grade 7–8 Earth and Space Science coverage added

The directory previously contained only Physics, Chemistry, and Biology labs for Grades 7–8, leaving the Earth and Space strands without dedicated virtual investigations. Six new labs have been added and linked from the grade directory:

| Grade | New lab | TEKS focus |
|---|---|---|
| 7 | Solar System: Orbits and Planet Properties | 7.9(A)–(B): solar-system objects, movements, and gravity |
| 7 | Plate Tectonics and Changing Earth | 7.10(A)–(B): evidence of change, plate interactions, landforms, earthquakes, and volcanoes |
| 7 | Watersheds and Human Impacts on Water | 7.11(A)–(B): human effects on groundwater, surface water, and ocean systems |
| 8 | Stars, Galaxies and Evidence for the Universe | 8.9(A)–(C): star classification/life cycles, galaxy types, and evidence for the origin of the universe |
| 8 | Weather, Ocean Systems and Climate | 8.10(A)–(C): solar/ocean/atmospheric interactions, circulation, and tropical cyclones |
| 8 | Carbon Cycle and Climate Change | 8.11(A)–(C): natural and human climate influences and carbon cycling |

**Model limitations:** the solar-system page uses approximate planetary mean distances and orbital periods; the tectonics page presents common boundary outcomes and selected evidence examples; the watershed calculator is a pollutant mass/volume estimate rather than a water-quality compliance tool; the star page classifies spectral temperature bands and displays luminosity but does not draw a full Hertzsprung–Russell plot or infer stellar life stage; the weather page is a conceptual cyclone-ingredient model, not a forecast; and the carbon budget is a simplified source/sink balance, not a real-time global carbon inventory.

The grade directory now includes 33 labs in Grade 7 and 33 in Grade 8. Total linked lab inventory increases from 268 to **274**. The three new labs per grade supplement rather than replace required classroom, laboratory, and field investigations.

### High-school Biology scope follow-up: Grades 11–12

- **Grade 11 Evolutionary Relationships:** the shared-trait × lineage-count output is now identified as an illustrative index, not a phylogenetic-tree inference.
- **Grade 12 Developmental Biology:** retitled to Cell Division and Population Growth; the exponential doubling model assumes every cell divides each cycle and does not model differentiation, cell death, or cell-cycle regulation.
- **Grade 12 Endocrine Regulation:** the feedback-strength calculation is identified as a one-step arithmetic illustration, not a named-hormone or time-dependent endocrine model.
- **Grade 12 Climate Ecology:** temperature-change × sensitivity is identified as a suitability index, not a species-distribution prediction.
- **Grade 12 Evolutionary Genomics:** the page now describes uncorrected p-distance only; it does not align sequences, correct multiple substitutions, or infer phylogeny.
- **Grade 12 Research Methods:** retitled to Biological Data Summary: Mean and Range because it accepts precomputed summary statistics rather than raw data and does not evaluate experimental design.
