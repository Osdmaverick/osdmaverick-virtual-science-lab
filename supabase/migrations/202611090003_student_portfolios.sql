-- Phase 16: student portfolios, teacher review history and achievement certificates.
-- Apply after migrations 1–15.

create table if not exists public.student_portfolio_entries (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  category text not null default 'investigation'
    check (category in ('investigation','project','practical','reflection','other')),
  summary text not null check (char_length(trim(summary)) between 10 and 3000),
  evidence_url text not null default '' check (char_length(evidence_url) <= 1000),
  created_at timestamptz not null default now(),
  unique (id, class_id, student_id)
);

create index if not exists student_portfolio_class_idx
  on public.student_portfolio_entries(class_id, created_at desc);
create index if not exists student_portfolio_student_idx
  on public.student_portfolio_entries(student_id, created_at desc);

create table if not exists public.student_portfolio_reviews (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  class_id uuid not null,
  student_id uuid not null,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  feedback text not null check (char_length(trim(feedback)) between 1 and 2000),
  created_at timestamptz not null default now(),
  constraint student_portfolio_review_entry_fk
    foreign key (entry_id, class_id, student_id)
    references public.student_portfolio_entries(id, class_id, student_id) on delete cascade
);

create index if not exists student_portfolio_reviews_entry_idx
  on public.student_portfolio_reviews(entry_id, created_at desc);

create table if not exists public.achievement_certificates (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  issued_by uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  certificate_code text not null unique default
    ('OSDM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))),
  issued_at timestamptz not null default now(),
  unique (id, class_id, student_id)
);

create index if not exists achievement_certificates_student_idx
  on public.achievement_certificates(student_id, issued_at desc);
create index if not exists achievement_certificates_class_idx
  on public.achievement_certificates(class_id, issued_at desc);

alter table public.student_portfolio_entries enable row level security;
alter table public.student_portfolio_reviews enable row level security;
alter table public.achievement_certificates enable row level security;

drop policy if exists "Students manage their own class portfolio entries" on public.student_portfolio_entries;
create policy "Students manage their own class portfolio entries"
  on public.student_portfolio_entries for all to authenticated
  using (student_id = auth.uid() and public.is_class_student(class_id))
  with check (
    student_id = auth.uid()
    and public.is_class_student(class_id)
    and not public.current_user_is_teacher()
  );

drop policy if exists "Teachers read portfolio entries in their classes" on public.student_portfolio_entries;
create policy "Teachers read portfolio entries in their classes"
  on public.student_portfolio_entries for select to authenticated
  using (public.current_user_is_teacher() and public.is_class_teacher(class_id));

drop policy if exists "Teachers read portfolio reviews in their classes" on public.student_portfolio_reviews;
create policy "Teachers read portfolio reviews in their classes"
  on public.student_portfolio_reviews for select to authenticated
  using (public.current_user_is_teacher() and public.is_class_teacher(class_id));

drop policy if exists "Students read reviews on their own portfolio entries" on public.student_portfolio_reviews;
create policy "Students read reviews on their own portfolio entries"
  on public.student_portfolio_reviews for select to authenticated
  using (
    student_id = auth.uid()
    and exists (
      select 1 from public.student_portfolio_entries e
      where e.id = entry_id and e.class_id = student_portfolio_reviews.class_id
        and e.student_id = auth.uid()
    )
  );

drop policy if exists "Teachers write portfolio reviews in their classes" on public.student_portfolio_reviews;
create policy "Teachers write portfolio reviews in their classes"
  on public.student_portfolio_reviews for insert to authenticated
  with check (
    teacher_id = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
    and exists (
      select 1 from public.student_portfolio_entries e
      where e.id = entry_id and e.class_id = student_portfolio_reviews.class_id
        and e.student_id = student_portfolio_reviews.student_id
    )
  );

drop policy if exists "Students read their own achievement certificates" on public.achievement_certificates;
create policy "Students read their own achievement certificates"
  on public.achievement_certificates for select to authenticated
  using (student_id = auth.uid());

drop policy if exists "Teachers read certificates in their classes" on public.achievement_certificates;
create policy "Teachers read certificates in their classes"
  on public.achievement_certificates for select to authenticated
  using (public.current_user_is_teacher() and public.is_class_teacher(class_id));

drop policy if exists "Teachers issue certificates in their classes" on public.achievement_certificates;
create policy "Teachers issue certificates in their classes"
  on public.achievement_certificates for insert to authenticated
  with check (
    issued_by = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
    and public.is_class_student(class_id)
  );

revoke all on public.student_portfolio_entries, public.student_portfolio_reviews, public.achievement_certificates from anon, authenticated;
grant select on public.student_portfolio_entries to authenticated;
grant insert (class_id,student_id,title,category,summary,evidence_url)
  on public.student_portfolio_entries to authenticated;
grant delete on public.student_portfolio_entries to authenticated;
grant select on public.student_portfolio_reviews to authenticated;
grant insert (entry_id,class_id,student_id,teacher_id,feedback)
  on public.student_portfolio_reviews to authenticated;
grant select on public.achievement_certificates to authenticated;
grant insert (class_id,student_id,issued_by,title,description)
  on public.achievement_certificates to authenticated;

comment on table public.student_portfolio_entries is
  'Student-owned class-scoped evidence of science learning and projects.';
comment on table public.student_portfolio_reviews is
  'Append-only teacher feedback on student portfolio entries.';
comment on table public.achievement_certificates is
  'Teacher-issued class-scoped achievement certificates visible to the recipient.';
