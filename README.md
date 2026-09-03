# Fits

Fits is a local-first strength training tracker. Workouts are logged and read straight from an on-device database, with Supabase sync in the background — so the app stays fast and fully usable offline, and picks up your data across devices when you're signed in.

## Features

- **Workout logging** — build programs, run guided training sessions, and log sets with a rest timer that stays accurate across backgrounding and app resume.
- **Progress tracking** — automatic PR detection, progress charts, and workout history (warmup sets are excluded from PR and percentile calculations).
- **Strength percentiles** — see how your lifts compare using the strengthlevel.com total table.
- **Body measurements** — track weight and body measurements over time.
- **Calendar view** — see training history at a glance.
- **Offline-first sync** — data lives in a local database first and syncs to Supabase when connected.
- **Native apps** — packaged for iOS and Android via Capacitor.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + React + TypeScript
- [Dexie](https://dexie.org) (IndexedDB) for the local-first data layer
- [Supabase](https://supabase.com) for auth and cloud sync
- [Tailwind CSS](https://tailwindcss.com) + [Radix UI](https://www.radix-ui.com) / [shadcn](https://ui.shadcn.com)
- [Capacitor](https://capacitorjs.com) for the iOS and Android builds
- [Zustand](https://github.com/pmndrs/zustand) for client state, [Recharts](https://recharts.org) for charts

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project (for auth and sync)

### Setup

```bash
npm install
cp .env.local.example .env.local
```

Fill in `.env.local` with your Supabase project's URL and anon key (Supabase dashboard → Project Settings → API).

Apply the database schema by running the SQL migrations in `supabase/migrations/` against your Supabase project (via the SQL editor or the Supabase CLI).

### Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Other scripts

```bash
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```

## Project structure

```
src/
  app/         # Next.js App Router routes (train, history, programs, statistics, ...)
  components/  # UI components, grouped by feature
  lib/
    db/        # local (Dexie/IndexedDB) database
    sync/      # local <-> Supabase sync logic
    calc/      # PR, percentile, and strength score calculations
    auth/      # auth helpers
    supabase/  # Supabase client setup
supabase/
  migrations/  # SQL schema migrations
android/, ios/ # Capacitor native app projects
```

## Mobile apps

The iOS and Android projects under `ios/` and `android/` are managed with Capacitor. After making web changes:

```bash
npx cap sync
```

Then build/run from Xcode or Android Studio as usual.

## Deployment

The web app deploys to [Vercel](https://vercel.com).
