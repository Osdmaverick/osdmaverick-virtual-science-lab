# Phase 5 — Interactive quizzes and assessment engine

## Included
- Two ready-to-use science quizzes for Grades 6 and 7, covering Physics, Chemistry, Biology and Earth & Space.
- Multiple-choice questions with required completion, automatic marking, explanations and percentage scores.
- Local attempt history (latest eight displayed) that works without an account or backend.
- Optional submission of completed results to an enrolled class through Supabase.
- Class-scoped row-level security: students submit and read only their own attempts; class teachers read attempts only for classes they own.

## Setup
1. Apply migrations in order: Phase 1 profiles, Phase 2 classes, Phase 3 assignments, Phase 4 notebook sync, then `202611060002_quiz_attempts.sql`.
2. Configure the existing `assets/supabase-config.js` with the project URL and publishable key.
3. Sign in as a student, open Science Quizzes, choose an enrolled class, complete a quiz and submit the result.
4. Teachers can query the `public.quiz_attempts` table for their class results; a dedicated teacher analytics view is a later enhancement.

The quiz bank and answer key are shipped in the client for practice quizzes, so this is formative practice, not a secure high-stakes examination. Do not use client-side answer keys for proctored or credential-bearing assessments.

## Validation
Static and browser checks cover quiz rendering, answer completion, marking, explanations, history persistence and safe operation without Supabase configuration. Live submission and RLS isolation still require the configured Supabase project and separate teacher/student accounts.
