-- Phase 7: teacher-authored lessons, practicals, resources and reusable question-bank items.
-- Apply after Phase 1–6 migrations. Content is scoped to an existing teacher-owned class.

create table if not exists public.teacher_content_items (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  content_type text not null check (content_type in ('lesson','practical','resource','question')),
  title text not null check (char_length(trim(title)) between 3 and 180),
  grade_level smallint not null check (grade_level between 4 and 12),
  subject text not null check (subject in ('Physics','Chemistry','Biology','Earth & Space')),
  topic text not null check (char_length(trim(topic)) between 2 and 160),
  summary text not null default '' check (char_length(summary) <= 2000),
  content_body text not null default '' check (char_length(content_body) <= 30000),
  objectives text[] not null default '{}',
  materials text[] not null default '{}',
  procedure_steps text[] not null default '{}',
  safety_notes text not null default '' check (char_length(safety_notes) <= 5000),
  resource_url text not null default '' check (char_length(resource_url) <= 2048),
  question_options text[] not null default '{}',
  correct_option smallint,
  explanation text not null default '' check (char_length(explanation) <= 5000),
  status text not null default 'draft' check (status in ('draft','published','archived')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teacher_content_question_shape check (
    (content_type <> 'question')
    or (
      cardinality(question_options) between 2 and 6
      and correct_option is not null\n      and correct_option between 1 and cardinality(question_options)
      and char_length(trim(content_body)) between 5 and 3000
    )
  ),
  constraint teacher_content_resource_shape check (
    content_type <> 'resource' or resource_url = '' or resource_url ~* '^https?://'
  ),
  constraint teacher_content_practical_shape check (
    content_type <> 'practical' or cardinality(procedure_steps) <= 30
  )
);

create index if not exists teacher_content_class_status_idx
  on public.teacher_content_items(class_id, status, content_type, updated_at desc);
create index if not exists teacher_content_teacher_idx
  on public.teacher_content_items(teacher_id, updated_at desc);

alter table public.teacher_content_items enable row level security;

drop policy if exists "Teachers manage content in their classes" on public.teacher_content_items;
create policy "Teachers manage content in their classes"
  on public.teacher_content_items for all to authenticated
  using (teacher_id = auth.uid() and public.is_class_teacher(class_id))
  with check (
    teacher_id = auth.uid()
    and public.current_user_is_teacher()
    and public.is_class_teacher(class_id)
  );

drop policy if exists "Students read published learning content" on public.teacher_content_items;
create policy "Students read published learning content"
  on public.teacher_content_items for select to authenticated
  using (
    status = 'published'
    and content_type in ('lesson','practical','resource')
    and public.is_class_student(class_id)
  );

revoke all on public.teacher_content_items from anon, authenticated;
grant select on public.teacher_content_items to authenticated;
grant insert (
  class_id, teacher_id, content_type, title, grade_level, subject, topic,
  summary, content_body, objectives, materials, procedure_steps, safety_notes,
  resource_url, question_options, correct_option, explanation, status, published_at
) on public.teacher_content_items to authenticated;
grant update (
  content_type, title, grade_level, subject, topic, summary, content_body,
  objectives, materials, procedure_steps, safety_notes, resource_url,
  question_options, correct_option, explanation, status, published_at
) on public.teacher_content_items to authenticated;
grant delete on public.teacher_content_items to authenticated;

create or replace function public.set_teacher_content_updated_at()
returns trigger language plpgsql set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists teacher_content_items_set_updated_at on public.teacher_content_items;
create trigger teacher_content_items_set_updated_at
before update on public.teacher_content_items
for each row execute function public.set_teacher_content_updated_at();

comment on table public.teacher_content_items is
  'Teacher-authored class lessons, practical activities, resources and private reusable question-bank items.';
