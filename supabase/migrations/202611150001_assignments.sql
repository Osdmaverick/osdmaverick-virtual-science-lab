-- OSDMaverick Virtual Science Lab — assignments and grading foundation
-- Depends on the identity and class-management migrations.

create table public.assignments (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 2 and 160),
  instructions text not null default '' check (char_length(instructions) <= 10000),
  due_at timestamptz,
  points_possible integer not null default 100 check (points_possible between 1 and 10000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.assignment_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.assignments(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  response text not null default '' check (char_length(response) <= 50000),
  status text not null default 'draft' check (status in ('draft', 'submitted')),
  submitted_at timestamptz,
  score integer check (score >= 0),
  feedback text not null default '' check (char_length(feedback) <= 10000),
  graded_by uuid references public.profiles(id) on delete set null,
  graded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint assignment_submissions_one_per_student unique (assignment_id, student_id),
  constraint assignment_submissions_grading_consistency check (
    (score is null and graded_at is null and graded_by is null)
    or (score is not null and graded_at is not null and graded_by is not null)
  )
);

create index assignments_class_status_idx on public.assignments(class_id, status);
create index submissions_assignment_idx on public.assignment_submissions(assignment_id);
create index submissions_student_idx on public.assignment_submissions(student_id);

alter table public.assignments enable row level security;
alter table public.assignment_submissions enable row level security;

create policy "Teachers manage assignments in their own classes"
  on public.assignments for all to authenticated
  using (public.is_class_teacher(class_id) and public.current_user_is_teacher())
  with check (public.is_class_teacher(class_id) and public.current_user_is_teacher());

create policy "Enrolled students read published assignments"
  on public.assignments for select to authenticated
  using (status = 'published' and public.is_class_student(class_id));

create policy "Students read their own submissions"
  on public.assignment_submissions for select to authenticated
  using (student_id = auth.uid());

create policy "Class teachers read submissions"
  on public.assignment_submissions for select to authenticated
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and public.is_class_teacher(a.class_id)
        and public.current_user_is_teacher()
    )
  );

create policy "Students create their own submissions for published work"
  on public.assignment_submissions for insert to authenticated
  with check (
    student_id = auth.uid()
    and exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and a.status = 'published'
        and public.is_class_student(a.class_id)
    )
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
  );

create policy "Students update their own ungraded submissions"
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

create policy "Class teachers grade submissions"
  on public.assignment_submissions for update to authenticated
  using (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and public.is_class_teacher(a.class_id)
        and public.current_user_is_teacher()
    )
  )
  with check (
    exists (
      select 1 from public.assignments a
      where a.id = assignment_id
        and public.is_class_teacher(a.class_id)
        and public.current_user_is_teacher()
    )
  );

revoke all on public.assignments, public.assignment_submissions from anon, authenticated;
grant select, delete on public.assignments to authenticated;
grant insert (class_id, title, instructions, due_at, points_possible, status)
  on public.assignments to authenticated;
grant update (title, instructions, due_at, points_possible, status)
  on public.assignments to authenticated;

grant select on public.assignment_submissions to authenticated;
grant insert (assignment_id, student_id, response, status)
  on public.assignment_submissions to authenticated;
grant update (response, status)
  on public.assignment_submissions to authenticated;
grant update (score, feedback)
  on public.assignment_submissions to authenticated;

create or replace function public.set_assignment_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_assignment_updated_at() from public, anon, authenticated;

create trigger assignments_set_updated_at
  before update on public.assignments
  for each row execute function public.set_assignment_updated_at();

create or replace function public.set_submission_fields()
returns trigger language plpgsql
set search_path = ''
as $$
declare
  assignment_status text;
  assignment_points integer;
begin
  if tg_op = 'INSERT' then
    if new.status = 'submitted' then
      new.submitted_at := now();
    else
      new.submitted_at := null;
    end if;
    new.score := null;
    new.feedback := '';
    new.graded_by := null;
    new.graded_at := null;
  elsif auth.uid() = old.student_id then
    if old.graded_at is not null then
      raise exception 'This submission has already been graded and is locked.';
    end if;
    if new.assignment_id <> old.assignment_id or new.student_id <> old.student_id then
      raise exception 'A submission cannot be moved to another student or assignment.';
    end if;
    new.score := old.score;
    new.feedback := old.feedback;
    new.graded_by := old.graded_by;
    new.graded_at := old.graded_at;
    if new.status = 'submitted' and old.status <> 'submitted' then
      new.submitted_at := now();
    elsif new.status = 'draft' then
      new.submitted_at := null;
    else
      new.submitted_at := old.submitted_at;
    end if;
  else
    if new.assignment_id <> old.assignment_id or new.student_id <> old.student_id then
      raise exception 'A submission cannot be moved to another student or assignment.';
    end if;
    select a.status, a.points_possible
      into assignment_status, assignment_points
      from public.assignments a where a.id = old.assignment_id;
    if new.score is not null then
      if new.score < 0 or new.score > assignment_points then
        raise exception 'The score must be between zero and the assignment points available.';
      end if;
      new.graded_by := auth.uid();
      new.graded_at := coalesce(old.graded_at, now());
    else
      new.graded_by := null;
      new.graded_at := null;
    end if;
    new.response := old.response;
    new.status := old.status;
    new.submitted_at := old.submitted_at;
  end if;
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function public.set_submission_fields() from public, anon, authenticated;

create trigger assignment_submissions_set_fields
  before insert or update on public.assignment_submissions
  for each row execute function public.set_submission_fields();

create or replace function public.prevent_points_below_existing_scores()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  if new.points_possible < old.points_possible and exists (
    select 1 from public.assignment_submissions s
    where s.assignment_id = old.id and s.score > new.points_possible
  ) then
    raise exception 'Points available cannot be lower than an existing submission score.';
  end if;
  return new;
end;
$$;
revoke all on function public.prevent_points_below_existing_scores() from public, anon, authenticated;

create trigger assignments_preserve_existing_scores
  before update of points_possible on public.assignments
  for each row execute function public.prevent_points_below_existing_scores();

comment on table public.assignments is 'Teacher-managed assignments; student visibility is limited to published work in enrolled classes.';
comment on table public.assignment_submissions is 'One student submission per assignment; grading fields are writable only by the owning class teacher.';
