-- Phase 4: secure cloud synchronisation for student lab notebook reports.
-- Depends on the Phase 1 profiles, Phase 2 classes, and Phase 3 assignments foundation.

create table public.lab_reports (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  client_report_id text not null check (char_length(client_report_id) between 1 and 160),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  revision integer not null default 1 check (revision > 0),
  client_updated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_id, student_id, client_report_id)
);

create table public.lab_report_assessments (
  id uuid primary key default gen_random_uuid(),
  lab_report_id uuid not null unique references public.lab_reports(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  scores jsonb not null check (jsonb_typeof(scores) = 'object'),
  feedback text not null default '' check (char_length(feedback) <= 3000),
  assessed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index lab_reports_class_updated_idx on public.lab_reports(class_id, updated_at desc);
create index lab_reports_student_updated_idx on public.lab_reports(student_id, updated_at desc);

alter table public.lab_reports enable row level security;
alter table public.lab_report_assessments enable row level security;

create policy "Students read their own enrolled-class reports"
  on public.lab_reports for select to authenticated
  using (student_id = auth.uid() and public.is_class_student(class_id));

create policy "Owning teachers read class reports"
  on public.lab_reports for select to authenticated
  using (public.is_class_teacher(class_id) and public.current_user_is_teacher());

create policy "Students read assessments on their own reports"
  on public.lab_report_assessments for select to authenticated
  using (
    exists (
      select 1 from public.lab_reports r
      where r.id = lab_report_id and r.student_id = auth.uid()
    )
  );

create policy "Owning teachers read report assessments"
  on public.lab_report_assessments for select to authenticated
  using (
    teacher_id = auth.uid()
    and exists (
      select 1 from public.lab_reports r
      where r.id = lab_report_id and public.is_class_teacher(r.class_id)
    )
  );

revoke all on public.lab_reports, public.lab_report_assessments from anon, authenticated;
grant select on public.lab_reports to authenticated;
grant select on public.lab_report_assessments to authenticated;

create or replace function public.sync_lab_report(
  p_class_id uuid,
  p_client_report_id text,
  p_payload jsonb,
  p_expected_revision integer default 0,
  p_client_updated_at timestamptz default null
)
returns table(report_id uuid, revision integer, updated_at timestamptz, conflict boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_student_id uuid := auth.uid();
  v_report public.lab_reports%rowtype;
begin
  if v_student_id is null then
    raise exception 'Authentication is required.';
  end if;
  if not exists (
    select 1 from public.profiles p where p.id = v_student_id and p.role = 'student'
  ) then
    raise exception 'Only student accounts can sync notebook reports.';
  end if;
  if not public.is_class_student(p_class_id) then
    raise exception 'You are not enrolled in this class.';
  end if;
  if p_client_report_id is null or char_length(p_client_report_id) not between 1 and 160 then
    raise exception 'A valid client report identifier is required.';
  end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' or pg_column_size(p_payload) > 100000 then
    raise exception 'Report data must be a JSON object no larger than 100 KB.';
  end if;
  if not (p_payload ?& array['title','question','method','evidence','conclusion'])
     or (select count(*) from jsonb_object_keys(p_payload)) <> 5 then
    raise exception 'A report must contain title, question, method, evidence and conclusion only.';
  end if;
  if jsonb_typeof(p_payload->'title') <> 'string'
     or jsonb_typeof(p_payload->'question') <> 'string'
     or jsonb_typeof(p_payload->'method') <> 'string'
     or jsonb_typeof(p_payload->'evidence') <> 'string'
     or jsonb_typeof(p_payload->'conclusion') <> 'string'
     or char_length(p_payload->>'title') not between 1 and 160
     or char_length(p_payload->>'question') > 4000
     or char_length(p_payload->>'method') > 6000
     or char_length(p_payload->>'evidence') > 8000
     or char_length(p_payload->>'conclusion') > 4000 then
    raise exception 'Report fields must be text within their individual size limits.';
  end if;
  if p_expected_revision is null or p_expected_revision < 0 then
    raise exception 'Expected revision must be zero or greater.';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_class_id::text || ':' || v_student_id::text || ':' || p_client_report_id, 0));

  select * into v_report
  from public.lab_reports r
  where r.class_id = p_class_id
    and r.student_id = v_student_id
    and r.client_report_id = p_client_report_id
  for update;

  if found then
    if p_expected_revision <> v_report.revision then
      return query select v_report.id, v_report.revision, v_report.updated_at, true;
      return;
    end if;
    update public.lab_reports r
      set payload = p_payload,
          revision = r.revision + 1,
          client_updated_at = p_client_updated_at,
          updated_at = now()
      where r.id = v_report.id
      returning r.id, r.revision, r.updated_at
      into report_id, revision, updated_at;
    conflict := false;
    return next;
    return;
  end if;

  if p_expected_revision <> 0 then
    return query select null::uuid, 0, null::timestamptz, true;
    return;
  end if;

  insert into public.lab_reports(class_id, student_id, client_report_id, payload, client_updated_at)
    values (p_class_id, v_student_id, p_client_report_id, p_payload, p_client_updated_at)
    returning id, lab_reports.revision, lab_reports.updated_at
    into report_id, revision, updated_at;
  conflict := false;
  return next;
end;
$$;

revoke all on function public.sync_lab_report(uuid, text, jsonb, integer, timestamptz) from public, anon;
grant execute on function public.sync_lab_report(uuid, text, jsonb, integer, timestamptz) to authenticated;

create or replace function public.save_lab_report_assessment(
  p_lab_report_id uuid,
  p_scores jsonb,
  p_feedback text default ''
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_teacher_id uuid := auth.uid();
  v_class_id uuid;
  v_assessment_id uuid;
  v_key text;
  v_value jsonb;
begin
  if v_teacher_id is null or not public.current_user_is_teacher() then
    raise exception 'Only verified teachers can assess lab reports.';
  end if;
  if p_feedback is null or char_length(p_feedback) > 3000 then
    raise exception 'Feedback must be 3000 characters or fewer.';
  end if;
  if p_scores is null or jsonb_typeof(p_scores) <> 'object'
     or not (p_scores ?& array['question','method','evidence','conclusion'])
     or (select count(*) from jsonb_object_keys(p_scores)) <> 4 then
    raise exception 'Scores must contain question, method, evidence and conclusion only.';
  end if;
  for v_key, v_value in select key, value from jsonb_each(p_scores) loop
    if jsonb_typeof(v_value) <> 'number'
       or (v_value::text)::numeric < 0
       or (v_value::text)::numeric > 4
       or trunc((v_value::text)::numeric) <> (v_value::text)::numeric then
      raise exception 'Each rubric score must be a whole number from zero to four.';
    end if;
  end loop;

  select r.class_id into v_class_id
  from public.lab_reports r where r.id = p_lab_report_id;
  if v_class_id is null or not public.is_class_teacher(v_class_id) then
    raise exception 'You are not authorised to assess this report.';
  end if;

  insert into public.lab_report_assessments(lab_report_id, teacher_id, scores, feedback)
    values (p_lab_report_id, v_teacher_id, p_scores, p_feedback)
  on conflict (lab_report_id) do update
    set teacher_id = excluded.teacher_id,
        scores = excluded.scores,
        feedback = excluded.feedback,
        assessed_at = now(),
        updated_at = now()
  returning id into v_assessment_id;

  return v_assessment_id;
end;
$$;

revoke all on function public.save_lab_report_assessment(uuid, jsonb, text) from public, anon;
grant execute on function public.save_lab_report_assessment(uuid, jsonb, text) to authenticated;

comment on table public.lab_reports is 'Versioned cloud backups of student lab notebook reports, scoped to enrolled classes.';
comment on table public.lab_report_assessments is 'Rubric scores and teacher feedback for cloud-synced lab reports.';
comment on function public.sync_lab_report(uuid, text, jsonb, integer, timestamptz) is
  'Idempotent student-owned report sync with optimistic revision checks; returns conflict instead of overwriting newer cloud work.';
comment on function public.save_lab_report_assessment(uuid, jsonb, text) is
  'Creates or updates a four-part rubric assessment only for a report in the caller teacher''s own class.';
