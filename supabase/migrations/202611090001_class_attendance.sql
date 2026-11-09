-- Phase 14: class attendance sessions and individual learner records.
-- Apply after migrations 1–13.

create table if not exists public.attendance_sessions (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  session_date date not null,
  title text not null check (char_length(trim(title)) between 2 and 160),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  unique (id, class_id)
);

create index if not exists attendance_sessions_class_date_idx
  on public.attendance_sessions(class_id, session_date desc);

create table if not exists public.attendance_records (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.attendance_sessions(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'unmarked'
    check (status in ('present','absent','late','excused','unmarked')),
  note text not null default '' check (char_length(note) <= 500),
  marked_at timestamptz not null default now(),
  unique (session_id, student_id),
  constraint attendance_record_session_class_fk
    foreign key (session_id, class_id)
    references public.attendance_sessions(id, class_id) on delete cascade
);

create index if not exists attendance_records_student_idx
  on public.attendance_records(student_id, marked_at desc);
create index if not exists attendance_records_class_idx
  on public.attendance_records(class_id, session_id);

alter table public.attendance_sessions enable row level security;
alter table public.attendance_records enable row level security;

drop policy if exists "Teachers manage attendance sessions" on public.attendance_sessions;
create policy "Teachers manage attendance sessions"
  on public.attendance_sessions for all to authenticated
  using (teacher_id = auth.uid() and public.is_class_teacher(class_id))
  with check (
    teacher_id = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
  );

drop policy if exists "Enrolled students read attendance sessions" on public.attendance_sessions;
create policy "Enrolled students read attendance sessions"
  on public.attendance_sessions for select to authenticated
  using (public.is_class_student(class_id));

drop policy if exists "Teachers manage enrolled learner attendance" on public.attendance_records;
create policy "Teachers manage enrolled learner attendance"
  on public.attendance_records for all to authenticated
  using (
    public.is_class_teacher(class_id)
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id and s.class_id = attendance_records.class_id
        and s.teacher_id = auth.uid()
    )
  )
  with check (
    public.is_class_teacher(class_id)
    and exists (
      select 1 from public.attendance_sessions s
      where s.id = session_id and s.class_id = attendance_records.class_id
        and s.teacher_id = auth.uid()
    )
    and exists (
      select 1 from public.enrollments e
      where e.class_id = attendance_records.class_id
        and e.student_id = attendance_records.student_id
    )
  );

drop policy if exists "Students read their own attendance" on public.attendance_records;
create policy "Students read their own attendance"
  on public.attendance_records for select to authenticated
  using (
    student_id = auth.uid()
    and public.is_class_student(class_id)
  );

revoke all on public.attendance_sessions, public.attendance_records from anon, authenticated;
grant select on public.attendance_sessions to authenticated;
grant insert (class_id,teacher_id,session_date,title,notes)
  on public.attendance_sessions to authenticated;
grant update (session_date,title,notes) on public.attendance_sessions to authenticated;
grant delete on public.attendance_sessions to authenticated;

grant select on public.attendance_records to authenticated;
grant insert (session_id,class_id,student_id,status,note)
  on public.attendance_records to authenticated;
grant update (session_id,class_id,student_id,status,note,marked_at)
  on public.attendance_records to authenticated;
grant delete on public.attendance_records to authenticated;

comment on table public.attendance_sessions is
  'Teacher-created attendance registers for a dated class lesson or activity.';
comment on table public.attendance_records is
  'Per-learner attendance status; learners can read only their own records.';
