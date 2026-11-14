-- OSDMaverick Virtual Science Lab — class management foundation
-- Depends on 202611140001_profiles.sql.
-- Enrolments can only be created through join_class() after validating a student and invite code.

create extension if not exists pgcrypto with schema extensions;

create table public.classes (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 2 and 100),
  description text not null default '' check (char_length(description) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.class_invite_codes (
  class_id uuid primary key references public.classes(id) on delete cascade,
  join_code text not null unique check (join_code ~ '^[A-F0-9]{10}$'),
  created_at timestamptz not null default now()
);

create table public.enrollments (
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (class_id, student_id)
);

create index classes_teacher_id_idx on public.classes(teacher_id);
create index enrollments_student_id_idx on public.enrollments(student_id);

alter table public.classes enable row level security;
alter table public.class_invite_codes enable row level security;
alter table public.enrollments enable row level security;

create or replace function public.current_user_is_teacher()
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'teacher'
  );
$$;

create or replace function public.is_class_teacher(target_class_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.classes c
    where c.id = target_class_id and c.teacher_id = auth.uid()
  );
$$;

create or replace function public.is_class_student(target_class_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.enrollments e
    where e.class_id = target_class_id and e.student_id = auth.uid()
  );
$$;

create or replace function public.can_teacher_view_profile(target_profile_id uuid)
returns boolean language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    join public.classes c on c.id = e.class_id
    where e.student_id = target_profile_id and c.teacher_id = auth.uid()
  );
$$;

revoke all on function public.current_user_is_teacher() from public, anon;
revoke all on function public.is_class_teacher(uuid) from public, anon;
revoke all on function public.is_class_student(uuid) from public, anon;
revoke all on function public.can_teacher_view_profile(uuid) from public, anon;
grant execute on function public.current_user_is_teacher() to authenticated;
grant execute on function public.is_class_teacher(uuid) to authenticated;
grant execute on function public.is_class_student(uuid) to authenticated;
grant execute on function public.can_teacher_view_profile(uuid) to authenticated;

drop policy "Users can read their own profile" on public.profiles;
create policy "Users can read own profile or enrolled students"
  on public.profiles for select to authenticated
  using (auth.uid() = id or public.can_teacher_view_profile(id));

create policy "Teachers can read their classes and enrolled students"
  on public.classes for select to authenticated
  using (teacher_id = auth.uid() or public.is_class_student(id));
create policy "Verified teachers can create their own classes"
  on public.classes for insert to authenticated
  with check (teacher_id = auth.uid() and public.current_user_is_teacher());
create policy "Verified teachers can update their own classes"
  on public.classes for update to authenticated
  using (teacher_id = auth.uid() and public.current_user_is_teacher())
  with check (teacher_id = auth.uid() and public.current_user_is_teacher());
create policy "Verified teachers can delete their own classes"
  on public.classes for delete to authenticated
  using (teacher_id = auth.uid() and public.current_user_is_teacher());

create policy "Class owners can read their invite codes"
  on public.class_invite_codes for select to authenticated
  using (public.is_class_teacher(class_id));

create policy "Class teachers and enrolled students can read roster"
  on public.enrollments for select to authenticated
  using (student_id = auth.uid() or public.is_class_teacher(class_id));

revoke all on public.classes, public.class_invite_codes, public.enrollments from anon, authenticated;
grant select on public.classes to authenticated;
grant insert (teacher_id, name, description) on public.classes to authenticated;
grant update (name, description) on public.classes to authenticated;
grant delete on public.classes to authenticated;
grant select on public.class_invite_codes to authenticated;
grant select on public.enrollments to authenticated;

create or replace function public.set_class_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
revoke all on function public.set_class_updated_at() from public, anon, authenticated;
create trigger classes_set_updated_at before update on public.classes
for each row execute function public.set_class_updated_at();

create or replace function public.create_class_invite_code()
returns trigger language plpgsql security definer
set search_path = ''
as $$
declare
  generated_code text;
begin
  loop
    generated_code := pg_catalog.upper(pg_catalog.substr(pg_catalog.encode(extensions.gen_random_bytes(8), 'hex'), 1, 10));
    exit when not exists (
      select 1 from public.class_invite_codes where join_code = generated_code
    );
  end loop;
  insert into public.class_invite_codes(class_id, join_code)
  values (new.id, generated_code);
  return new;
end;
$$;
revoke all on function public.create_class_invite_code() from public, anon, authenticated;
create trigger classes_create_invite_code after insert on public.classes
for each row execute function public.create_class_invite_code();

create or replace function public.join_class(p_join_code text)
returns table(class_id uuid, class_name text, joined_at timestamptz)
language plpgsql security definer
set search_path = ''
as $$
declare
  matched_class_id uuid;
begin
  if auth.uid() is null then
    raise exception 'You must sign in before joining a class.';
  end if;
  if not exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'student'
  ) then
    raise exception 'Only student accounts can join a class with a code.';
  end if;
  if p_join_code is null or length(trim(p_join_code)) < 6 or length(trim(p_join_code)) > 20 then
    raise exception 'Enter a valid class code.';
  end if;

  select cic.class_id into matched_class_id
  from public.class_invite_codes cic
  where cic.join_code = pg_catalog.upper(pg_catalog.trim(p_join_code));

  if matched_class_id is null then
    raise exception 'That class code was not recognised.';
  end if;

  insert into public.enrollments(class_id, student_id)
  values (matched_class_id, auth.uid())
  on conflict (class_id, student_id) do nothing;

  return query
    select c.id, c.name, e.joined_at
    from public.classes c
    join public.enrollments e on e.class_id = c.id
    where c.id = matched_class_id and e.student_id = auth.uid();
end;
$$;
revoke all on function public.join_class(text) from public, anon;
grant execute on function public.join_class(text) to authenticated;

comment on table public.classes is 'Teacher-owned virtual science lab classes.';
comment on table public.class_invite_codes is 'Private invite codes, readable only by the owning teacher.';
comment on table public.enrollments is 'Student membership in teacher-owned classes.';
