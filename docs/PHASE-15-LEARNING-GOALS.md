# Phase 15 — Student learning goals

## Features
- Students create measurable goals in classes where they are enrolled.
- Students set a target date, describe success and update status and percentage complete.
- Teachers can review goals for their own classes and add feedback.
- Students see the feedback history attached to their own goals.
- Class filters, summary counts and manual refresh.

## Setup
1. Apply migrations 1–15 in order.
2. Configure the Supabase Project URL and publishable key.
3. Sign in as a student and create a goal in an enrolled class.
4. Sign in as the owning teacher, review the goal and leave feedback.
5. Confirm the student can see the feedback and other students cannot.

## Security and scope
- RLS restricts student goal creation and changes to the student's own enrolled classes.
- Teachers can read goals only for classes they own.
- Teacher feedback is append-only and can be inserted only by the owning class teacher.
- Students can read only feedback on their own goals.
- Database grants separate learner goal fields from teacher feedback.
- Live database and RLS testing requires a configured Supabase project and separate teacher/student accounts.
