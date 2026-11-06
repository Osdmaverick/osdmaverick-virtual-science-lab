-- Phase 9: teacher-authored class quizzes with server-side marking.
-- Apply after Phase 1–8 migrations. Correct answers live in a teacher-only table.

create table if not exists public.class_quizzes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 3 and 180),
  description text not null default '' check (char_length(description) <= 2000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  due_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.class_quiz_questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.class_quizzes(id) on delete cascade,
  source_question_id uuid references public.teacher_content_items(id) on delete set null,
  position smallint not null check (position between 1 and 100),
  prompt text not null check (char_length(trim(prompt)) between 5 and 3000),
  options text[] not null check (cardinality(options) between 2 and 6),
  created_at timestamptz not null default now(),
  unique (quiz_id, position)
);

create table if not exists public.class_quiz_answer_keys (
  question_id uuid primary key references public.class_quiz_questions(id) on delete cascade,
  correct_option smallint not null check (correct_option between 1 and 6),
  explanation text not null default '' check (char_length(explanation) <= 5000),
  created_at timestamptz not null default now()
);

create table if not exists public.class_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.class_quizzes(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null check (jsonb_typeof(answers) = 'object'),
  score smallint not null check (score >= 0),
  total smallint not null check (total > 0 and score <= total),
  submitted_at timestamptz not null default now()
);

create index if not exists class_quizzes_class_status_idx
  on public.class_quizzes(class_id,status,published_at desc);
create index if not exists class_quiz_questions_quiz_idx
  on public.class_quiz_questions(quiz_id,position);
create index if not exists class_quiz_attempts_class_idx
  on public.class_quiz_attempts(class_id,submitted_at desc);
create index if not exists class_quiz_attempts_student_idx
  on public.class_quiz_attempts(student_id,submitted_at desc);

alter table public.class_quizzes enable row level security;
alter table public.class_quiz_questions enable row level security;
alter table public.class_quiz_answer_keys enable row level security;
alter table public.class_quiz_attempts enable row level security;

drop policy if exists "Teachers manage class quizzes" on public.class_quizzes;
create policy "Teachers manage class quizzes" on public.class_quizzes
  for all to authenticated
  using (teacher_id=auth.uid() and public.is_class_teacher(class_id))
  with check (teacher_id=auth.uid() and public.current_user_is_teacher() and public.is_class_teacher(class_id));

drop policy if exists "Students read published class quizzes" on public.class_quizzes;
create policy "Students read published class quizzes" on public.class_quizzes
  for select to authenticated
  using (status='published' and public.is_class_student(class_id));

drop policy if exists "Teachers manage quiz questions" on public.class_quiz_questions;
create policy "Teachers manage quiz questions" on public.class_quiz_questions
  for all to authenticated
  using (exists(select 1 from public.class_quizzes q where q.id=quiz_id and q.teacher_id=auth.uid() and public.is_class_teacher(q.class_id)))
  with check (exists(select 1 from public.class_quizzes q where q.id=quiz_id and q.teacher_id=auth.uid() and public.is_class_teacher(q.class_id)));

drop policy if exists "Students read published quiz questions" on public.class_quiz_questions;
create policy "Students read published quiz questions" on public.class_quiz_questions
  for select to authenticated
  using (exists(select 1 from public.class_quizzes q where q.id=quiz_id and q.status='published' and public.is_class_student(q.class_id)));

drop policy if exists "Teachers manage quiz answer keys" on public.class_quiz_answer_keys;
create policy "Teachers manage quiz answer keys" on public.class_quiz_answer_keys
  for all to authenticated
  using (exists(
    select 1 from public.class_quiz_questions q
    join public.class_quizzes z on z.id=q.quiz_id
    where q.id=question_id and z.teacher_id=auth.uid() and public.is_class_teacher(z.class_id)
  ))
  with check (exists(
    select 1 from public.class_quiz_questions q
    join public.class_quizzes z on z.id=q.quiz_id
    where q.id=question_id and z.teacher_id=auth.uid() and public.is_class_teacher(z.class_id)
  ));

drop policy if exists "Students and teachers read class quiz attempts" on public.class_quiz_attempts;
create policy "Students and teachers read class quiz attempts" on public.class_quiz_attempts
  for select to authenticated
  using (student_id=auth.uid() or public.is_class_teacher(class_id));

revoke all on public.class_quizzes,public.class_quiz_questions,public.class_quiz_answer_keys,public.class_quiz_attempts from anon,authenticated;
grant select on public.class_quizzes,public.class_quiz_questions,public.class_quiz_attempts to authenticated;
grant insert (class_id,teacher_id,title,description,status,published_at,due_at) on public.class_quizzes to authenticated;
grant update (title,description,status,published_at,due_at) on public.class_quizzes to authenticated;
grant delete on public.class_quizzes to authenticated;
grant insert (quiz_id,source_question_id,position,prompt,options) on public.class_quiz_questions to authenticated;
grant update (position,prompt,options) on public.class_quiz_questions to authenticated;
grant delete on public.class_quiz_questions to authenticated;
grant select,insert,update,delete on public.class_quiz_answer_keys to authenticated;
grant select on public.class_quiz_attempts to authenticated;

create or replace function public.set_class_quiz_updated_at()
returns trigger language plpgsql set search_path=public
as $$
begin new.updated_at=now(); return new; end;
$$;
drop trigger if exists class_quizzes_set_updated_at on public.class_quizzes;
create trigger class_quizzes_set_updated_at before update on public.class_quizzes
for each row execute function public.set_class_quiz_updated_at();

create or replace function public.validate_class_quiz_publish()
returns trigger language plpgsql set search_path=public
as $
declare
  v_questions integer;
  v_valid_keys integer;
begin
  if new.status='published' then
    select count(*) into v_questions
      from public.class_quiz_questions q where q.quiz_id=new.id;
    select count(*) into v_valid_keys
      from public.class_quiz_questions q
      join public.class_quiz_answer_keys k on k.question_id=q.id
      where q.quiz_id=new.id
        and k.correct_option between 1 and cardinality(q.options);
    if v_questions=0 or v_valid_keys<>v_questions then
      raise exception 'A quiz needs at least one question and a valid answer key for every question before publishing.';
    end if;
  end if;
  return new;
end;
$;

drop trigger if exists class_quizzes_validate_publish on public.class_quizzes;
create trigger class_quizzes_validate_publish
before insert or update of status on public.class_quizzes
for each row execute function public.validate_class_quiz_publish();

create or replace function public.submit_class_quiz(p_quiz_id uuid,p_answers jsonb)
returns table(attempt_id uuid,score integer,total integer,percentage integer)
language plpgsql security definer set search_path=public
as $$
declare
  v_student uuid := auth.uid();
  v_class uuid;
  v_total integer;
  v_score integer := 0;
  v_question record;
  v_choice integer;
  v_attempt uuid;
  v_answer_text text;
begin
  if v_student is null then raise exception 'Sign in before submitting a quiz.'; end if;
  if jsonb_typeof(p_answers) <> 'object' then raise exception 'Quiz answers must be an object.'; end if;
  if not exists(select 1 from public.profiles p where p.id=v_student and p.role='student') then
    raise exception 'Only student accounts can submit class quizzes.';
  end if;
  select q.class_id into v_class from public.class_quizzes q
    where q.id=p_quiz_id and q.status='published';
  if v_class is null then raise exception 'This quiz is not available.'; end if;
  if not public.is_class_student(v_class) then raise exception 'You are not enrolled in this class.'; end if;
  select count(*) into v_total from public.class_quiz_questions q where q.quiz_id=p_quiz_id;
  if v_total=0 or jsonb_object_length(p_answers) <> v_total then
    raise exception 'Answer every question before submitting.';
  end if;
  for v_question in
    select q.id,q.options,k.correct_option
    from public.class_quiz_questions q
    join public.class_quiz_answer_keys k on k.question_id=q.id
    where q.quiz_id=p_quiz_id
  loop
    v_answer_text := p_answers ->> v_question.id::text;
    if v_answer_text is null or v_answer_text !~ '^[1-6]$' then
      raise exception 'One or more answers are invalid.';
    end if;
    v_choice := v_answer_text::integer;
    if v_choice > cardinality(v_question.options) then raise exception 'One or more answers are invalid.'; end if;
    if v_choice=v_question.correct_option then v_score:=v_score+1; end if;
  end loop;
  insert into public.class_quiz_attempts(quiz_id,class_id,student_id,answers,score,total)
  values(p_quiz_id,v_class,v_student,p_answers,v_score,v_total)
  returning id into v_attempt;
  return query select v_attempt,v_score,v_total,round(100.0*v_score/v_total)::integer;
end;
$$;

revoke all on function public.submit_class_quiz(uuid,jsonb) from public,anon;
grant execute on function public.submit_class_quiz(uuid,jsonb) to authenticated;

comment on table public.class_quiz_answer_keys is 'Teacher-only answer keys; students are marked by submit_class_quiz and cannot read correct options.';
comment on table public.class_quiz_attempts is 'Server-marked student class quiz attempts; answers and score are visible only to the student and class teacher.';
