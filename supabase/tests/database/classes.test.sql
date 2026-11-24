begin;

create extension if not exists pgtap with schema extensions;
select plan(21);

select has_table('public', 'classes', 'classes table exists');
select has_table('public', 'class_invite_codes', 'private invite code table exists');
select has_table('public', 'enrollments', 'enrolments table exists');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
('20000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teacher-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Teacher A"}',now(),now()),
('20000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','teacher-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Teacher B"}',now(),now()),
('20000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','student-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Student A"}',now(),now()),
('20000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','student-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Student B"}',now(),now());

update public.profiles set role = 'teacher'
where id in ('20000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000002');

insert into public.classes (id, teacher_id, name, description)
values
('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','Biology 8','Cell biology'),
('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000002','Chemistry 9','Matter');

select is((select count(*)::integer from public.class_invite_codes), 2, 'each new class receives one invite code');
select is((select count(*)::integer from public.class_invite_codes where join_code !~ '^[A-F0-9]{10}$'), 0, 'invite codes use the expected random format');
select set_config('test.class_code', (select join_code from public.class_invite_codes where class_id = '30000000-0000-4000-8000-000000000001'), true);

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000003', true);
select lives_ok($$select * from public.join_class(current_setting('test.class_code'))$$, 'a student can join with a valid code');
select is((select count(*)::integer from public.enrollments where student_id = auth.uid()), 1, 'joining creates one enrolment');
select lives_ok($$select * from public.join_class(current_setting('test.class_code'))$$, 'joining the same class twice is safe');
select is((select count(*)::integer from public.enrollments where student_id = auth.uid()), 1, 'duplicate joins do not duplicate enrolments');
select is((select count(*)::integer from public.classes), 1, 'students see only classes they joined');
select is((select count(*)::integer from public.class_invite_codes), 0, 'students cannot read invite codes');
select is((select count(*)::integer from public.enrollments), 1, 'students cannot read another learner enrolment');
select throws_ok($$insert into public.classes (teacher_id,name) values (auth.uid(),'Forged class')$$, '42501', null, 'students cannot create classes');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.classes), 1, 'teacher sees only their own class and enrolled classes');
select is((select count(*)::integer from public.class_invite_codes), 1, 'teacher can read only their own invite code');
select is((select count(*)::integer from public.enrollments), 1, 'teacher can read their class roster');
select is((select count(*)::integer from public.profiles where id = '20000000-0000-4000-8000-000000000003'), 1, 'teacher can read enrolled learner basic profile');
select is((select count(*)::integer from public.profiles where id = '20000000-0000-4000-8000-000000000004'), 0, 'teacher cannot read unrelated learner profile');
select lives_ok('update public.classes set name = ''Hijacked'' where id = ''30000000-0000-4000-8000-000000000002''', 'updating another teacher class does not expose an error');

reset role;
select is((select name from public.classes where id = '30000000-0000-4000-8000-000000000002'), 'Chemistry 9', 'another teacher class remains unchanged');

set local role authenticated;
select set_config('request.jwt.claim.sub', '20000000-0000-4000-8000-000000000002', true);
select throws_ok($$select * from public.join_class(current_setting('test.class_code'))$$, 'P0001', 'Only student accounts can join a class with a code.', 'teacher accounts cannot enrol as students');

select * from finish();
rollback;
