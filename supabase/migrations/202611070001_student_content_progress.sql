-- Phase 8: student engagement and completion tracking for published learning content.
-- Apply after Phase 1–7 migrations.

create table if not exists public.student_content_progress (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  content_item_id uuid not null references public.teacher_content_items(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (student_id, content_item_id),
  constraint student_content_progress_completion_shape check (
    (status = 'completed' and completed_at is not null)
    or (status = 'in_progress' and completed_at is null)
  )
);

create index if not exists student_content_progress_class_student_idx
  on public.student_content_progress(class_id, student_id, status);
create index if not exists student_content_progress_content_idx
  on public.student_content_progress(content_item_id, status);

alter table public.student_content_progress enable row level security;

drop policy if exists "Students manage own published content progress" on public.student_content_progress;
create policy "Students manage own published content progress"
  on public.student_content_progress for all to authenticated
  using (
    student_id = auth.uid()
    and public.is_class_student(class_id)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
    and exists (
      select 1 from public.teacher_content_items c
      where c.id = content_item_id
        and c.class_id = student_content_progress.class_id
        and c.status = 'published'
        and c.content_type in ('lesson','practical','resource')
    )
  )
  with check (
    student_id = auth.uid()
    and public.is_class_student(class_id)
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'student'
    )
    and exists (
      select 1 from public.teacher_content_items c
      where c.id = content_item_id
        and c.class_id = student_content_progress.class_id
        and c.status = 'published'
        and c.content_type in ('lesson','practical','resource')
    )
  );

drop policy if exists "Class teachers read learner content progress" on public.student_content_progress;
create policy "Class teachers read learner content progress"
  on public.student_content_progress for select to authenticated
  using (public.is_class_teacher(class_id));

revoke all on public.student_content_progress from anon, authenticated;
grant select on public.student_content_progress to authenticated;
grant insert (class_id, content_item_id, student_id, status, completed_at)
  on public.student_content_progress to authenticated;
grant update (status, completed_at)
  on public.student_content_progress to authenticated;

create or replace function public.set_student_content_progress_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists student_content_progress_set_updated_at on public.student_content_progress;
create trigger student_content_progress_set_updated_at
before update on public.student_content_progress
for each row execute function public.set_student_content_progress_updated_at();

comment on table public.student_content_progress is
  'Student-owned progress for published lessons, practicals and resources; teachers can read progress for their own classes.';
