-- Shared orders table so admin dashboard sees every order from any device.
create table if not exists public.orders (
  id text primary key,
  user_id text,
  user_name text not null,
  email text,
  phone text not null,
  address text not null,
  muhallah text,
  payment_method text not null check (payment_method in ('cod','easypaisa')),
  status text not null default 'pending' check (status in ('pending','preparing','out_for_delivery','delivered','cancelled')),
  items jsonb not null,
  subtotal numeric not null,
  delivery_fee numeric not null,
  total numeric not null,
  location jsonb,
  created_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_phone_idx on public.orders (phone);
create index if not exists orders_email_idx on public.orders (lower(email));
create index if not exists orders_user_id_idx on public.orders (user_id);

alter table public.orders enable row level security;

drop policy if exists "orders_insert_any" on public.orders;
drop policy if exists "orders_select_any" on public.orders;
drop policy if exists "orders_update_any" on public.orders;

create policy "orders_insert_any"
  on public.orders for insert
  to anon, authenticated
  with check (true);

create policy "orders_select_any"
  on public.orders for select
  to anon, authenticated
  using (true);

create policy "orders_update_any"
  on public.orders for update
  to anon, authenticated
  using (true)
  with check (true);

alter publication supabase_realtime add table public.orders;
