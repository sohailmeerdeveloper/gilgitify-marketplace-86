-- Single shared admin credential record so password/email changes sync across all devices.

create extension if not exists pgcrypto;

create table if not exists public.admin_settings (
  id int primary key default 1,
  email text not null,
  password_hash text not null,
  reset_code_hash text,
  reset_expires timestamptz,
  updated_at timestamptz not null default now(),
  constraint admin_settings_single_row check (id = 1)
);

insert into public.admin_settings (id, email, password_hash)
values (1, 'zahidali151272@gmail.com', encode(digest('Zahid.313', 'sha256'), 'hex'))
on conflict (id) do nothing;

alter table public.admin_settings enable row level security;
-- No policies = no direct table access. Everything goes through RPC.

create or replace function public.get_admin_email()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from public.admin_settings where id = 1;
$$;
grant execute on function public.get_admin_email() to anon, authenticated;

create or replace function public.verify_admin(input_email text, input_password text)
returns boolean
language sql
security definer
set search_path = public, extensions
stable
as $$
  select exists(
    select 1 from public.admin_settings
    where id = 1
      and lower(email) = lower(input_email)
      and password_hash = encode(digest(input_password, 'sha256'), 'hex')
  );
$$;
grant execute on function public.verify_admin(text, text) to anon, authenticated;

create or replace function public.update_admin_email(input_current_password text, input_new_email text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare ok boolean;
begin
  select password_hash = encode(digest(input_current_password, 'sha256'), 'hex')
    into ok from public.admin_settings where id = 1;
  if not coalesce(ok, false) then return false; end if;
  update public.admin_settings set email = input_new_email, updated_at = now() where id = 1;
  return true;
end$$;
grant execute on function public.update_admin_email(text, text) to anon, authenticated;

create or replace function public.update_admin_password(input_current_password text, input_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare ok boolean;
begin
  select password_hash = encode(digest(input_current_password, 'sha256'), 'hex')
    into ok from public.admin_settings where id = 1;
  if not coalesce(ok, false) then return false; end if;
  update public.admin_settings
    set password_hash = encode(digest(input_new_password, 'sha256'), 'hex'),
        updated_at = now()
    where id = 1;
  return true;
end$$;
grant execute on function public.update_admin_password(text, text) to anon, authenticated;

create or replace function public.request_admin_reset()
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare code text;
begin
  code := lpad((floor(random()*1000000))::text, 6, '0');
  update public.admin_settings
    set reset_code_hash = encode(digest(code, 'sha256'), 'hex'),
        reset_expires = now() + interval '15 minutes'
    where id = 1;
  return code;
end$$;
grant execute on function public.request_admin_reset() to anon, authenticated;

create or replace function public.consume_admin_reset(input_code text, input_new_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare ok boolean;
begin
  select reset_code_hash = encode(digest(input_code, 'sha256'), 'hex')
         and reset_expires is not null and reset_expires > now()
    into ok from public.admin_settings where id = 1;
  if not coalesce(ok, false) then return false; end if;
  update public.admin_settings
    set password_hash = encode(digest(input_new_password, 'sha256'), 'hex'),
        reset_code_hash = null, reset_expires = null,
        updated_at = now()
    where id = 1;
  return true;
end$$;
grant execute on function public.consume_admin_reset(text, text) to anon, authenticated;
