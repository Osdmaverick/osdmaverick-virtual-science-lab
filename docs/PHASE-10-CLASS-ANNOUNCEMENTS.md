# Phase 10 — Class announcements

## Features
- Teachers create, edit, publish, unpublish, pin, archive and delete class announcements.
- Announcements are scoped to teacher-owned classes.
- Students see only published, unexpired announcements in their enrolled classes.
- Students mark notices as read; teachers can inspect read-receipt totals for their own classes.
- Draft and archived notices are never exposed to students.

## Setup
1. Apply migrations 1–10 in order.
2. Configure `assets/supabase-config.js` with the Supabase Project URL and publishable key.
3. Sign in as a teacher and publish an announcement to one of your classes.
4. Sign in as an enrolled student, open `class-announcements.html` and mark the notice as read.
5. Sign in as the owning teacher and refresh to review read receipts.

## Security
- RLS limits teacher management to their own classes.
- Student reads are restricted to published, unexpired notices in enrolled classes.
- Student read receipts can be inserted/updated only by their owner for a visible announcement.
- Class teachers can read read receipts for classes they own.
- Live database/RLS isolation requires a configured Supabase project and separate teacher/student accounts.

## Scope
- Announcements are in-app notices; email, push and SMS delivery are not included.
- Expiry is checked when student queries run; it does not delete the announcement.
