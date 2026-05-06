-- Custom user auth that does not depend on Supabase Auth.
--
-- Why: the previous flow used supabase.auth.signUp(), which sends a
-- confirmation email through Supabase. That email's redirect host is the
-- project's "Site URL" (which defaulted to a *.lovable.app domain), and
-- whether it's sent at all depends on the dashboard "Confirm email" toggle.
-- Both of those are dashboard-only settings.
--
-- To make signup/login work purely from code (no dashboard work needed) we
-- store our own password hash on the profiles row and authenticate via two
-- security-definer RPCs. This mirrors how the admin system works
-- (data/admin.json + localStorage session). Supabase never sends an email
-- for our users — verification codes go through FormSubmit, same path as
-- admin password reset.

create extension if not exists pgcrypto with schema extensions;

-- 1) Add password_hash to profiles. Existing rows (created via auth.users
--    triggers) get NULL, which means they can't log in until they go
--    through "forgot password" — that's the safe default; the only
--    pre-existing user is the dev's own test account anyway.
alter table public.profiles add column if not exists password_hash text;

-- 2) Loosen profiles RLS to match the orders / products / categories pattern.
--    The strict auth.uid() policies stop working once we don't use
--    supabase.auth, since auth.uid() is null for anon callers.
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can create their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

drop policy if exists "profiles_select_any" on public.profiles;
drop policy if exists "profiles_insert_any" on public.profiles;
drop policy if exists "profiles_update_any" on public.profiles;

create policy "profiles_select_any" on public.profiles for select to anon, authenticated using (true);
create policy "profiles_insert_any" on public.profiles for insert to anon, authenticated with check (true);
create policy "profiles_update_any" on public.profiles for update to anon, authenticated using (true) with check (true);

-- 3) Signup: create a profile with a bcrypt password hash.
create or replace function public.app_signup(_name text, _email text, _password text)
returns uuid
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _clean_email text := lower(trim(_email));
  _user_id uuid;
begin
  if _clean_email = '' or position('@' in _clean_email) = 0 then
    raise exception 'invalid email';
  end if;
  if length(_password) < 8 then
    raise exception 'password too short';
  end if;

  -- Conflict on email is handled here so the frontend gets a clear error.
  if exists (select 1 from public.profiles where lower(email) = _clean_email) then
    raise exception 'email already registered';
  end if;

  _user_id := gen_random_uuid();

  insert into public.profiles (user_id, display_name, email, password_hash, email_verified)
  values (_user_id, coalesce(nullif(trim(_name), ''), _clean_email), _clean_email, crypt(_password, gen_salt('bf')), false);

  return _user_id;
end;
$$;

-- 4) Login: returns the profile row when password matches, empty otherwise.
--    Returning a row-set instead of a single value lets callers easily check
--    "did we get a row?" with .data?.length.
create or replace function public.app_login(_email text, _password text)
returns table(
  user_id uuid,
  display_name text,
  email text,
  phone text,
  address text,
  email_verified boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _clean_email text := lower(trim(_email));
begin
  return query
  select p.user_id, p.display_name, p.email, p.phone, p.address, p.email_verified
  from public.profiles p
  where lower(p.email) = _clean_email
    and p.password_hash is not null
    and p.password_hash = crypt(_password, p.password_hash);
end;
$$;

-- 5) Allow updating password from the "forgot" flow. Verifies the signup
--    code (re-using signup_verifications) so the same 6-digit email code
--    also covers password resets.
create or replace function public.app_set_password(_email text, _code text, _new_password text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _clean_email text := lower(trim(_email));
  _ok boolean;
begin
  if length(_new_password) < 8 then
    raise exception 'password too short';
  end if;

  _ok := public.verify_signup_code(_clean_email, _code);
  if not _ok then return false; end if;

  update public.profiles
     set password_hash = crypt(_new_password, gen_salt('bf'))
   where lower(email) = _clean_email;

  return true;
end;
$$;

revoke all on function public.app_signup(text, text, text) from public;
revoke all on function public.app_login(text, text) from public;
revoke all on function public.app_set_password(text, text, text) from public;
grant execute on function public.app_signup(text, text, text) to anon, authenticated;
grant execute on function public.app_login(text, text) to anon, authenticated;
grant execute on function public.app_set_password(text, text, text) to anon, authenticated;
