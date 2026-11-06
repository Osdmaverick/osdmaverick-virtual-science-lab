-- Phase 5: class-scoped quiz result submissions.
-- Apply after migrations 202611050001_profiles.sql through 202611060001_lab_notebook_sync.sql.
create table if not exists public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id text not null check (char_length(quiz_id) between 1 and 120),
  quiz_title text not null check (char_length(quiz_title) between 1 and 200),
  score integer not null check (score >= 0),
  total integer not null check (total > 0 and score <= total),
  answers jsonb not null default '{}'::jsonb check (jsonb_typeof(answers) = 'object'),
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists quiz_attempts_class_submitted_idx on public.quiz_attempts(class_id, submitted_at desc);
create index if not exists quiz_attempts_student_submitted_idx on public.quiz_attempts(student_id, submitted_at desc);
alter table public.quiz_attempts enable row level security;
drop policy if exists "Students submit and read own quiz attempts" on public.quiz_attempts;
create policy "Students submit and read own quiz attempts" on public.quiz_attempts
  for all to authenticated
  using (student_id = auth.uid() and public.is_class_student(class_id))
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student')
    and public.is_class_student(class_id)
  );
drop policy if exists "Class teachers read quiz attempts" on public.quiz_attempts;
create policy "Class teachers read quiz attempts" on public.quiz_attempts
  for select to authenticated
  using (public.is_class_teacher(class_id));
revoke all on public.quiz_attempts from anon, authenticated;
grant select, insert on public.quiz_attempts to authenticated;
grant usage, select on sequence public.quiz_attempts_id_seq to authenticated;
comment on table public.quiz_attempts is 'Student quiz submissions scoped to a class; teachers can read attempts for classes they own.';
