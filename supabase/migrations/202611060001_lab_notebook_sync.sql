-- OSDMaverick Virtual Science Lab — Phase 4 cloud notebook and assessment sync
-- Apply after migrations 202611050001_profiles.sql, 202611050002_classes.sql,
-- and 202611050003_assignments.sql.

create table if not exists public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  report_id text not null check (char_length(report_id) between 1 and 160),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  report_created_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_id, report_id)
);

create table if not exists public.lab_report_assessments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null unique references public.lab_reports(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  scores jsonb not null default '{}'::jsonb check (jsonb_typeof(scores) = 'object'),
  feedback text not null default '' check (char_length(feedback) <= 3000),
  assessed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lab_reports_class_updated_idx
  on public.lab_reports(class_id, updated_at desc);
create index if not exists lab_reports_student_updated_idx
  on public.lab_reports(student_id, updated_at desc);

alter table public.lab_reports enable row level security;
alter table public.lab_report_assessments enable row level security;

drop policy if exists "Students manage own class reports" on public.lab_reports;
create policy "Students manage own class reports"
  on public.lab_reports for all to authenticated
  using (student_id = auth.uid() and public.is_class_student(class_id))
  with check (
    student_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'student')
    and public.is_class_student(class_id)
  );

drop policy if exists "Class teachers read student reports" on public.lab_reports;
create policy "Class teachers read student reports"
  on public.lab_reports for select to authenticated
  using (public.is_class_teacher(class_id));

drop policy if exists "Class teachers manage report assessments" on public.lab_report_assessments;
create policy "Class teachers manage report assessments"
  on public.lab_report_assessments for all to authenticated
  using (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.lab_reports r
      where r.id = report_id and public.is_class_teacher(r.class_id)
    )
  )
  with check (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.lab_reports r
      where r.id = report_id and public.is_class_teacher(r.class_id)
    )
  );

drop policy if exists "Students read own report assessments" on public.lab_report_assessments;
create policy "Students read own report assessments"
  on public.lab_report_assessments for select to authenticated
  using (
    exists (select 1 from public.lab_reports r where r.id = report_id and r.student_id = auth.uid())
  );

revoke all on public.lab_reports, public.lab_report_assessments from anon, authenticated;
grant select, insert, update, delete on public.lab_reports to authenticated;
grant select on public.lab_report_assessments to authenticated;
grant insert (report_id, teacher_id, scores, feedback, assessed_at)
  on public.lab_report_assessments to authenticated;
grant update (scores, feedback, assessed_at)
  on public.lab_report_assessments to authenticated;

create or replace function public.set_lab_record_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists lab_reports_set_updated_at on public.lab_reports;
create trigger lab_reports_set_updated_at before update on public.lab_reports
for each row execute function public.set_lab_record_updated_at();

drop trigger if exists lab_report_assessments_set_updated_at on public.lab_report_assessments;
create trigger lab_report_assessments_set_updated_at before update on public.lab_report_assessments
for each row execute function public.set_lab_record_updated_at();

comment on table public.lab_reports is 'Cloud-synced student lab notebook reports scoped to an enrolled class.';
comment on table public.lab_report_assessments is 'Teacher rubric scores and feedback for cloud-synced student lab reports.';
