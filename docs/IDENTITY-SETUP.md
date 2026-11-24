# Identity setup and account page

## Current state

The account page and browser integration are prepared on the isolated development branch. They are not part of the live GitHub Pages site and are not connected to a hosted Supabase project.

## Required order

1. Create a Supabase project and review the available region and billing settings.
2. Apply `supabase/migrations/202611140001_profiles.sql` to the project only after local tests pass and the project owner approves the operation.
3. Configure the Supabase Auth Site URL and redirect URLs for the GitHub Pages domain.
4. Copy `assets/supabase-config.example.js` to `assets/supabase-config.js`.
5. Add the project URL and publishable key to the ignored local config file. The publishable key is designed for browser use; never use a secret or service-role key.
6. Test signup, email confirmation, sign-in, password reset, password update and sign-out using test accounts.
7. Promote a verified teacher through a privileged administrator session, not through the signup form or browser client.
8. Verify profile RLS with at least two separate accounts before any real student use.

## Signup and roles

The signup form submits only a full name as user metadata. It does not send a role. The database trigger assigns every new account the student role even if someone attempts to add a teacher role to client-controlled metadata. Only a trusted administrator can promote a verified teacher.

## Browser configuration

The real `assets/supabase-config.js` file is ignored by Git. It must never be committed. Browser code must use only the project URL and publishable key. RLS and SQL grants—not secrecy of the publishable key—protect the data.

## Student data

Use synthetic accounts during testing. Before onboarding minors, establish school/guardian consent, retention, access, and incident-handling procedures appropriate to the applicable requirements. Collect only the minimum information needed for learning.
