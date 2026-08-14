-- Adds the unilateral (single arm/leg) flag introduced on the Exercise type — see
-- src/lib/db/types.ts and src/lib/calc/load.ts for how it changes stat calculations.
alter table public.exercises add column if not exists is_unilateral boolean;
