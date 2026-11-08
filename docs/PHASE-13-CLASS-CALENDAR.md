# Phase 13 — Class calendar

## Features
- Teachers can create, edit and delete class events.
- Event types include lessons, practical activities, assessments, meetings and other events.
- Students can view events for classes in which they are enrolled.
- Published assignment deadlines appear alongside class events.
- Users can filter the agenda by class and month.
- The page works without exposing event controls to students.

## Setup
1. Apply migrations 1–13 in order.
2. Configure Supabase with the Project URL and publishable key.
3. Sign in as a teacher, open Class calendar and add an event to one of your classes.
4. Sign in as an enrolled student and confirm the event and published assignment deadlines appear.
5. Verify students cannot create, edit or delete events.

## Security and scope
- Row-level security restricts event management to the owning class teacher.
- Enrolled students have read-only access to events in their classes.
- Assignment deadlines reuse the existing assignment table and its RLS policies.
- This phase adds no email, SMS or push delivery and does not create external calendar integrations.
- Live RLS verification requires a configured Supabase project and separate teacher/student accounts.
