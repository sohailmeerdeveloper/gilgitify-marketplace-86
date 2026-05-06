-- 6-digit signup email verification.
create extension if not exists pgcrypto with schema extensions;

-- We don't rely on Supabase's confirmation links / magic links because the
-- product requirement is: stay on this site's own domain. So we manage codes
-- in this table and the React signup flow:
--   1. signUp() succeeds (email confirmation should be DISABLED in the
--      Supabase dashboard so users can be created without confirming).
--   2. We generate a 6-digit code, store its hash + expiry, email it via
--      FormSubmit (same path used for admin password reset codes).
--   3. User enters the code on /verify-email; we mark the row consumed and
--      flip profiles.email_verified to true.

-- Add email_verified flag to profiles. Default false so brand-new accounts
-- start unverified; existing rows are bumped to true to avoid breaking sessions.
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'profiles' and column_name = 'email_verified'
  ) then
    alter table public.profiles add column email_verified boolean not null default false;
    update public.profiles set email_verified = true;
  end if;
end $$;

create table if not exists public.signup_verifications (
  email text primary key,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists signup_verifications_expires_idx on public.signup_verifications (expires_at);

alter table public.signup_verifications enable row level security;

drop policy if exists "signup_verifications_no_select" on public.signup_verifications;
drop policy if exists "signup_verifications_insert_any" on public.signup_verifications;
drop policy if exists "signup_verifications_update_any" on public.signup_verifications;

-- No direct read access. All access goes through the RPC functions below.
create policy "signup_verifications_insert_any"
  on public.signup_verifications for insert to anon, authenticated with check (false);
create policy "signup_verifications_update_any"
  on public.signup_verifications for update to anon, authenticated using (false) with check (false);

-- Helper: simple SHA-256 hex of (email||code).
create or replace function public.signup_code_hash(_email text, _code text)
returns text
language sql
immutable
set search_path = public
as $$
  select encode(digest(lower(_email) || ':' || _code, 'sha256'), 'hex')
$$;

-- Issue a 6-digit code for the email. Returns the plain code so the caller
-- (frontend) can send it through FormSubmit. Code is valid for 15 minutes.
-- If a row already exists, it's overwritten (single active code per email).
create or replace function public.issue_signup_code(_email text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _clean_email text := lower(trim(_email));
  _code text;
begin
  if _clean_email is null or _clean_email = '' or position('@' in _clean_email) = 0 then
    raise exception 'invalid email';
  end if;

  _code := lpad((floor(random() * 1000000))::int::text, 6, '0');

  insert into public.signup_verifications (email, code_hash, expires_at, attempts, consumed_at)
  values (
    _clean_email,
    public.signup_code_hash(_clean_email, _code),
    now() + interval '15 minutes',
    0,
    null
  )
  on conflict (email) do update set
    code_hash    = excluded.code_hash,
    expires_at   = excluded.expires_at,
    attempts     = 0,
    consumed_at  = null,
    created_at   = now();

  return _code;
end;
$$;

-- Verify a code. Returns true on success and marks the row consumed +
-- the matching profile as email_verified. Locks out after 6 failed attempts.
create or replace function public.verify_signup_code(_email text, _code text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  _row public.signup_verifications%rowtype;
  _clean_email text := lower(trim(_email));
begin
  select * into _row from public.signup_verifications where email = _clean_email;
  if not found then return false; end if;
  if _row.consumed_at is not null then return false; end if;
  if _row.expires_at < now() then return false; end if;
  if _row.attempts >= 6 then return false; end if;

  if _row.code_hash <> public.signup_code_hash(_clean_email, _code) then
    update public.signup_verifications
       set attempts = attempts + 1
     where email = _clean_email;
    return false;
  end if;

  update public.signup_verifications
     set consumed_at = now()
   where email = _clean_email;

  update public.profiles
     set email_verified = true
   where lower(email) = _clean_email;

  return true;
end;
$$;

revoke all on function public.issue_signup_code(text) from public;
revoke all on function public.verify_signup_code(text, text) from public;
grant execute on function public.issue_signup_code(text) to anon, authenticated;
grant execute on function public.verify_signup_code(text, text) to anon, authenticated;
