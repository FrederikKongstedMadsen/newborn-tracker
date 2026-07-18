# Newborn Tracker — Feeding Tracker Design

**Date:** 2026-07-18
**Status:** Approved (user delegated approval)

## Purpose

Feature 2 per the data-model spec's build order: log breast feeds (timer, per-side
seconds) and formula feeds (volume), with a synced running timer both phones can see,
an editable history, and a simple last-7-days chart.

## Data

`feeds` table exactly as defined in `docs/superpowers/specs/2026-07-18-data-model-design.md`
(migration `0002_feeds.sql`): type breast/formula, started_at, ended_at (null = running),
left_seconds/right_seconds, volume_ml, active_side + active_side_started_at, note,
shared conventions (id, baby_id, created_by, created_at, RLS authenticated-full-access).

Timer mechanics (from data-model spec): start breast feed = insert row with
started_at/active_side/active_side_started_at set. Toggle = bank
`now - active_side_started_at` into that side's seconds, restamp active side columns.
Stop = bank running side, null both active columns, set ended_at. Any client renders
the live timer purely from these columns.

## Sync model

- Active feed query (`ended_at is null`) uses React Query `refetchInterval` (10 s)
  so the partner's phone picks up a running feed without realtime channels
  (deferred per data-model spec). Local ticking (1 s re-render while a feed is
  active) computes elapsed from the row's timestamps — no drift.
- Elapsed per side = banked seconds + (active side ? now − active_side_started_at : 0).

## Screens

### `/feeding` (stack, pushed over tabs — pattern identical to `/growth`)

- **Active feed card** (only when a breast feed is running): big total elapsed,
  per-side elapsed (active side highlighted), buttons: Left / Right (toggle),
  Stop. Formula feeds are instant logs — no running state.
- **Start controls** (no active feed): "Start breast feed (L)" / "(R)" buttons,
  and "Log formula" → `/feeding/formula`.
- **History list** (FlatList, newest first): time, type icon, summary
  ("L 12m · R 8m" or "80 ml"), tap → `/feeding/[id]`.
- **7-day chart** in the list header (below active card): bar per day, feed count
  - total minutes label. Built with react-native-svg + existing `makeScale`.

### `/feeding/formula`

Form: volume (ml, integer), time (defaults now, editable 'YYYY-MM-DD HH:mm'),
note. Saves a completed formula feed row (started_at = ended_at = chosen time).

### `/feeding/[id]`

Edit any feed: type-appropriate fields (breast: started time, left/right minutes+seconds
as editable numeric fields; formula: time, volume), note, delete with confirm.
Editing satisfies the "editable field for each breast" requirement.

## Integration

- Track tab: "Feeding" row added to `TRACKERS`.
- Home tab: `FeedingStatusCard` — running feed ("Feeding · 14m · left") or last
  feed ("80 ml formula · 2h ago" / "L 12m · R 8m · 3h ago"). Relative time in
  hours/minutes for same-day (new `relativeTime` helper in `src/lib/dates.ts`,
  tested), falling back to `relativeDays`.
- Root layout: three new protected Stack.Screen entries (`feeding/index`,
  `feeding/formula`, `feeding/[id]`).

## Pure logic (unit-tested)

`src/features/feeding/feedMath.ts`:

- `sideElapsedSeconds(feed, side, nowMs)` — banked + running share
- `totalElapsedSeconds(feed, nowMs)`
- `formatDuration(seconds)` — "14m", "1h 02m", "45s"
- `feedSummary(feed)` — list/card one-liner
- `dailyTotals(feeds, days, todayIso)` — last-N-days buckets {dateIso, count, totalSeconds}

## Out of Scope

- Realtime channels (polling suffices for 2 users).
- Pumped-milk type (schema supports later via new type value).
- Notifications/reminders.

## Definition of Done

- Start/toggle/stop breast feed works; timer survives app kill; second device
  sees running feed within one poll interval.
- Formula logging, history list, edit/delete, 7-day chart, Track + Home cards.
- New pure-logic tests pass; all checks green.
