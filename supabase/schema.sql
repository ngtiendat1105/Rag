create extension if not exists pgcrypto with schema extensions;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique check (email = lower(email)),
  role text not null default 'user' check (role in ('admin', 'moderator', 'user')),
  department text not null default 'Chưa phân loại',
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

-- Sau khi chạy schema, tạo admin đầu tiên trong SQL Editor bằng lệnh dưới đây.
-- Hãy thay YOUR_EMAIL và YOUR_STRONG_PASSWORD; không commit mật khẩu thật vào Git.
-- select * from public.create_app_user('Quản trị viên', 'YOUR_EMAIL', 'admin', 'IT Department', 'YOUR_STRONG_PASSWORD');

