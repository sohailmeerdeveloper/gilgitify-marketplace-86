alter table public.profiles
add column if not exists email text;

create index if not exists profiles_email_idx on public.profiles (lower(email));

create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, display_name, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', new.email, ''), new.email)
  on conflict (user_id) do update set email = excluded.email;

  insert into public.user_roles (user_id, role)
  values (new.id, 'user')
  on conflict (user_id, role) do nothing;

  return new;
end;
$$;

revoke execute on function public.create_profile_for_new_user() from public, anon, authenticated;