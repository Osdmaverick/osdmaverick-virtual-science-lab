begin;

select plan(10);

select has_table('public', 'profiles', 'profiles table exists');
select has_column('public', 'profiles', 'role', 'profiles has a role column');
select has_column('public', 'profiles', 'full_name', 'profiles has a full_name column');

-- Simulate two public registrations. The second user attempts to supply a
-- teacher role in user metadata; the trigger must ignore that value.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
(
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'student-one@example.test', '',
  now(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Student One"}', now(), now()
),
(
  '10000000-0000-4000-8000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated', 'authenticated', 'student-two@example.test', '',
  now(), '{"provider":"email","providers":["email"]}',
  '{"full_name":"Student Two","role":"teacher"}', now(), now()
);

select is(
  (select role from public.profiles where id = '10000000-0000-4000-8000-000000000001'),
  'student',
  'new registrations receive the student role'
);
select is(
  (select role from public.profiles where id = '10000000-0000-4000-8000-000000000002'),
  'student',
  'client-supplied teacher metadata cannot elevate a new account'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
select is(
  (select count(*)::integer from public.profiles),
  1,
  'a student can read only their own profile'
);
select lives_ok(
  $$update public.profiles set full_name = 'Updated Student' where id = '10000000-0000-4000-8000-000000000001'$$,
  'a student can update their own display name'
);
select throws_ok(
  $$update public.profiles set role = 'teacher' where id = '10000000-0000-4000-8000-000000000001'$$,
  '42501',
  null,
  'a student cannot promote themselves to teacher'
);
select throws_ok(
  $$insert into public.profiles (id, full_name, role) values ('10000000-0000-4000-8000-000000000003', 'Forged', 'student')$$,
  '42501',
  null,
  'a browser user cannot insert arbitrary profiles'
);

reset role;
set local role anon;
select is(
  (select count(*)::integer from public.profiles),
  0,
  'anonymous users cannot read profiles'
);

select * from finish();
rollback;
