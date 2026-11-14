# Phase 2 — Class management

## What this adds

- Teachers can create classes with a name and optional description.
- Each class receives a random invite code stored separately from student-visible class records.
- Students can join using the code while signed in.
- Teachers can see their class roster and enrolled students' basic profile names.
- Students can see only classes they have joined and their own enrolments.
- Membership is unique per student/class pair; re-entering a code does not create duplicate enrolments.

## Apply migrations in order

1. Apply `supabase/migrations/202611140001_profiles.sql` (identity foundation).
2. Apply `supabase/migrations/202611140002_classes.sql` (class management).

The Phase 2 migration depends on the profiles table and trusted role assignment from Phase 1.

## Permissions and security

- Only a profile with role `teacher` can create or modify classes.
- Teachers can modify only classes they own.
- Browser clients cannot directly create or modify enrolment rows.
- Student enrolment is performed by the `join_class(text)` database function, which checks the signed-in user, student role and invite code.
- Invite codes are stored separately and readable only by the class owner.
- Class, roster and profile reads are protected by Row Level Security.
- The browser must never contain a Supabase secret key.

## Manual setup

A platform administrator must promote a verified teacher through a trusted administrative process. The teacher can then sign in and create a class. Share its generated invite code only with intended students.

For browser setup, follow [Identity setup](IDENTITY-SETUP.md). The real `assets/supabase-config.js` must contain only the project URL and publishable key and must remain uncommitted.

## Current boundary

This is the class-management foundation. Assignments, class announcements, attendance, cloud notebooks and assessment records are not part of this phase yet. Existing notebook and teacher assessment tools may still use browser-local storage.

## Verification before real student use

- A teacher account creates a class and receives a join code.
- An enrolled student can see the class but cannot read its invite code.
- A second student can join with the code.
- A student cannot list another student's membership or modify a class.
- A student account cannot create a class.
- A teacher cannot read or modify another teacher's class or roster.
- Deleting a class removes its invite code and enrolments.
- Test with synthetic accounts before onboarding real students.
