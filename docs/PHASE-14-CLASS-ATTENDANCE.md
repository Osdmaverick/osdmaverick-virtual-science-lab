# Phase 14 — Class attendance

## Features
- Teachers create dated attendance registers for their own classes.
- Teachers mark each enrolled learner present, absent, late or excused, with an optional note.
- Unmarked learners are not written to the database.
- Teachers can reopen registers and update attendance.
- Students can view only their own recorded attendance and notes.
- Class filters, register summaries and manual refresh are included.

## Setup
1. Apply migrations 1–14 in order.
2. Configure Supabase with the Project URL and publishable key.
3. Sign in as a teacher, open Class attendance and create a register.
4. Mark attendance for enrolled learners and save.
5. Sign in as an enrolled student and confirm only that student's record is visible.

## Security and scope
- RLS restricts register management to the owning class teacher.
- Attendance records can be created only for learners enrolled in that class.
- Students can select only their own attendance rows.
- Column grants restrict updates to attendance status, note and marked timestamp.
- Live RLS verification requires a configured Supabase project and separate teacher/student accounts.
- No biometric attendance, location tracking, automated absence alerts or external integrations are included.
