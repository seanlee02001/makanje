-- MakanJe Initial Schema
-- Run this in your Supabase SQL editor or via Supabase CLI

-- Extensions
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null default lower(substring(md5(random()::text || gen_random_uuid()::text), 1, 8))
);

create table if not exists users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  family_id uuid references families(id) on delete set null
);

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  name text not null,
  source_url text,
  created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists ingredients (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals(id) on delete cascade,
  name text not null,
  quantity numeric,
  unit text
);

create type day_of_week as enum ('mon','tue','wed','thu','fri','sat','sun');
create type meal_slot_type as enum ('breakfast','lunch','dinner');

create table if not exists meal_plan_slots (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  week_start_date date not null,
  day day_of_week not null,
  meal_slot meal_slot_type not null,
  meal_id uuid references meals(id) on delete set null,
  unique(family_id, week_start_date, day, meal_slot)
);

create table if not exists shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references families(id) on delete cascade,
  week_start_date date not null,
  items jsonb not null default '[]'::jsonb,
  unique(family_id, week_start_date)
);

-- ============================================================
-- RLS HELPER FUNCTION
-- ============================================================

create or replace function get_family_id()
returns uuid language sql stable security definer as $$
  select family_id from users where id = auth.uid()
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- families
alter table families enable row level security;
create policy "read own family" on families
  for select using (id = get_family_id());
create policy "insert family" on families
  for insert with check (true);
create policy "update own family" on families
  for update using (id = get_family_id());

-- users
alter table users enable row level security;
create policy "read family members" on users
  for select using (family_id = get_family_id() or id = auth.uid());
create policy "insert own user" on users
  for insert with check (id = auth.uid());
create policy "update own user" on users
  for update using (id = auth.uid());

-- meals
alter table meals enable row level security;
create policy "read family meals" on meals
  for select using (family_id = get_family_id());
create policy "insert family meals" on meals
  for insert with check (family_id = get_family_id());
create policy "update family meals" on meals
  for update using (family_id = get_family_id());
create policy "delete family meals" on meals
  for delete using (family_id = get_family_id());

-- ingredients
alter table ingredients enable row level security;
create policy "read ingredients" on ingredients
  for select using (
    meal_id in (select id from meals where family_id = get_family_id())
  );
create policy "insert ingredients" on ingredients
  for insert with check (
    meal_id in (select id from meals where family_id = get_family_id())
  );
create policy "update ingredients" on ingredients
  for update using (
    meal_id in (select id from meals where family_id = get_family_id())
  );
create policy "delete ingredients" on ingredients
  for delete using (
    meal_id in (select id from meals where family_id = get_family_id())
  );

-- meal_plan_slots
alter table meal_plan_slots enable row level security;
create policy "read slots" on meal_plan_slots
  for select using (family_id = get_family_id());
create policy "insert slots" on meal_plan_slots
  for insert with check (family_id = get_family_id());
create policy "update slots" on meal_plan_slots
  for update using (family_id = get_family_id());
create policy "delete slots" on meal_plan_slots
  for delete using (family_id = get_family_id());

-- shopping_lists
alter table shopping_lists enable row level security;
create policy "read shopping lists" on shopping_lists
  for select using (family_id = get_family_id());
create policy "insert shopping lists" on shopping_lists
  for insert with check (family_id = get_family_id());
create policy "update shopping lists" on shopping_lists
  for update using (family_id = get_family_id());
create policy "delete shopping lists" on shopping_lists
  for delete using (family_id = get_family_id());

-- ============================================================
-- REALTIME
-- Enable realtime on these tables in Supabase Dashboard:
-- Database > Replication > meal_plan_slots, shopping_lists
-- ============================================================
