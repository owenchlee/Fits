-- Server-side validation: Supabase is reachable with the public anon key, so the app is not
-- the only writer. Caps text size and bounds numbers. NaN fails every `<=` bound.
-- Apply by hand in the Supabase SQL editor. NOT VALID: existing rows are never scanned,
-- deleted or rejected; only new inserts and updates are checked.
alter table public.workouts
  add constraint workouts_valid check (
    length(title) <= 200 and length(notes) <= 20000 and length(program_day_name) <= 200
    and bodyweight_kg <= 1000 and bodyweight_kg >= 0
    and (completed_at is null or completed_at >= started_at)
  ) not valid;
alter table public.exercises
  add constraint exercises_valid check (
    length(trim(name)) between 1 and 200 and length(notes) <= 10000
    and primary_muscle in ('chest','back','shoulders','biceps','triceps','quads','hamstrings','glutes','calves','core','forearms','traps','full-body')
    and (standard_lift is null or standard_lift in ('squat','bench','deadlift','overhead-press'))
    and equipment in ('barbell','dumbbell','machine','cable','bodyweight','kettlebell','bands','other')
  ) not valid;
alter table public.programs
  add constraint programs_valid check (
    length(name) <= 200 and length(description) <= 10000
    and jsonb_typeof(days) = 'array' and days_per_week between 0 and 14
  ) not valid;
alter table public.sets
  add constraint sets_valid check (
    set_index between 0 and 10000 and reps between 0 and 10000 and weight_kg >= 0 and weight_kg <= 5000
    and (rpe is null or (rpe >= 0 and rpe <= 10))
  ) not valid;
alter table public.body_metrics
  add constraint body_metrics_valid check (
    (weight_kg is null or (weight_kg >= 0 and weight_kg <= 1000))
    and (measurements is null or jsonb_typeof(measurements) = 'object')
    and (body_fat_pct is null or (body_fat_pct >= 0 and body_fat_pct <= 100))
  ) not valid;
alter table public.percentile_snapshots
  add constraint percentile_snapshots_valid check (
    (overall_percentile is null or (overall_percentile >= 0 and overall_percentile <= 100))
    and jsonb_typeof(per_lift) = 'object'
  ) not valid;
alter table public.profiles
  add constraint profiles_valid check (
    (active_program_day_index is null or active_program_day_index between 0 and 1000)
    and bodyweight_kg > 0 and bodyweight_kg <= 1000 and bar_weight_kg between 0 and 100
    and default_rest_seconds between 0 and 7200 and streak between 0 and 100000
  ) not valid;
