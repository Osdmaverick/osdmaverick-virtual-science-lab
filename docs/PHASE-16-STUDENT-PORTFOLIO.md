# Phase 16 — Student portfolio and achievement certificates

## Features
- Students add class-scoped investigation, project, practical and reflection entries.
- Entries can include a short learning summary and an optional external evidence link.
- Students can remove their own entries.
- Teachers review entries for classes they own and leave append-only feedback.
- Teachers issue achievement certificates to enrolled students.
- Students view their own feedback and certificates; certificates can be printed from the browser.
- Class filters, manual refresh and responsive layout.

## Setup
1. Apply migrations 1–16 in order.
2. Configure the Supabase Project URL and publishable key.
3. Sign in as a student and add a portfolio entry in an enrolled class.
4. Sign in as the owning teacher to review the entry, add feedback and issue a certificate.
5. Sign in as the student to verify the feedback and certificate are visible only to the intended learner.

## Security and scope
- Portfolio entries are student-owned and restricted to enrolled classes.
- Teachers read portfolio entries only in classes they own.
- Teacher feedback is stored separately and is append-only.
- Certificate issuance is limited to the owning class teacher and enrolled learners.
- Students can read only their own certificates.
- External evidence links are validated as HTTP(S) before rendering.
- Live database and RLS testing requires a configured Supabase project and separate teacher/student accounts.
- Certificates are printable browser documents; cryptographic signatures and public verification are not included in this phase.
