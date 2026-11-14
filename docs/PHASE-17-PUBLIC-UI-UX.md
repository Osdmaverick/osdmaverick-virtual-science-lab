# Phase 17 — Public UI/UX upgrade and development roadmap

## Summary
- Simplify the public homepage navigation so visitors can quickly find labs, teaching information and development updates.
- Add a visitor-facing development strip and homepage roadmap preview.
- Add a public roadmap page with explicit release-status distinctions, implementation history and changelog.
- Improve responsive navigation, focus visibility, reduced-motion handling and public-page layout.
- Extend static and browser QA to cover the homepage and roadmap.

## Release-status accuracy
- The existing public lab directory is labelled as available on the public site.
- Phases 1–16 are described as implemented in draft development branches and not yet released.
- Supabase-backed features are not described as live or verified; real project setup and live RLS checks remain outstanding.
- Phase 17 is identified as being prepared for review, not as already released.

## Files
- Updated `index.html` and `assets/styles.css`.
- Added `roadmap.html`.
- Updated `scripts/qa-smoke-check.mjs` and `scripts/browser-qa.mjs`.

## QA
The workflow runs static checks and Playwright browser checks. The browser checks cover homepage/roadmap navigation, mobile overflow, menu toggling, key content and HTTP responses. Live deployment and Supabase are outside this phase.


## Stage 1 public release
This isolated release branch is based directly on `main`. It ports only the public homepage, shared presentation/navigation assets and roadmap. Unreleased account, class, assignment, assessment and portfolio pages are intentionally excluded. The release is not published until reviewed and explicitly approved.
