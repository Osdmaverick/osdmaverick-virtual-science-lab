# Phase 1 — Authentication and backend foundation

## Architecture decision

The platform will use **Supabase Auth + PostgreSQL**. The front end remains a static GitHub Pages site and uses only the Supabase project URL and the publishable/anon key. Never put a service-role key, database password, or other secret in browser code or Git.

## Current implementation boundary

This phase is being prepared on `feature/phase-1-auth-foundation`, based on the unmerged platform-refresh branch. The existing notebook and teacher dashboard still use browser-local storage. They must not be described as cloud-synchronised until a later migration moves their records to authenticated database tables.

## Supabase project setup

1. Create a Supabase project in the Supabase dashboard.
2. In **Project Settings → API**, copy the Project URL and publishable key (or legacy anon key).
3. In **SQL Editor**, run `supabase/migrations/202611050001_profiles.sql`.
4. In **Authentication → URL Configuration**, set the Site URL to the GitHub Pages site and add the local development URL to Redirect URLs if needed.
5. Keep email confirmation enabled for production. Configure SMTP before inviting real students; the default email service is for testing and has sending limits.
6. Do not expose the service-role key. The browser only needs the publishable/anon key, with database access controlled by Row Level Security.

## Identity and permissions

- Public registration creates a **student** profile only.
- Teacher access is granted manually by a trusted project administrator in the Supabase SQL Editor after verifying the person's identity.
- The profile table allows each signed-in user to read their own profile and update only their own display name.
- The database migration deliberately does not permit a browser client to change the role field.
- Do not use client-side role checks as the only security boundary. Every future class, assignment, submission and assessment table must have database Row Level Security policies.

To promote a verified teacher, find their UUID under **Authentication → Users**, then run:

```sql
update public.profiles
set role = 'teacher'
where id = 'AUTH-USER-UUID';
```

## Required environment values

The browser client needs:
- `SUPABASE_URL` — project URL
- `SUPABASE_PUBLISHABLE_KEY` — publishable/anon key

These are public client configuration values, not secrets. Do not commit real project values until the project is created and the owner explicitly approves adding them. The service-role key must never be used in this site.

## Rollout checklist

- [ ] Supabase project created and billing/region reviewed.
- [ ] Profiles migration applied successfully.
- [ ] Site URL and redirect URLs configured.
- [ ] SMTP/email confirmation configured and tested.
- [ ] Public signup tested: new user receives student role.
- [ ] Teacher promotion tested through privileged SQL.
- [ ] RLS verified: one user cannot read or edit another user's profile.
- [ ] Password reset and sign-out tested.
- [ ] Only then connect the UI and begin class management.

## Data protection

Collect only the information required for learning. Avoid collecting student dates of birth, home addresses, health information or other sensitive data. Establish parental/guardian consent and school data-handling procedures where required before enrolling minors. Use test accounts and synthetic student records during development.
