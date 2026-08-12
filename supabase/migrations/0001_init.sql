-- Fits cloud schema: one Postgres table per Dexie table (see src/lib/db/types.ts),
-- plus row-level security so every user only ever sees their own rows.
-- Run this once in the Supabase SQL editor (or via `supabase db push`) on a fresh project.

-- Note: id/foreign-key columns below are `text`, not `uuid`. Ids are generated client-side by
-- src/lib/id.ts (crypto.randomUUID() when available, a non-UUID fallback string otherwise, plus
-- deterministic slug ids like "ex-barbell-bench-press" for built-in seed content) — `text` accepts
-- all of those, `uuid` would reject the fallback/slug forms.

-- 1. Profiles — cloud twin of the local `settings` singleton, one row per user.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  unit_system text not null default 'lb' check (unit_system in ('kg', 'lb')),
  sex text not null default 'male' check (sex in ('male', 'female')),
  bodyweight_kg numeric not null default 80,
  default_rest_seconds integer not null default 120,
  bar_weight_kg numeric not null default 20,
  available_plates_kg numeric[] not null default '{25,20,15,10,5,2.5,1.25}',
  streak integer not null default 0,
  last_workout_date date,
  active_program_id text,
  active_program_day_index integer,
  updated_at timestamptz not null default now()
);

-- 2. Exercises — only a user's own custom exercises are ever synced here (see sync engine);
-- built-ins are re-seeded locally with stable slug ids on every device and never uploaded.
create table if not exists public.exercises (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null,
  is_custom boolean not null default true,
  standard_lift text,
  standard_lift_ratio jsonb,
  notes text,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.programs (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  author text not null default 'You',
  days_per_week integer not null default 1,
  is_custom boolean not null default true,
  days jsonb not null default '[]',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.workouts (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  program_id text,
  program_day_name text,
  title text not null,
  started_at timestamptz not null,
  completed_at timestamptz,
  notes text,
  bodyweight_kg numeric,
  exercise_order text[] not null default '{}',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.sets (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  workout_id text not null,
  exercise_id text not null,
  set_index integer not null,
  weight_kg numeric not null,
  reps integer not null,
  rpe numeric,
  is_warmup boolean not null default false,
  is_failure boolean not null default false,
  is_drop_set boolean not null default false,
  completed_at timestamptz not null,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.body_metrics (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  measurements jsonb,
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

-- Phase 2 adds this table too, included here so Phase 1's sync engine has somewhere to
-- write "no snapshot yet" is fine — table stays empty until Phase 2 code lands.
create table if not exists public.percentile_snapshots (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  date date not null,
  overall_percentile numeric,
  per_lift jsonb not null default '{}',
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index if not exists exercises_user_id_idx on public.exercises (user_id);
create index if not exists programs_user_id_idx on public.programs (user_id);
create index if not exists workouts_user_id_idx on public.workouts (user_id);
create index if not exists sets_user_id_idx on public.sets (user_id);
create index if not exists sets_workout_id_idx on public.sets (workout_id);
create index if not exists body_metrics_user_id_idx on public.body_metrics (user_id);
create index if not exists percentile_snapshots_user_id_idx on public.percentile_snapshots (user_id);

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.programs enable row level security;
alter table public.workouts enable row level security;
alter table public.sets enable row level security;
alter table public.body_metrics enable row level security;
alter table public.percentile_snapshots enable row level security;

create policy "own profile" on public.profiles for all
  using (auth.uid() = id) with check (auth.uid() = id);

create policy "own exercises" on public.exercises for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own programs" on public.programs for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own workouts" on public.workouts for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sets" on public.sets for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own body metrics" on public.body_metrics for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own percentile snapshots" on public.percentile_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- New users get a profile row automatically on signup.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
