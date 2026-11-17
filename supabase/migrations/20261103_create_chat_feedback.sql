create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  message_id text not null,
  rating text not null check (rating in ('like', 'dislike')),
  reason text not null,
  message_content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_feedback_created_at_idx on public.chat_feedback (created_at desc);
create index if not exists chat_feedback_user_id_idx on public.chat_feedback (user_id);

alter table public.chat_feedback enable row level security;
