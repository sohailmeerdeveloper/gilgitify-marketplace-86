create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can update all profiles"
on public.profiles
for update
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));