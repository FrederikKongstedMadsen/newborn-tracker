# Newborn Tracker — Design Restyle

**Date:** 2026-07-18
**Status:** Approved (user provided design; delegated approval)

## Purpose

Adopt the user's app design (source: `docs/design/*.png`, exported from the
"Newborn Tracker App Design" Claude Design project) across all existing screens,
and add who-logged attribution. Future features build in this style.

## Design language (tokens extracted from the design export)

- **Font:** Plus Jakarta Sans (Google font) everywhere.
- **Palette:** background `#f0eee6`; card `#ffffff`; text `#221f1b`; muted
  `#9b958c`; muted-dark `#6b665e`; border `#e9e4db`; primary indigo `#5a60c6`
  (pressed/dark `#4a4fb0`); danger `#cf6257`.
- **Tracker accents** (icon + tinted chip background):
  sleep `#5a60c6`/`#ece9fb` (moon), feeding `#c07a45`/`#fbeadf`,
  diaper `#3a8a6f`/`#e2f0ea` (water drop), growth `#3f76c2`/`#dbe6f6`
  (trending-up), temperature `#cf6257`/`#fbe6e3` (thermometer),
  notes `#8a857c`/`#f4f1ec` (document).
- **Shapes:** cards radius ~20 with soft shadow, no hard border; buttons are
  full-width pills; small icon chips are rounded squares (radius ~12).
- **Type scale:** big timer digits (~44, bold), screen titles ~28 bold,
  card values ~20 semibold, labels/uppercase-eyebrows ~12 muted.

## Screens (per design screenshots)

- **Home** (`home.png`): greeting header — smiley icon chip, time-of-day
  greeting ("Good morning/afternoon/evening"), baby name large, "N days old";
  top-right circular button → Profile tab. Below: 2-column grid of tracker
  status cards, each with icon chip, tracker name (muted), latest value (bold),
  relative-time meta. Cards shown: Sleep, Feeding, Growth (Diaper/Temperature/
  Notes join as those features are built).
- **Sleep** (`01-sleep2.png`, `02-sleep2.png`): hero card — uppercase state
  eyebrow (READY / ASLEEP / PAUSED), huge clock digits (mm:ss, h:mm:ss ≥ 1h),
  indigo "Start sleep" pill (moon icon); running state swaps to Pause/Resume +
  Stop controls. "RECENT SLEEPS" list: icon chip, "2h 12m asleep · 8m paused",
  time range "08:55–11:15", right side relative time + logger avatar.
  Expanded/detail rows show segments: dot + "Sleep 08:55–09:55 1h 00m",
  "Pause 09:55–10:03 8m" (this segment breakdown lives on the edit screen).
- **Feeding** (`feed2.png`): segmented control Breast | Formula. Breast: hero
  card with total digits, "Tap a side to start" hint, two side boxes LEFT/RIGHT
  each with their own mm:ss (tap side = start/switch; active side highlighted).
  Formula segment: the volume/time form inline. Below: "Feeds per day" card —
  7-day chart with per-day count row (existing chart restyled into card).
- **Growth/Profile/edit screens/login:** restyled with the same tokens
  (login finally migrates off hardcoded colors — clears deferred backlog item).

## Attribution (profiles)

- Migration `0004_profiles.sql`: `profiles` table — `id uuid pk references
  auth.users`, `display_name text not null`, `color text not null` (hex for the
  avatar), RLS authenticated full access. User fills the two rows manually.
- Also in 0004: partial unique index `one_open_feed_per_baby on feeds (baby_id)
  where ended_at is null` (clears deferred feeding backlog item).
- `Avatar` component: circle in `profile.color` with `display_name` initial.
  Shown on history rows (sleep/feeding) per design. Missing profile row →
  fallback neutral avatar with "?".

## Navigation

Unchanged: 3 tabs (Home/Track/Profile) + pushed tracker stacks. Home grid cards
navigate directly to trackers (as today).

## Out of Scope

- Dark mode; animations; Diaper/Temperature/Notes cards (arrive with features);
  redesigning data flows (hooks/math untouched).

## Definition of Done

- Font loaded (splash gate); all screens use new tokens; no hardcoded old-theme
  hex left in screens/components (chart-internal domain colors may stay local
  but must match the new palette).
- Home greeting + grid; sleep and feeding heroes per screenshots; segmented
  feeding control; attribution avatars on sleep/feeding history rows.
- Existing flows unchanged functionally; 49 tests green; typecheck/lint/export.
