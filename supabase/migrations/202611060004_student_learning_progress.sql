-- Phase 8: student learning activity and completion tracking.
-- Apply after Phase 1–7 migrations.
alter table public.teacher_content_items
  add constraint teacher_content_items_id_class_unique unique (id, class_id);

create table if not exists public.student_content_progress (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint student_content_progress_content_class_fk
    foreign key (content_item_id, class_id)
    references public.teacher_content_items(id, class_id) on delete cascade,
  constraint student_content_progress_student_item_unique
    unique (student_id, content_item_id),
  constraint student_content_progress_completion_shape check (
    (status = 'in_progress' and completed_at is null)
    or (status = 'completed' and completed_at is not null)
  )
);

create index if not exists student_content_progress_class_idx
  on public.student_content_progress(class_id, student_id, status, updated_at desc);
create index if not exists student_content_progress_student_idx
  on public.student_content_progress(student_id, updated_at desc);

alter table public.student_content_progress enable row level security;

drop policy if exists "Students manage own published content progress" on public.student_content_progress;
create policy "Students manage own published content progress"
  on public.student_content_progress for all to authenticated
  using (
    student_id = auth.uid()
    and public.is_class_student(class_id)
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
      select 1 from public.teacher_content_items c
      where c.id = content_item_id
        and c.class_id = student_content_progress.class_id
        and c.status = 'published'
        and c.content_type in ('lesson','practical','resource')
    )
  );

drop policy if exists "Teachers read progress in their classes" on public.student_content_progress;
create policy "Teachers read progress in their classes"
  on public.student_content_progress for select to authenticated
  using (public.is_class_teacher(class_id));

revoke all on public.student_content_progress from anon, authenticated;
grant select on public.student_content_progress to authenticated;
grant insert (content_item_id, class_id, student_id, status, started_at, completed_at)
  on public.student_content_progress to authenticated;
grant update (status, started_at, completed_at)
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
  'Student progress for published class lessons, practical activities and resources.';
