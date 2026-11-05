-- OSDMaverick Virtual Science Lab — Phase 3 assignments and submissions
-- Apply after the Phase 1 profiles and Phase 2 class-management migrations.

create table if not exists public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 2000),
  instructions text not null default '' check (char_length(instructions) <= 12000),
  due_at timestamptz,
  points_possible integer not null default 100 check (points_possible between 1 and 1000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignments_teacher_matches_class
    foreign key (class_id, teacher_id)
    references public.classes(id, teacher_id)
    on delete cascade
);

-- The composite FK above requires a matching unique key on classes.
create unique index if not exists classes_id_teacher_id_uidx
  on public.classes(id, teacher_id);

create table if not exists public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  response jsonb not null default '{}'::jsonb
    check (jsonb_typeof(response) = 'object'),
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  score numeric(7,2) check (score is null or score >= 0),
  teacher_feedback text not null default '' check (char_length(teacher_feedback) <= 5000),
  graded_at timestamptz,
  graded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assignment_id, student_id)
);

create index if not exists assignments_class_status_due_idx
  on public.assignments(class_id, status, due_at);
create index if not exists submissions_student_idx
  on public.assignment_submissions(student_id, updated_at desc);
create index if not exists submissions_assignment_idx
  on public.assignment_submissions(assignment_id, status);

alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;

-- Assignments are visible to the owning teacher and to enrolled students
-- only after publication.
drop policy if exists "Teachers manage assignments in their classes" on public.assignments;
create policy "Teachers manage assignments in their classes"
  on public.assignments for all to authenticated
  using (teacher_id = auth.uid() and public.is_class_teacher(class_id))
  with check (teacher_id = auth.uid() and public.is_class_teacher(class_id));

drop policy if exists "Enrolled students read published assignments" on public.assignments;
create policy "Enrolled students read published assignments"
  on public.assignments for select to authenticated
  using (status = 'published' and public.is_class_student(class_id));

-- Students can see and maintain only their own work. Teachers can see and
-- grade submissions belonging to classes they own.
drop policy if exists "Students and class teachers read submissions" on public.assignment_submissions;
create policy "Students and class teachers read submissions"
  on public.assignment_submissions for select to authenticated
  using (
    student_id = auth.uid()
    or exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_class_teacher(a.class_id)
    )
  );

drop policy if exists "Enrolled students create submissions" on public.assignment_submissions;
create policy "Enrolled students create submissions"
  on public.assignment_submissions for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1
      from public.profiles p
      join public.assignments a on a.id = assignment_id
      where p.id = auth.uid()
        and p.role = 'student'
        and a.status = 'published'
        and public.is_class_student(a.class_id)
    )
  );

drop policy if exists "Students update ungraded work" on public.assignment_submissions;
create policy "Students update ungraded work"
  on public.assignment_submissions for update to authenticated
  using (
    student_id = auth.uid()
    and graded_at is null
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and a.status = 'published'
        and public.is_class_student(a.class_id)
    )
  )
  with check (
    student_id = auth.uid()
    and graded_at is null
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and a.status = 'published'
        and public.is_class_student(a.class_id)
    )
  );

drop policy if exists "Class teachers grade submissions" on public.assignment_submissions;
create policy "Class teachers grade submissions"
  on public.assignment_submissions for update to authenticated
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_class_teacher(a.class_id)
    )
  )
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id and public.is_class_teacher(a.class_id)
    )
    and (score is null or score <= (
      select a.points_possible from public.assignments a where a.id = assignment_id
    ))
    and (graded_by is null or graded_by = auth.uid())
  );

-- Browser permissions are column-scoped so learners cannot write grading data.
revoke all on public.assignments, public.assignment_submissions from anon, authenticated;
grant select on public.assignments to authenticated;
grant insert (class_id, teacher_id, title, description, instructions, due_at, points_possible, status, published_at)
  on public.assignments to authenticated;
grant update (title, description, instructions, due_at, points_possible, status, published_at)
  on public.assignments to authenticated;
grant delete on public.assignments to authenticated;

grant select on public.assignment_submissions to authenticated;
grant insert (assignment_id, student_id, response, status, submitted_at)
  on public.assignment_submissions to authenticated;
grant update (response, status, submitted_at)
  on public.assignment_submissions to authenticated;
grant update (score, teacher_feedback, graded_at, graded_by)
  on public.assignment_submissions to authenticated;

create or replace function public.set_assignment_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  if tg_table_name = 'assignment_submissions' and new.status = 'submitted'
     and (tg_op = 'INSERT' or old.status is distinct from 'submitted') then
    new.submitted_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists assignments_set_updated_at on public.assignments;
create trigger assignments_set_updated_at before update on public.assignments
for each row execute function public.set_assignment_updated_at();

drop trigger if exists submissions_set_updated_at on public.assignment_submissions;
create trigger submissions_set_updated_at before insert or update on public.assignment_submissions
for each row execute function public.set_assignment_updated_at();

comment on table public.assignments is 'Teacher-created class assignments and learning activities.';
comment on table public.assignment_submissions is 'Student responses and teacher feedback for class assignments.';
