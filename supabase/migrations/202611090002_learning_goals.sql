-- Phase 15: student-owned learning goals and teacher review history.
-- Apply after migrations 1–14.

create table if not exists public.learning_goals (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 1500),
  target_date date,
  status text not null default 'not_started'
    check (status in ('not_started','in_progress','achieved','paused')),
  progress_percent integer not null default 0
    check (progress_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, class_id, student_id)
);

create index if not exists learning_goals_class_idx
  on public.learning_goals(class_id, created_at desc);
create index if not exists learning_goals_student_idx
  on public.learning_goals(student_id, updated_at desc);

create table if not exists public.learning_goal_reviews (
  id uuid primary key default gen_random_uuid(),
  goal_id uuid not null,
  class_id uuid not null,
  student_id uuid not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  feedback text not null check (char_length(trim(feedback)) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint learning_goal_review_goal_fk
    foreign key (goal_id, class_id, student_id)
    references public.learning_goals(id, class_id, student_id) on delete cascade
);

create index if not exists learning_goal_reviews_goal_idx
  on public.learning_goal_reviews(goal_id, created_at desc);

alter table public.learning_goals enable row level security;
alter table public.learning_goal_reviews enable row level security;

drop policy if exists "Students manage their own class learning goals" on public.learning_goals;
create policy "Students manage their own class learning goals"
  on public.learning_goals for all to authenticated
  using (student_id = auth.uid() and public.is_class_student(class_id))
  with check (
    student_id = auth.uid()
    and public.is_class_student(class_id)
    and not public.current_user_is_teacher()
  );

drop policy if exists "Teachers read goals in their classes" on public.learning_goals;
create policy "Teachers read goals in their classes"
  on public.learning_goals for select to authenticated
  using (public.current_user_is_teacher() and public.is_class_teacher(class_id));

drop policy if exists "Teachers read reviews in their classes" on public.learning_goal_reviews;
create policy "Teachers read reviews in their classes"
  on public.learning_goal_reviews for select to authenticated
  using (public.current_user_is_teacher() and public.is_class_teacher(class_id));

drop policy if exists "Students read reviews on their own goals" on public.learning_goal_reviews;
create policy "Students read reviews on their own goals"
  on public.learning_goal_reviews for select to authenticated
  using (
    student_id = auth.uid()
    and exists (
      select 1 from public.learning_goals g
      where g.id = goal_id and g.class_id = learning_goal_reviews.class_id
        and g.student_id = auth.uid()
    )
  );

drop policy if exists "Teachers write reviews for goals in their classes" on public.learning_goal_reviews;
create policy "Teachers write reviews for goals in their classes"
  on public.learning_goal_reviews for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
    and exists (
      select 1 from public.learning_goals g
      where g.id = goal_id and g.class_id = learning_goal_reviews.class_id
        and g.student_id = learning_goal_reviews.student_id
    )
  );

revoke all on public.learning_goals, public.learning_goal_reviews from anon, authenticated;
grant select on public.learning_goals to authenticated;
grant insert (class_id,student_id,title,description,target_date,status,progress_percent)
  on public.learning_goals to authenticated;
grant update (title,description,target_date,status,progress_percent)
  on public.learning_goals to authenticated;
grant delete on public.learning_goals to authenticated;

grant select on public.learning_goal_reviews to authenticated;
grant insert (goal_id,class_id,student_id,teacher_id,feedback)
  on public.learning_goal_reviews to authenticated;

create or replace function public.set_learning_goal_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists learning_goals_set_updated_at on public.learning_goals;
create trigger learning_goals_set_updated_at
  before update on public.learning_goals
  for each row execute function public.set_learning_goal_updated_at();

comment on table public.learning_goals is
  'Student-owned measurable learning goals scoped to an enrolled class.';
comment on table public.learning_goal_reviews is
  'Append-only teacher feedback on student learning goals.';
