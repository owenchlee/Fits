-- Supabase advisor fixes (auth_rls_initplan + RLS performance guide):
-- 1. Wrap auth.uid() in a scalar subquery so Postgres evaluates it once per query, not per row.
-- 2. Restrict policies to the authenticated role instead of every role (public).
-- 3. Partial indexes on deleted_at so the daily purge_deleted_rows job does not seq-scan.
-- Policy names and the rows each user can see or write are unchanged. Safe to re-run.

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists "own exercises" on public.exercises;
create policy "own exercises" on public.exercises for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own programs" on public.programs;
create policy "own programs" on public.programs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own workouts" on public.workouts;
create policy "own workouts" on public.workouts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own sets" on public.sets;
create policy "own sets" on public.sets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own body metrics" on public.body_metrics;
create policy "own body metrics" on public.body_metrics for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists "own percentile snapshots" on public.percentile_snapshots;
create policy "own percentile snapshots" on public.percentile_snapshots for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create index if not exists sets_deleted_at_idx on public.sets (deleted_at) where deleted_at is not null;
create index if not exists workouts_deleted_at_idx on public.workouts (deleted_at) where deleted_at is not null;
create index if not exists exercises_deleted_at_idx on public.exercises (deleted_at) where deleted_at is not null;
create index if not exists programs_deleted_at_idx on public.programs (deleted_at) where deleted_at is not null;
create index if not exists body_metrics_deleted_at_idx on public.body_metrics (deleted_at) where deleted_at is not null;
create index if not exists percentile_snapshots_deleted_at_idx on public.percentile_snapshots (deleted_at) where deleted_at is not null;
