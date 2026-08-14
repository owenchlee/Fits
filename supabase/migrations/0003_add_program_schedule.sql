-- Adds cycle-based scheduling to programs (see Program.schedule/cycleStartDate in
-- src/lib/db/types.ts): a rotation like [Push, Pull, Legs, Rest] that repeats every
-- `schedule` length days from `cycle_start_date`, independent of weekday. Also fixes a
-- pre-existing gap where `schedule` was never synced to the cloud at all.
alter table public.programs add column if not exists schedule jsonb;
alter table public.programs add column if not exists cycle_start_date date;
