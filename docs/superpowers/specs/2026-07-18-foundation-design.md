# Newborn Tracker — Foundation Design

**Date:** 2026-07-18
**Status:** Approved

## Purpose

Personal newborn tracker for two users (Frederik + partner). This spec covers the
foundation only — project skeleton, auth, and tooling. Feature work (feeds, naps,
diapers, etc.) comes later in separate specs.

## Constraints

- Two Android phones, both users log and view the same data.
- Online-required: app talks directly to the cloud database; no offline sync.
- Free: all services on free tiers. No Apple developer account needed.
- Small personal project — keep everything as simple as possible (YAGNI).

## Stack

- **App:** Expo (managed workflow), TypeScript strict, Expo Router for file-based navigation.
- **Backend/DB:** Supabase (Postgres, auth, realtime) via `@supabase/supabase-js`.
- **Data layer:** `@tanstack/react-query` over Supabase calls — caching and refetching now, realtime integration later.
- **Session storage:** `expo-secure-store` for persisted auth tokens.

## Auth Model

- Two Supabase email/password accounts, created manually in the Supabase dashboard.
  Public signups disabled in Supabase settings.
- App has a plain login screen (email + password). Session persists across restarts.
- Data rows will carry `user_id` so entries are attributable ("who logged this").
- RLS policy model: any authenticated user can read/write. Acceptable because only
  two accounts exist and signups are disabled.

## Project Structure

```
app/                  # expo-router routes
  _layout.tsx         # root layout: providers + auth gate
  login.tsx           # login screen
  index.tsx           # home placeholder ("hello {email}")
src/
  lib/supabase.ts     # supabase client (env-driven)
  lib/queryClient.ts  # react-query client
  components/         # shared UI components
  features/           # feature modules land here later
supabase/
  migrations/         # SQL migrations, versioned in git
.env                  # EXPO_PUBLIC_SUPABASE_URL / _ANON_KEY (gitignored)
.env.example          # committed template
eas.json              # EAS build config with APK profile for sideloading
```

## Tooling

- ESLint + Prettier.
- npm scripts: `lint`, `typecheck`.
- EAS Build free tier, APK build profile (`preview`) for direct install on both phones.
- No CI, no test infra yet — added when first real logic exists.

## Manual Steps (outside the repo)

1. Create a free Supabase project.
2. Copy project URL + anon key into `.env`.
3. Disable public signups (Authentication → Providers → Email → disable signup).
4. Create two user accounts in the dashboard.

## Definition of Done

- App boots on Android.
- Login with a Supabase account works.
- Logged-in screen shows "hello {email}".
- Session survives app restart.
- `lint` and `typecheck` pass.
