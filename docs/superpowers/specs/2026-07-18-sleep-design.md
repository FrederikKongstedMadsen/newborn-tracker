# Newborn Tracker — Sleep Tracker Design

**Date:** 2026-07-18
**Status:** Approved (user delegated approval)

## Purpose

Feature 3 per the data-model build order: sleep timer with pause/resume (pauses
tracked as first-class rows), editable history, synced across phones like feeding.

## Data

`sleeps` + `sleep_pauses` tables exactly per the data-model spec (migration
`0003_sleeps.sql`):

- `sleeps`: started_at, ended_at (null = running), note, shared conventions.
- `sleep_pauses`: sleep_id FK (on delete cascade), started_at, ended_at
  (null = currently paused). No baby_id/note (derivable/unneeded per spec).

States, derived: running (sleep.ended_at null, no open pause), paused (open pause
exists), ended. Effective sleep = (end|now − started_at) − Σ pause durations
(open pause counts up to now).

## Sync model

Same as feeding: `useActiveSleep` polls 10 s (`ended_at is null`, with its pauses);
1 s local tick while active. All state DB-derived — survives app kill, both phones
see it.

## Screens (mirror feeding patterns)

### `/sleep`

- **Active sleep card**: big effective-sleep elapsed; "Paused Xm" state line when
  paused (awake-time counting up); buttons: Pause/Resume (toggles by state) + Stop.
- **Start control** (no active sleep): "Start sleep" button.
- **History list**: newest first; row = start datetime, duration summary
  ("2h 15m · 2 pauses" — effective sleep, pause count), tap → `/sleep/[id]`.
- **7-day chart** in header: bars = effective sleep hours per day (bucketed by
  local date of started_at), count label = number of sleeps.

### `/sleep/[id]`

Edit: started/ended datetimes (`YYYY-MM-DDTHH:mm`, dirty-field gating like feeding
edit), note, delete (confirm). Pauses shown as read-only rows (start–end, duration)
with per-pause delete (confirm); running sleep → note + delete only (same guard
as feeding).

## Shared-code move

`formatDuration` moves from `src/features/feeding/feedMath.ts` to `src/lib/duration.ts`
(both features need it); feeding imports updated. Tests move with it.

## Integration

- Track tab row: Sleep (moon icon) → `/sleep`.
- Home: `SleepStatusCard` under FeedingStatusCard — running ("Sleeping · 1h 20m" /
  "Paused · 12m awake"), idle (last sleep: "2h 15m · 3h ago"), none ("No sleeps yet").
- Root layout: two protected entries (`sleep/index`, `sleep/[id]`).

## Pure logic (unit-tested, `src/features/sleep/sleepMath.ts`)

- `pauseSeconds(pauses, nowMs)` — total awake seconds (open pause → now)
- `effectiveSleepSeconds(sleep, pauses, nowMs)`
- `sleepState(sleep, pauses)` — 'running' | 'paused' | 'ended'
- `sleepSummary(sleep, pauses)` — "2h 15m · 2 pauses" (banked/ended values)
- `dailySleepTotals(sleepsWithPauses, days, todayIso)` — reuse local-date bucketing
  approach from feedMath

## Out of Scope

- Editing pause times (delete-only); night/day sleep classification; targets/stats.

## Definition of Done

- Start/pause/resume/stop; pauses recorded as rows; timer survives kill; partner
  phone sees state within poll.
- History, edit/delete (incl. pause delete), 7-day chart, Home/Track integration.
- Pure-logic tests; all checks green.
