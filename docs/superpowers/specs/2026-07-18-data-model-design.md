# Newborn Tracker — Data Model Design

**Date:** 2026-07-18
**Status:** Approved

## Purpose

Database schema and shared conventions for all tracking features: growth
(weight/height/head circumference against WHO curves), feeding (breast + formula),
sleep (with pauses), diapers, sickness (temperature + medicine doses), and notes.
Features are implemented one at a time in separate plans; this spec makes the schema
coherent across all of them up front.

## Decisions Made During Brainstorming

- **One baby, profile row:** single `babies` table row; all logs reference it.
  A second child later is just a new row.
- **Feeding:** one `feeds` table for both breast and formula, nullable type-specific
  columns. One timeline, one graph.
- **Timers synced via DB:** in-progress feeds/sleeps are rows with `ended_at IS NULL`.
  Both phones see running timers live and compute elapsed time from timestamps;
  a timer survives app kills and phone swaps.
- **Breast timer:** one feed, toggle active side; seconds accumulate per side.
- **Medicine timer:** show "time since last dose" (no alarms, no countdown config).
- **Notes:** both a `note` column on every log table and a standalone `notes` table.
- **Schema shape:** table per log type (typed columns + DB constraints), not a
  generic events table.
- **WHO curves:** vendored static data, no external API.

## Shared Conventions (every log table)

- `id uuid primary key default gen_random_uuid()`
- `baby_id uuid not null references babies(id)`
- `created_by uuid not null references auth.users(id)` — who logged it
- `note text` — nullable free text
- `created_at timestamptz not null default now()`
- RLS enabled; policy: any authenticated user has full select/insert/update/delete
  (private project, two accounts, signups disabled).
- All rows are editable and deletable after the fact; timers merely prefill rows.
- Units: metric (g, cm, ml, mg) and Celsius. Points in time are `timestamptz`;
  calendar-date-only values are `date`.

## Tables

### babies

- `name text not null`
- `sex text not null check (sex in ('male', 'female'))` — selects WHO curve set
- `birth_date date not null` — drives the age axis on growth charts

(No `baby_id`/`note` on this table; other shared conventions apply.)

### feeds

- `type text not null check (type in ('breast', 'formula'))`
- `started_at timestamptz not null`
- `ended_at timestamptz` — null while feed is running
- `left_seconds integer not null default 0` — accumulated left-breast time
- `right_seconds integer not null default 0` — accumulated right-breast time
- `volume_ml integer` — formula feeds
- `active_side text check (active_side in ('left', 'right'))` — null unless a
  breast feed is running
- `active_side_started_at timestamptz` — when the current side became active

Timer mechanics: starting a breast feed sets `started_at`, `active_side`,
`active_side_started_at`. Toggling sides banks
`now() - active_side_started_at` into the finishing side's seconds counter and
restamps `active_side`/`active_side_started_at`. Stopping banks the running side,
nulls both `active_side*` columns, and sets `ended_at`. Any client can render the
live timer purely from these columns.

Future feed types (e.g. pumped milk in a bottle) are new `type` values reusing
`volume_ml`.

### sleeps

- `started_at timestamptz not null`
- `ended_at timestamptz` — null while sleep is running

### sleep_pauses

- `sleep_id uuid not null references sleeps(id) on delete cascade`
- `started_at timestamptz not null`
- `ended_at timestamptz` — null while the pause (awake period) is ongoing

Pauses are first-class rows: awake time during a sleep is the sum of its pauses;
effective sleep = (`ended_at - started_at`) − pauses. (`baby_id` is omitted —
derivable through `sleep_id`.)

### growth_measurements

- `measured_at date not null`
- `weight_g integer`
- `height_cm numeric(4,1)`
- `head_circumference_cm numeric(4,1)`
- check: at least one of the three measurements is non-null

One row per measuring session; any subset of the three values.

### diapers

- `happened_at timestamptz not null`
- `type text not null check (type in ('pee', 'poop', 'both', 'nothing'))`

### temperatures

- `measured_at timestamptz not null`
- `celsius numeric(3,1) not null`

### medicine_doses

- `given_at timestamptz not null`
- `medicine text not null default 'paracetamol'`
- `amount numeric(6,1) not null`
- `unit text not null check (unit in ('ml', 'mg'))` — suspension vs suppository

"Time since last dose" is computed in the app from the most recent row per medicine.

### notes

- `noted_at timestamptz not null`
- `body text not null`

## WHO Growth Curve Data

Vendored as static JSON under `src/features/growth/data/`:

- Indicators: weight-for-age, length/height-for-age, head-circumference-for-age
- Sexes: boys and girls
- Percentiles: 3rd, 15th, 50th, 85th, 97th
- Age range: 0–2 years

Source: WHO Child Growth Standards published data tables (downloaded once, checked
into the repo). Charts draw logged measurements over these static percentile curves.
No external API, works offline.

## Migrations

Schema ships as SQL files in `supabase/migrations/`, applied via the Supabase SQL
editor or CLI. Each feature's plan adds its own migration; the first plan also
creates `babies` and shared setup.

## Build Order (one plan per feature)

1. Baby profile + growth tracking + WHO chart
2. Feeding
3. Sleep
4. Diapers
5. Sick (temperature + medicine doses)
6. Standalone notes

## Out of Scope

- Multi-baby UI (schema supports it; no switcher until needed)
- Offline support, push notifications, dose alarms
- Photos/attachments
