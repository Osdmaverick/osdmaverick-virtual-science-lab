# Backend foundation and phased rollout

## Purpose

Prepare a secure, testable Supabase foundation without changing the live GitHub Pages website. This branch starts directly from `main`; it does not bring the unmerged draft feature chain into production.

## Current production boundary

The public website remains a static GitHub Pages site published from `main`. No authentication, student records, teacher accounts, class management, or database-backed learning records are enabled on the live site by this foundation work.

## Development approach

1. Keep backend preparation on an isolated branch based on `main`.
2. Use Supabase CLI migrations as the source of truth for database changes.
3. Develop and test against a local Supabase stack before connecting a remote project.
4. Review every migration for least privilege, Row Level Security (RLS), and safe function execution.
5. Use synthetic test accounts and records during development.
6. Roll out one feature phase at a time through a reviewed pull request.
7. Do not merge, deploy, or connect production credentials without the owner's explicit approval.

## Local setup

Install the Supabase CLI using the official installation instructions, then run:

```sh
supabase start
supabase status
```

The local CLI configuration is in `supabase/config.toml`. Local database migrations belong in `supabase/migrations/` and must use timestamped filenames. Before a migration is accepted, it must be applied to a clean local database and checked with the available Supabase database linting and security tests.

## Environment and key handling

- Browser code may use only the Supabase project URL and publishable key.
- A publishable key is not an authorization mechanism; every exposed table and function must enforce database permissions and RLS.
- Secret keys, database passwords, access tokens, and service-role keys must remain in trusted server-side environments or local secret stores. Never place them in browser JavaScript, Git, screenshots, or chat.
- Keep local environment files and the browser config file out of version control.
- Do not add real project credentials to this repository until the owner has created the project and explicitly approved the configuration change.

## Existing draft implementation audit

Earlier authentication and class-management work exists on separate draft branches. It is not being copied blindly into this foundation branch.

Initial review identified work that must be addressed before reuse:

- The draft authentication page contains a literal escaped newline before the password-update form; correct and validate the markup.
- Authentication session initialization and auth-state callbacks both render the session; consolidate this flow to avoid duplicate or out-of-order UI updates.
- Run the profile and class migrations against a clean local Supabase database, then verify grants, RLS policies, trigger behavior, and security-definer functions with separate student and teacher test accounts.
- The class migration depends on the profile migration and must be tested in order. A static review is not a substitute for database execution and cross-account authorization tests.

## Proposed rollout sequence

- **Foundation:** CLI configuration, migration workflow, local testing, environment handling, and security checks.
- **Identity:** student-default registration, verified teacher provisioning, profile access, password reset, and sign-out.
- **Classes:** teacher-owned classes, private invite codes, student enrollment, and roster visibility.
- **Learning records:** assignments, submissions, grading, cloud notebooks, quizzes, and portfolios, each with independent RLS tests.

## Release gate

A phase is not ready for production until its migration and browser tests pass, its access-control tests demonstrate that one account cannot access another account's records without authorization, and its user-facing behavior has been reviewed. Production rollout requires explicit owner approval.
