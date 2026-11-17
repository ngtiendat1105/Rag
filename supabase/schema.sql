create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique check (email = lower(email)),
  role text not null default 'user' check (role in ('admin', 'moderator', 'user')),
  department text not null default 'Chưa phân loại',
  phone text,
  avatar_url text,
  status text not null default 'active' check (status in ('active', 'inactive', 'pending')),
  password_hash text not null,
  last_active timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

create or replace function public.authenticate_app_user(p_email text, p_password text)
returns table (id uuid, name text, email text, role text, department text, status text, last_active timestamptz)
language sql
security definer
set search_path = public
as $$
  select u.id, u.name, u.email, u.role, u.department, u.status, u.last_active
  from public.app_users u
  where u.email = lower(trim(p_email))
    and u.status = 'active'
    and u.password_hash = extensions.crypt(p_password, u.password_hash)
  limit 1;
$$;

revoke all on function public.authenticate_app_user(text, text) from public, anon, authenticated;
grant execute on function public.authenticate_app_user(text, text) to service_role;

create or replace function public.create_app_user(
  p_name text,
  p_email text,
  p_role text,
  p_department text,
  p_password text
)
returns table (id uuid, name text, email text, role text, department text, status text, last_active timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if length(p_password) < 8 then
    raise exception 'Mật khẩu phải có ít nhất 8 ký tự';
  end if;
  return query
  insert into public.app_users (name, email, role, department, status, password_hash)
  values (trim(p_name), lower(trim(p_email)), p_role, p_department, 'active', extensions.crypt(p_password, extensions.gen_salt('bf')))
  returning app_users.id, app_users.name, app_users.email, app_users.role, app_users.department, app_users.status, app_users.last_active;
end;
$$;

revoke all on function public.create_app_user(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_app_user(text, text, text, text, text) to service_role;

create or replace function public.reset_app_user_password(p_email text, p_password text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_rows integer;
begin
  if length(p_password) < 8 then
    raise exception 'Mật khẩu phải có ít nhất 8 ký tự';
  end if;

  update public.app_users
  set password_hash = extensions.crypt(p_password, extensions.gen_salt('bf')),
      updated_at = now()
  where email = lower(trim(p_email))
    and status = 'active';

  get diagnostics affected_rows = row_count;
  return affected_rows = 1;
end;
$$;

revoke all on function public.reset_app_user_password(text, text) from public, anon, authenticated;
grant execute on function public.reset_app_user_password(text, text) to service_role;

create table if not exists public.chat_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  message_id text not null,
  rating text not null check (rating in ('like', 'dislike')),
  reason text not null,
  detail text not null default '',
  message_content text not null,
  created_at timestamptz not null default now()
);

create index if not exists chat_feedback_created_at_idx on public.chat_feedback (created_at desc);
create index if not exists chat_feedback_user_id_idx on public.chat_feedback (user_id);
alter table public.chat_feedback enable row level security;

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

-- Yêu cầu PostgREST cập nhật danh sách RPC ngay sau khi tạo hàm.
notify pgrst, 'reload schema';

-- Sau khi chạy schema, tạo admin đầu tiên trong SQL Editor bằng lệnh dưới đây.
-- Hãy thay YOUR_EMAIL và YOUR_STRONG_PASSWORD; không commit mật khẩu thật vào Git.
-- select * from public.create_app_user('Quản trị viên', 'YOUR_EMAIL', 'admin', 'IT Department', 'YOUR_STRONG_PASSWORD');
