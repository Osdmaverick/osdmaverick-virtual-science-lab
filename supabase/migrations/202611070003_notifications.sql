-- Phase 11: in-app notifications generated from newly published class announcements.
-- Apply after migrations 1–10. This phase does not send email, SMS or push messages.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  source_type text not null check (source_type in ('class_announcement')),
  source_id uuid not null references public.class_announcements(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 180),
  message text not null check (char_length(trim(message)) between 1 and 500),
  destination text not null default 'class-announcements.html',
  read_at timestamptz,
  created_at timestamptz not null default now(),
  unique (recipient_id, source_type, source_id)
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_id, created_at desc);
create index if not exists notifications_recipient_unread_idx
  on public.notifications(recipient_id, created_at desc)
  where read_at is null;

alter table public.notifications enable row level security;

drop policy if exists "Users read their own notifications" on public.notifications;
create policy "Users read their own notifications"
  on public.notifications for select to authenticated
  using (recipient_id = auth.uid());

drop policy if exists "Users mark their own notifications read" on public.notifications;
create policy "Users mark their own notifications read"
  on public.notifications for update to authenticated
  using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

revoke all on public.notifications from anon, authenticated;
grant select on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;

-- The trigger is the only insert path. SECURITY DEFINER lets it fan out one
-- notification per enrolled student without granting clients notification inserts.
create or replace function public.notify_students_of_announcement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if new.status <> 'published' then return new; end if;
  elsif tg_op = 'UPDATE' then
    if new.status <> 'published' or old.status = 'published' then return new; end if;
  end if;

  insert into public.notifications (
      recipient_id, class_id, source_type, source_id, title, message, destination
    )
    select
      e.student_id,
      new.class_id,
      'class_announcement',
      new.id,
      new.title,
      left(regexp_replace(new.body, '[[:space:]]+', ' ', 'g'), 500),
      'class-announcements.html'
    from public.enrollments e
    join public.profiles p on p.id = e.student_id and p.role = 'student'
    where e.class_id = new.class_id
    on conflict (recipient_id, source_type, source_id) do nothing;
  return new;
end;
$$;

revoke all on function public.notify_students_of_announcement() from public, anon, authenticated;

drop trigger if exists class_announcement_notify_students on public.class_announcements;
create trigger class_announcement_notify_students
after insert or update of status on public.class_announcements
for each row execute function public.notify_students_of_announcement();

comment on table public.notifications is
  'Private in-app notifications for authenticated users. Phase 11 currently generates student notifications when a class announcement is published.';
