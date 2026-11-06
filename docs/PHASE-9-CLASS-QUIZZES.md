# Phase 9 — Teacher assessment builder

## Included
- Teachers create class quizzes from question-bank items authored in Phase 7.
- Each quiz stores a snapshot of prompt and answer options, preserving the assessment if the source question is later edited.
- Draft, publish, archive and delete controls.
- Students see only published quizzes in their enrolled classes.
- Student submissions are marked inside a database function; correct options and explanations remain in a teacher-only answer-key table.
- Students and owning teachers can read an attempt; other students cannot.

## Security
- Apply migrations 1–9 in order.
- RLS limits quiz authoring to teachers who own the class and student quiz access to enrolled students.
- Student browser access to answer keys is not granted.
- A database trigger prevents publishing a quiz until it has at least one question and a valid answer key for every question.
- `submit_class_quiz(uuid,jsonb)` checks student role, class membership, publication status, answer count and option ranges before calculating and recording the score.
- This is stronger than client-side answer keys, but still requires live RLS/RPC testing before any high-stakes use.

## Setup and verification
1. Apply all migrations through `202611060005_class_quiz_builder.sql`.
2. Sign in as a teacher and author question-bank items for a class in Content Studio.
3. Open Class Quiz Builder, select the class and one or more question-bank items, then create and publish the quiz.
4. Sign in as an enrolled student and submit a published quiz.
5. Verify the score is returned by the database function and that the student cannot select from `class_quiz_answer_keys`.
6. Verify the owning teacher can read the attempts in the quiz builder.

## Limitations
- Question-bank items must already exist in the selected class.
- Quiz attempts are retained as immutable submissions; retakes create new attempts.
- The existing formative practice quiz page remains separate and local-first.
- Live Supabase security verification requires configured credentials and separate teacher/student accounts.
