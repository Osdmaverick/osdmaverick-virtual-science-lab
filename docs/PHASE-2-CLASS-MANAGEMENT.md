# Phase 2 — Class management

## What this adds

- Teachers can create classes with a name and optional description.
- Each class receives a random invite code stored separately from the student-visible class record.
- Students can join using the code while signed in.
- Teachers can see their class roster and the basic profile names of enrolled students.
- Students can see only their own enrolments and the classes they have joined.
- Class membership is unique per student/class pair; re-entering a code is safe and does not create duplicate enrolments.

## Apply migrations in order

1. Apply `supabase/migrations/202611050001_profiles.sql` (Phase 1).
2. Apply `supabase/migrations/202611050002_classes.sql` (Phase 2).

The Phase 2 migration assumes Phase 1's `public.profiles` table and `auth.users` trigger are present.

## Permissions and security

- A profile must have role `teacher` to create or modify classes.
- Teachers can modify only classes they own.
- Public browser clients cannot insert or modify enrolment rows directly.
- Student enrolment is performed by the `join_class(text)` database function, which verifies the signed-in user is a student and checks the invite code.
- Invite codes are held in a separate table and are readable only by the class owner.
- Class, roster and profile reads are protected by Row Level Security.
- The browser must never contain a service-role key.

## Manual setup

A platform administrator must first promote a verified teacher using the Phase 1 procedure. The teacher can then sign in and create a class. Share its generated invite code only with intended students.

## Current boundary

This is the class-management foundation. Assignments, class announcements, attendance, cloud notebooks and assessment records are not part of this phase yet. The existing student notebook and teacher assessment dashboard still use browser-local storage.

## Verification before real student use

- Test teacher account creates a class and receives a join code.
- Test an enrolled student can see the class but cannot read its invite code.
- Test a second student can join with the code.
- Test a student cannot list another student's membership or modify the class.
- Test a student account cannot create a class.
- Test a teacher cannot read or modify another teacher's class or roster.
- Test deleting a class removes its invite code and enrolments.
