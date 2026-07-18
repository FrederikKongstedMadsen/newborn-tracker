# Newborn Tracker

Personal newborn tracker for two users. Both phones log and view the same data.

## Stack

- [Expo](https://expo.dev) (managed workflow) + TypeScript + Expo Router
- [Supabase](https://supabase.com) — Postgres, auth, realtime
- [TanStack Query](https://tanstack.com/query) as the data layer

Design docs live in `docs/superpowers/specs/`, implementation plans in `docs/superpowers/plans/`.

## Local development

```bash
npm install
cp .env.example .env   # then fill in your Supabase values
npx expo start         # scan QR with the Expo Go app, or press "a" for Android emulator
```

Checks:

```bash
npm run typecheck
npm run lint
npm run format
npm test
```

## Supabase setup (one-time, manual)

1. Create a free project at [supabase.com](https://supabase.com).
2. Copy the project URL and anon/publishable key into `.env`
   (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`).
3. Disable public signups: Authentication → Sign In / Providers → Email → turn off
   "Allow new users to sign up".
4. Create the two user accounts: Authentication → Users → Add user (email + password,
   check "Auto Confirm User").

Database schema changes go in `supabase/migrations/` as SQL files, applied via the
Supabase SQL editor or the Supabase CLI.

## Building an APK (for installing on phones)

Requires a free [Expo account](https://expo.dev/signup).

```bash
npx eas build --platform android --profile preview
```

Download the APK from the build page and install it on each phone (allow
"install from unknown sources").

**Note:** `EXPO_PUBLIC_*` env vars are baked into the JS bundle at build time —
`.env` must contain the real Supabase values before building.
