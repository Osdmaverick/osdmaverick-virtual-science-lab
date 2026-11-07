# Phase 12 — Assessment result notifications

## Features
- Notify a student when a teacher grades an assignment submission.
- Include the assignment title, awarded score and teacher feedback preview.
- Notify a student when a teacher assesses a cloud lab report.
- Include lab feedback when provided.
- Regrading or editing assessment feedback refreshes the existing notification and marks it unread again.
- Notifications remain in the Phase 11 recipient-only inbox.

## Setup
1. Apply migrations 1–12 in order.
2. Configure Supabase using the Project URL and publishable key.
3. Submit an assignment as a student, then grade it from the teacher account.
4. Assess a student's cloud lab report from the teacher dashboard.
5. Sign in as that student and verify both notifications and their destination links.

## Security and delivery
- Database triggers create notifications; clients cannot insert or delete notification records.
- The existing notifications RLS policies restrict reads and read-state changes to each recipient.
- Existing assignment and lab-assessment RLS policies remain responsible for who may grade or assess.
- This phase sends in-app notifications only. Email, SMS, browser push and realtime delivery are not included.
- Live RLS verification requires a configured Supabase project and separate teacher/student accounts.
