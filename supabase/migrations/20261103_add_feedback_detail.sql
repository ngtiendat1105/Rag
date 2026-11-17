alter table public.chat_feedback
  add column if not exists detail text not null default '';
