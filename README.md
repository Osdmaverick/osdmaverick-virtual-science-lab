# Osdmaverick Virtual Science Lab

**Explore. Experiment. Discover.**

An interactive, browser-based science learning platform supporting structured investigations across Grades 4–12.

## What the platform includes

- Grade-level directory for browsing investigations by grade and subject.
- Interactive virtual labs covering Physics, Chemistry, Biology, and Earth & Space Science.
- Guided inquiry structure: learning objectives, prediction, investigation, observation, and explanation.
- Interactive models, adjustable variables, calculated outputs, knowledge checks, and printable lab activities where provided by an individual simulation.
- Shared visual science animations with a pause control and support for the visitor's reduced-motion preference.

The simulations are independent HTML pages. Their features vary by topic; consult each activity for its specific model, controls, and learning objectives.

## Main project files

- `index.html` — homepage and featured simulation navigation.
- `grade-levels.html` — grade-by-grade directory of available labs.
- `human-body-systems.html` — featured Grade 7 Biology virtual lab.
- `grade9-*.html`, `grade8-*.html`, and other grade-prefixed pages — topic-specific investigations.
- `assets/styles.css` — shared responsive styling and animation styles.
- `assets/main.js` — mobile navigation and shared visual science animations.

## Run locally

Open `index.html` in a modern browser. The core platform uses plain HTML, CSS, and JavaScript and requires no build step or package installation.

## Deploy with GitHub Pages

1. Open **Settings → Pages** in the repository.
2. Under **Build and deployment**, choose **Deploy from a branch**.
3. Select branch `main` and folder `/ (root)`, then save.
4. Wait for the deployment to complete. GitHub Pages displays the published site URL in the Pages settings.

## Learning and safety notes

- Simulation outputs are educational models, not professional, clinical, or diagnostic measurements.
- Models may simplify real systems. Read each activity's assumptions and notes before interpreting results.
- Curriculum labels should be checked against the standards used by the school or teacher.
- Do not enter sensitive student information into public pages.
