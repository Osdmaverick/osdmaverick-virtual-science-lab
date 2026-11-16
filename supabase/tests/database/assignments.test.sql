begin;

create extension if not exists pgtap with schema extensions;
select plan(31);

select has_table('public', 'assignments', 'assignments table exists');
select has_table('public', 'assignment_submissions', 'assignment submissions table exists');
select col_not_null('public', 'assignments', 'class_id', 'every assignment belongs to a class');
select has_index('public', 'assignment_submissions', 'assignment_submissions_one_per_student', 'one submission per student is enforced');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
('40000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase3-teacher-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Teacher A"}',now(),now()),
('40000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase3-teacher-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Teacher B"}',now(),now()),
('40000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase3-student-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Student A"}',now(),now()),
('40000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase3-student-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Student B"}',now(),now());

update public.profiles set role = 'teacher'
where id in ('40000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000002');

insert into public.classes (id, teacher_id, name)
values
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000001','Teacher A class'),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000002','Teacher B class');

insert into public.enrollments (class_id, student_id) values
('50000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000003'),
('50000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000004');

insert into public.assignments (id, class_id, title, instructions, points_possible, status)
values
('60000000-0000-4000-8000-000000000001','50000000-0000-4000-8000-000000000001','Cell structure','Label the cell.',20,'draft'),
('60000000-0000-4000-8000-000000000002','50000000-0000-4000-8000-000000000001','Food chains','Explain a food chain.',20,'published'),
('60000000-0000-4000-8000-000000000003','50000000-0000-4000-8000-000000000002','Chemical changes','Describe a reaction.',10,'published');

insert into public.assignment_submissions (id, assignment_id, student_id, response, status)
values ('70000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000004', 'A chemical reaction answer', 'submitted');

set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000003', true);

select is((select count(*)::integer from public.assignments), 1, 'student sees only published assignments in enrolled classes');
select is((select count(*)::integer from public.assignments where id = '60000000-0000-4000-8000-000000000001'), 0, 'student cannot see a draft assignment');
select is((select count(*)::integer from public.assignments where id = '60000000-0000-4000-8000-000000000003'), 0, 'student cannot see another class assignment');
select throws_ok(
  $$insert into public.assignment_submissions (assignment_id, student_id, response) values ('60000000-0000-4000-8000-000000000001', auth.uid(), 'draft leak')$$,
  '42501', null, 'student cannot submit to a draft assignment'
);
select lives_ok(
  $$insert into public.assignment_submissions (assignment_id, student_id, response, status) values ('60000000-0000-4000-8000-000000000002', auth.uid(), 'My answer', 'submitted')$$,
  'student can submit published work'
);
select is((select status from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 'submitted', 'submission status is stored');
select ok((select submitted_at is not null from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 'submission timestamp is assigned by the database');
select is((select count(*)::integer from public.assignment_submissions), 1, 'student can read only their own submissions');
select throws_ok(
  $$insert into public.assignment_submissions (assignment_id, student_id, response) values ('60000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000004', 'forged')$$,
  '42501', null, 'student cannot create a submission for another student'
);
select throws_ok(
  $$update public.assignment_submissions set score = 20 where assignment_id = '60000000-0000-4000-8000-000000000002'$$,
  '42501', null, 'student cannot write grading fields'
);
select throws_ok(
  $$insert into public.assignment_submissions (assignment_id, student_id, response, score) values ('60000000-0000-4000-8000-000000000002', auth.uid(), 'forged grade', 20)$$,
  '42501', null, 'student cannot supply a score during submission'
);
select lives_ok(
  $$update public.assignment_submissions set response = 'Revised answer' where assignment_id = '60000000-0000-4000-8000-000000000002'$$,
  'student can update their own ungraded response'
);
select is(
  (select response from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'),
  'Revised answer', 'student response update is saved'
);
select throws_ok(
  $$insert into public.assignment_submissions (assignment_id, student_id, response) values ('60000000-0000-4000-8000-000000000003', auth.uid(), 'not enrolled')$$,
  '42501', null, 'student cannot submit to a class they have not joined'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.assignments), 2, 'teacher sees assignments in their own class only');
select is((select count(*)::integer from public.assignment_submissions), 1, 'teacher can view submissions for their class');
select lives_ok(
  $$select public.grade_assignment_submission((select id from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 18, 'Well done.')$$,
  'owning teacher can grade a submission through the protected grading function'
);
select is((select score from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 18, 'teacher score is saved');
select is((select graded_by from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), auth.uid(), 'grader identity is set by the database');
select ok((select graded_at is not null from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 'grading timestamp is set by the database');
select throws_ok(
  $$select public.grade_assignment_submission((select id from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 21, 'Too high')$$,
  'P0001', 'The score must be between zero and the assignment points available.', 'teacher cannot award more than the points available'
);
select throws_ok(
  $$select public.grade_assignment_submission((select id from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000003'), 5, 'Wrong class')$$,
  'P0001', 'You are not authorised to grade this submission.', 'teacher cannot grade another teacher class'
);
select throws_ok(
  $$update public.assignments set points_possible = 10 where id = '60000000-0000-4000-8000-000000000002'$$,
  'P0001', 'Points available cannot be lower than an existing submission score.', 'points cannot be reduced below a recorded score'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000003', true);
select throws_ok(
  $$update public.assignment_submissions set response = 'Changed after grading' where assignment_id = '60000000-0000-4000-8000-000000000002'$$,
  'P0001', 'This submission has already been graded and is locked.', 'student cannot edit work after grading'
);
select is((select score from public.assignment_submissions where assignment_id = '60000000-0000-4000-8000-000000000002'), 18, 'student cannot alter the saved grade');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '40000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.assignment_submissions), 1, 'second teacher sees only their own class submissions');
select is((select count(*)::integer from public.assignments), 1, 'second teacher sees only their own assignments');

select * from finish();
rollback;
