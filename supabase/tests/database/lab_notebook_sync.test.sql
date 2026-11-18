begin;

create extension if not exists pgtap with schema extensions;
select plan(23);

select has_table('public', 'lab_reports', 'cloud lab reports table exists');
select has_table('public', 'lab_report_assessments', 'lab report assessments table exists');
select col_not_null('public', 'lab_reports', 'student_id', 'every cloud report has a student owner');
select has_index('public', 'lab_reports', 'lab_reports_class_id_student_id_client_report_id_key', 'report sync key is unique per student and class');

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
('41000000-0000-4000-8000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase4-teacher-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Teacher A"}',now(),now()),
('41000000-0000-4000-8000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase4-teacher-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Teacher B"}',now(),now()),
('41000000-0000-4000-8000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase4-student-a@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Student A"}',now(),now()),
('41000000-0000-4000-8000-000000000004','00000000-0000-0000-0000-000000000000','authenticated','authenticated','phase4-student-b@example.test','',now(),'{"provider":"email","providers":["email"]}','{"full_name":"Student B"}',now(),now());

update public.profiles set role = 'teacher'
where id in ('41000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000002');

insert into public.classes (id, teacher_id, name)
values
('51000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000001','Teacher A class'),
('51000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000002','Teacher B class');

insert into public.enrollments (class_id, student_id) values
('51000000-0000-4000-8000-000000000001','41000000-0000-4000-8000-000000000003'),
('51000000-0000-4000-8000-000000000002','41000000-0000-4000-8000-000000000004');

set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000003', true);

select lives_ok(
  $$select * from public.sync_lab_report(
    '51000000-0000-4000-8000-000000000001',
    'local-report-001',
    '{"title":"Plant growth","observations":"Seedling grew 2 cm"}'::jsonb,
    0,
    now()
  )$$,
  'student can sync a report to an enrolled class'
);
select is(
  (select revision from public.lab_reports where client_report_id = 'local-report-001'),
  1,
  'first cloud sync creates revision one'
);
select is(
  (select count(*)::integer from public.lab_reports),
  1,
  'student can read their own cloud report'
);
select throws_ok(
  $$insert into public.lab_reports (class_id, student_id, client_report_id, payload)
    values ('51000000-0000-4000-8000-000000000001', auth.uid(), 'direct-write', '{"title":"No"}'::jsonb)$$,
  '42501', null, 'students cannot bypass the revision-checked sync function'
);
select throws_ok(
  $$delete from public.lab_reports where client_report_id = 'local-report-001'$$,
  '42501', null, 'students cannot delete cloud reports and erase attached teacher assessments'
);
select throws_ok(
  $$select * from public.sync_lab_report(
    '51000000-0000-4000-8000-000000000001',
    'malformed-report',
    '{"title":"Missing report fields"}'::jsonb,
    0,
    now()
  )$$,
  'P0001', 'A report must contain title, question, method, evidence and conclusion only.',
  'sync rejects incomplete report payloads'
);
select throws_ok(
  $$select * from public.sync_lab_report(
    '51000000-0000-4000-8000-000000000002',
    'wrong-class-report',
    '{"title":"Not enrolled"}'::jsonb,
    0,
    now()
  )$$,
  'P0001', 'You are not enrolled in this class.', 'student cannot sync to a class they have not joined'
);
select lives_ok(
  $$select * from public.sync_lab_report(
    '51000000-0000-4000-8000-000000000001',
    'local-report-001',
    '{"title":"Plant growth","observations":"Seedling grew 3 cm"}'::jsonb,
    1,
    now()
  )$$,
  'student can update a report using its current revision'
);
select is(
  (select revision from public.lab_reports where client_report_id = 'local-report-001'),
  2,
  'successful update increments the cloud revision'
);
select is(
  (select conflict from public.sync_lab_report(
    '51000000-0000-4000-8000-000000000001',
    'local-report-001',
    '{"title":"Stale copy"}'::jsonb,
    1,
    now()
  )),
  true,
  'stale local revision is reported as a conflict'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.lab_reports), 0, 'another student cannot read the report');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000001', true);
select is((select count(*)::integer from public.lab_reports), 1, 'owning teacher can read reports from their class');
select lives_ok(
  $$select public.save_lab_report_assessment(
    (select id from public.lab_reports where client_report_id = 'local-report-001'),
    '{"question":4,"method":3,"evidence":4,"conclusion":3}'::jsonb,
    'Clear observations and a sound conclusion.'
  )$$,
  'owning teacher can save a rubric assessment'
);
select is((select count(*)::integer from public.lab_report_assessments), 1, 'assessment is stored once per report');

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000002', true);
select is((select count(*)::integer from public.lab_reports), 0, 'another teacher cannot read this class report');
select throws_ok(
  $$select public.save_lab_report_assessment(
    (select id from public.lab_reports where client_report_id = 'local-report-001'),
    '{"question":4,"method":4,"evidence":4,"conclusion":4}'::jsonb,
    'Unauthorised assessment.'
  )$$,
  'P0001', 'You are not authorised to assess this report.', 'another teacher cannot assess a report outside their classes'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000003', true);
select is((select count(*)::integer from public.lab_report_assessments), 1, 'student can read teacher feedback on their own report');
select throws_ok(
  $$update public.lab_report_assessments set feedback = 'Forged feedback'$$,
  '42501', null, 'student cannot alter assessment scores or feedback'
);

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub', '41000000-0000-4000-8000-000000000004', true);
select is((select count(*)::integer from public.lab_report_assessments), 0, 'another student cannot read report assessment data');

select * from finish();
rollback;
