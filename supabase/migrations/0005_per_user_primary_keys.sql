-- Ids are chosen on the device and some are predictable (a percentile snapshot's
-- id is its date). A global primary key on id let one lifter's row block another
-- lifter's upsert (ON CONFLICT hit a row RLS hides). Key each synced table per
-- lifter instead. Idempotent: drop-if-exists then re-add.
do $$
declare t text;
begin
  foreach t in array array['exercises','programs','workouts','sets','body_metrics','percentile_snapshots'] loop
    execute format('alter table public.%I drop constraint if exists %I', t, t || '_pkey');
    execute format('alter table public.%I add primary key (user_id, id)', t);
  end loop;
end $$;
