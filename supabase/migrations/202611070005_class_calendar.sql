-- Phase 13: class calendar events and assignment deadline visibility.
-- Apply after migrations 1–12.

create table if not exists public.class_events (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 4000),
  event_type text not null default 'lesson'
    check (event_type in ('lesson','practical','assessment','meeting','other')),
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_events_time_check check (ends_at is null or ends_at > starts_at)
);

create index if not exists class_events_class_start_idx
  on public.class_events(class_id, starts_at);

alter table public.class_events enable row level security;

drop policy if exists "Teachers manage events in their classes" on public.class_events;
create policy "Teachers manage events in their classes"
  on public.class_events for all to authenticated
  using (teacher_id = auth.uid() and public.is_class_teacher(class_id))
  with check (
    teacher_id = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
  );

drop policy if exists "Enrolled students read class events" on public.class_events;
create policy "Enrolled students read class events"
  on public.class_events for select to authenticated
  using (public.is_class_student(class_id));

revoke all on public.class_events from anon, authenticated;
grant select on public.class_events to authenticated;
grant insert (class_id,teacher_id,title,description,event_type,starts_at,ends_at,all_day)
  on public.class_events to authenticated;
grant update (title,description,event_type,starts_at,ends_at,all_day)
  on public.class_events to authenticated;
grant delete on public.class_events to authenticated;

create or replace function public.set_class_event_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists class_events_set_updated_at on public.class_events;
create trigger class_events_set_updated_at
before update on public.class_events
for each row execute function public.set_class_event_updated_at();

comment on table public.class_events is
  'Teacher-managed class calendar events visible only to enrolled students and the owning teacher.';
