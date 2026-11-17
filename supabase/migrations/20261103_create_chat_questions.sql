create table if not exists public.chat_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  question text not null,
  normalized_question text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_questions_created_at_idx on public.chat_questions (created_at desc);
create index if not exists chat_questions_normalized_question_idx on public.chat_questions (normalized_question);

alter table public.chat_questions enable row level security;

create or replace function public.get_popular_questions(limit_count integer default 5)
returns table(question text, count bigint)
language sql
security definer
set search_path = public
as $$
  with grouped as (
    select
      (array_agg(question order by created_at desc))[1] as question,
      count(*) as count,
      max(created_at) as last_seen
    from public.chat_questions
    group by normalized_question
  )
  select grouped.question, grouped.count
  from grouped
  order by grouped.count desc, grouped.last_seen desc
  limit greatest(1, least(limit_count, 10));
$$;
