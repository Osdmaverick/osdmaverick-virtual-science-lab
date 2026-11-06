# Phase 7 — Teacher content management

## What this phase adds
- A teacher content studio for class-scoped lessons, practical activities, learning resources and reusable question-bank items.
- Lesson fields for grade, subject, topic, summary, objectives and teaching content.
- Practical fields for objectives, materials, procedure steps and safety notes.
- Resource links validated as HTTP(S) URLs.
- Question-bank items with 2–6 options, a correct option and an explanation.
- Draft, publish, unpublish, archive, edit and delete controls.
- Student view of published lessons, practicals and resources for classes they have joined.
- Question-bank items remain teacher-only; correct answers are not exposed to student accounts.

## Database and security
Apply migrations in order from Phase 1 through Phase 7. This phase adds `public.teacher_content_items`.
- Teachers can manage records only when they own the referenced class and their profile role is teacher.
- Students can read only published lesson, practical and resource records for classes in which they are enrolled.
- Student policies do not expose question-bank items.
- Anonymous access is revoked. Browser grants are restricted to required columns/actions.
- Row Level Security is the access-control boundary; hiding controls in the page is not security.

## Setup
1. Apply the Phase 1–7 SQL migrations in order in the Supabase SQL editor.
2. Configure `assets/supabase-config.js` using the project's URL and publishable key.
3. Sign in with a teacher account, create a class, then create and publish content.
4. Sign in with a separate student account, join the class using its invite code, and verify published content appears.
5. Confirm drafts and question-bank items are not visible to the student.

## Scope and limitations
- Resource attachments are currently HTTP(S) links; file uploads are not part of this phase.
- Question-bank authoring stores reusable individual questions; it does not yet generate student quizzes or reveal answer keys to students.
- The browser UI and static QA can be tested without Supabase credentials. Live database behaviour and RLS isolation require a configured project and separate teacher/student accounts.
