-- Deleting something in Fits soft-deletes the row (sets deleted_at) so other signed-in devices
-- pick the deletion up on their next sync. Those tombstones still hold the user's data, though,
-- and the Privacy Policy promises deleted items are purged from our servers within 30 days.
-- This hard-deletes tombstones older than 30 days, daily, via pg_cron.
--
-- Apply in the Supabase SQL editor (or `supabase db push`). pg_cron must be enabled for the
-- project: Dashboard > Database > Extensions > pg_cron (the create extension below does this
-- where permitted).

create extension if not exists pg_cron with schema pg_catalog;

create or replace function public.purge_deleted_rows()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.sets where deleted_at < now() - interval '30 days';
  delete from public.workouts where deleted_at < now() - interval '30 days';
  delete from public.exercises where deleted_at < now() - interval '30 days';
  delete from public.programs where deleted_at < now() - interval '30 days';
  delete from public.body_metrics where deleted_at < now() - interval '30 days';
  delete from public.percentile_snapshots where deleted_at < now() - interval '30 days';
$$;

-- Only the scheduler (running as the database owner) should be able to call this.
revoke all on function public.purge_deleted_rows() from public, anon, authenticated;

-- Re-running this migration replaces the existing job rather than adding a duplicate.
select cron.unschedule(jobid) from cron.job where jobname = 'purge-deleted-rows';
select cron.schedule('purge-deleted-rows', '17 4 * * *', 'select public.purge_deleted_rows()');
