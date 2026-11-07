-- Phase 12: notify learners when assignment or lab-report assessment is published.
-- Apply after migrations 1–11. No external email, SMS or push delivery is used.

alter table public.notifications
  drop constraint if exists notifications_source_type_check;
alter table public.notifications
  add constraint notifications_source_type_check
  check (source_type in ('class_announcement', 'assignment_graded', 'lab_report_assessed'));

create or replace function public.notify_student_of_assignment_grade()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  assignment_row public.assignments%rowtype;
  notification_message text;
begin
  if new.graded_at is null then return new; end if;
  if tg_op = 'UPDATE'
     and old.graded_at is not distinct from new.graded_at
     and old.score is not distinct from new.score
     and old.teacher_feedback is not distinct from new.teacher_feedback then
    return new;
  end if;

  select * into assignment_row from public.assignments where id = new.assignment_id;
  if not found then return new; end if;

  notification_message := 'Your submission received '
    || coalesce(new.score::text, 'a grade')
    || ' out of ' || assignment_row.points_possible::text || ' points.';
  if char_length(trim(new.teacher_feedback)) > 0 then
    notification_message := notification_message || ' Feedback: ' || new.teacher_feedback;
  end if;

  insert into public.notifications (
    recipient_id, class_id, source_type, source_id, title, message, destination
  ) values (
    new.student_id, assignment_row.class_id, 'assignment_graded', new.id,
    'Assignment graded: ' || assignment_row.title,
    left(notification_message, 500), 'assignments.html'
  )
  on conflict (recipient_id, source_type, source_id) do update
    set title = excluded.title,
        message = excluded.message,
        destination = excluded.destination,
        read_at = null,
        created_at = now();

  return new;
end;
$$;

revoke all on function public.notify_student_of_assignment_grade() from public, anon, authenticated;
drop trigger if exists assignment_grade_notify_student on public.assignment_submissions;
create trigger assignment_grade_notify_student
after update of score, teacher_feedback, graded_at on public.assignment_submissions
for each row execute function public.notify_student_of_assignment_grade();

create or replace function public.notify_student_of_lab_assessment()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  report_row public.lab_reports%rowtype;
  notification_message text;
begin
  select * into report_row from public.lab_reports where id = new.report_id;
  if not found then return new; end if;

  notification_message := 'Your lab report has been assessed.';
  if char_length(trim(new.feedback)) > 0 then
    notification_message := notification_message || ' Feedback: ' || new.feedback;
  end if;

  insert into public.notifications (
    recipient_id, class_id, source_type, source_id, title, message, destination
  ) values (
    report_row.student_id, report_row.class_id, 'lab_report_assessed', new.id,
    'Lab report assessment available',
    left(notification_message, 500), 'student-lab-notebook.html'
  )
  on conflict (recipient_id, source_type, source_id) do update
    set title = excluded.title,
        message = excluded.message,
        destination = excluded.destination,
        read_at = null,
        created_at = now();

  return new;
end;
$$;

revoke all on function public.notify_student_of_lab_assessment() from public, anon, authenticated;
drop trigger if exists lab_assessment_notify_student on public.lab_report_assessments;
create trigger lab_assessment_notify_student
after insert or update of scores, feedback, assessed_at on public.lab_report_assessments
for each row execute function public.notify_student_of_lab_assessment();

comment on table public.notifications is
  'Private in-app notifications for class announcements, graded assignments and assessed lab reports.';
