-- Chạy một lần trong Supabase SQL Editor để bật tính năng quên mật khẩu.
create extension if not exists pgcrypto with schema extensions;

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

revoke all on function public.reset_app_user_password(text, text)
  from public, anon, authenticated;
grant execute on function public.reset_app_user_password(text, text)
  to service_role;

notify pgrst, 'reload schema';
