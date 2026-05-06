-- Categories, Products, Ads tables for marketplace.
-- Mirrors the existing orders.sql pattern: open RLS because admin auth
-- is a separate localStorage-gated system (see src/lib/adminAuth.ts), not
-- Supabase Auth. UI-level access control restricts writes to admin pages.

-- ============================================================
-- CATEGORIES
-- ============================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  description text not null default '',
  image text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists categories_sort_idx on public.categories (sort_order asc);

drop trigger if exists update_categories_updated_at on public.categories;
create trigger update_categories_updated_at
before update on public.categories
for each row execute function public.update_updated_at_column();

alter table public.categories enable row level security;

drop policy if exists "categories_select_any" on public.categories;
drop policy if exists "categories_insert_any" on public.categories;
drop policy if exists "categories_update_any" on public.categories;
drop policy if exists "categories_delete_any" on public.categories;

create policy "categories_select_any" on public.categories for select to anon, authenticated using (true);
create policy "categories_insert_any" on public.categories for insert to anon, authenticated with check (true);
create policy "categories_update_any" on public.categories for update to anon, authenticated using (true) with check (true);
create policy "categories_delete_any" on public.categories for delete to anon, authenticated using (true);

-- Seed the required categories. Idempotent on slug.
insert into public.categories (slug, label, description, image, sort_order) values
  ('general',     'General Store', 'Daily essentials and household items', 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=600&q=80', 10),
  ('meat',        'Meat Shop',     'Fresh halal meat, chicken & fish',     'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=600&q=80', 20),
  ('vegetable',   'Vegetable Shop','Farm-fresh vegetables & fruits',       'https://images.unsplash.com/photo-1542838132-92c53300491e?w=600&q=80', 30),
  ('grocery',     'Grocery',       'Rice, oils, spices and more',          'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&q=80', 40),
  ('cosmetics',   'Cosmetics',     'Skincare, makeup & beauty',            'https://images.unsplash.com/photo-1522335789203-aaa2f6d4cdb1?w=600&q=80', 50),
  ('garments',    'Garments',      'Clothing, fabrics & apparel',          'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80', 60),
  ('dry_fruits',  'Dry Fruits',    'Almonds, walnuts, apricots & more',    'https://images.unsplash.com/photo-1604908554007-9354dca5d234?w=600&q=80', 70),
  ('stationery',  'Stationary',    'Books, pens & school supplies',        'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80', 80),
  ('electronics', 'Electronics',   'Phones, accessories & gadgets',        'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&q=80', 90),
  ('fast_food',   'Fast Food',     'Burgers, pizza, broast & more',        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', 100)
on conflict (slug) do nothing;

-- ============================================================
-- PRODUCTS
-- ============================================================
create table if not exists public.products (
  id text primary key,
  name text not null,
  name_urdu text,
  price numeric not null default 0,
  category text not null default 'general',
  image text not null default '',
  description text not null default '',
  unit text not null default '',
  stock integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_idx on public.products (category);
create index if not exists products_created_at_idx on public.products (created_at desc);
create index if not exists products_name_idx on public.products (lower(name));

drop trigger if exists update_products_updated_at on public.products;
create trigger update_products_updated_at
before update on public.products
for each row execute function public.update_updated_at_column();

alter table public.products enable row level security;

drop policy if exists "products_select_any" on public.products;
drop policy if exists "products_insert_any" on public.products;
drop policy if exists "products_update_any" on public.products;
drop policy if exists "products_delete_any" on public.products;

create policy "products_select_any" on public.products for select to anon, authenticated using (true);
create policy "products_insert_any" on public.products for insert to anon, authenticated with check (true);
create policy "products_update_any" on public.products for update to anon, authenticated using (true) with check (true);
create policy "products_delete_any" on public.products for delete to anon, authenticated using (true);

-- ============================================================
-- ADS
-- ============================================================
-- placement values:
--   'home_banner'    - top homepage rotating banner
--   'home_sidebar'   - homepage sidebar slot
--   'category_page'  - shown on category/shop page (uses category column)
--   'sidebar'        - generic sidebar
create table if not exists public.ads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image text not null default '',
  link text,
  placement text not null default 'home_banner'
    check (placement in ('home_banner','home_sidebar','category_page','sidebar')),
  category text,                                -- only used when placement='category_page'
  vendor_label text,                            -- free-text; admin runs ads on behalf of vendor/user
  is_active boolean not null default true,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ads_active_idx on public.ads (is_active);
create index if not exists ads_placement_idx on public.ads (placement);
create index if not exists ads_expires_idx on public.ads (expires_at);

drop trigger if exists update_ads_updated_at on public.ads;
create trigger update_ads_updated_at
before update on public.ads
for each row execute function public.update_updated_at_column();

alter table public.ads enable row level security;

drop policy if exists "ads_select_any" on public.ads;
drop policy if exists "ads_insert_any" on public.ads;
drop policy if exists "ads_update_any" on public.ads;
drop policy if exists "ads_delete_any" on public.ads;

create policy "ads_select_any" on public.ads for select to anon, authenticated using (true);
create policy "ads_insert_any" on public.ads for insert to anon, authenticated with check (true);
create policy "ads_update_any" on public.ads for update to anon, authenticated using (true) with check (true);
create policy "ads_delete_any" on public.ads for delete to anon, authenticated using (true);
