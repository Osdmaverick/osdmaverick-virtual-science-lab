-- Phase 10: class announcements with student read receipts.
-- Apply after Phase 1–9 migrations.

create table if not exists public.class_announcements (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  body text not null check (char_length(trim(body)) between 3 and 12000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  is_pinned boolean not null default false,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint class_announcements_expiry_check check (expires_at is null or published_at is null or expires_at > published_at)
);

create index if not exists class_announcements_class_status_idx
  on public.class_announcements(class_id,status,is_pinned desc,published_at desc);
create index if not exists class_announcements_teacher_idx
  on public.class_announcements(teacher_id,updated_at desc);

create table if not exists public.class_announcement_reads (
  announcement_id uuid not null references public.class_announcements(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (announcement_id,student_id)
);

create index if not exists class_announcement_reads_class_student_idx
  on public.class_announcement_reads(class_id,student_id,read_at desc);

alter table public.class_announcements enable row level security;
alter table public.class_announcement_reads enable row level security;

drop policy if exists "Teachers manage their class announcements" on public.class_announcements;
create policy "Teachers manage their class announcements"
  on public.class_announcements for all to authenticated
  using (teacher_id = auth.uid() and public.is_class_teacher(class_id))
  with check (
    teacher_id = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
  );

drop policy if exists "Students read published class announcements" on public.class_announcements;
create policy "Students read published class announcements"
  on public.class_announcements for select to authenticated
  using (
    status = 'published'
    and (expires_at is null or expires_at > now())
    and public.is_class_student(class_id)
  );

drop policy if exists "Students manage own announcement read receipts" on public.class_announcement_reads;
create policy "Students manage own announcement read receipts"
  on public.class_announcement_reads for all to authenticated
  using (
    student_id = auth.uid()
    and public.is_class_student(class_id)
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student'
    )
    and exists (
      select 1 from public.class_announcements a
      where a.id = announcement_id and a.class_id = class_announcement_reads.class_id
        and a.status = 'published' and (a.expires_at is null or a.expires_at > now())
    )
  )
  with check (
    student_id = auth.uid()
    and public.is_class_student(class_id)
    and exists (
      select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student'
    )
    and exists (
      select 1 from public.class_announcements a
      where a.id = announcement_id and a.class_id = class_announcement_reads.class_id
        and a.status = 'published' and (a.expires_at is null or a.expires_at > now())
    )
  );

drop policy if exists "Class teachers read announcement receipts" on public.class_announcement_reads;
create policy "Class teachers read announcement receipts"
  on public.class_announcement_reads for select to authenticated
  using (public.is_class_teacher(class_id));

revoke all on public.class_announcements, public.class_announcement_reads from anon, authenticated;
grant select on public.class_announcements, public.class_announcement_reads to authenticated;
grant insert (class_id,teacher_id,title,body,status,is_pinned,published_at,expires_at)
  on public.class_announcements to authenticated;
grant update (title,body,status,is_pinned,published_at,expires_at)
  on public.class_announcements to authenticated;
grant delete on public.class_announcements to authenticated;

grant insert (announcement_id,class_id,student_id,read_at)
  on public.class_announcement_reads to authenticated;
grant update (read_at)
  on public.class_announcement_reads to authenticated;

create or replace function public.set_class_announcement_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists class_announcements_set_updated_at on public.class_announcements;
create trigger class_announcements_set_updated_at
before update on public.class_announcements
for each row execute function public.set_class_announcement_updated_at();

comment on table public.class_announcements is
  'Teacher-managed announcements for individual classes; only published, unexpired notices are visible to enrolled students.';
comment on table public.class_announcement_reads is
  'Student read receipts for published class announcements; owning class teachers can review read status.';
