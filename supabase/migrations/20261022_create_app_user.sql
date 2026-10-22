-- Chạy migration này trong Supabase SQL Editor nếu app_users đã được tạo
-- bằng phiên bản schema cũ chưa có RPC create_app_user.
create extension if not exists pgcrypto with schema extensions;

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
  values (
    trim(p_name),
    lower(trim(p_email)),
    p_role,
    p_department,
    'active',
    extensions.crypt(p_password, extensions.gen_salt('bf'))
  )
  returning app_users.id, app_users.name, app_users.email, app_users.role,
    app_users.department, app_users.status, app_users.last_active;
end;
$$;

revoke all on function public.create_app_user(text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_app_user(text, text, text, text, text)
  to service_role;

notify pgrst, 'reload schema';
