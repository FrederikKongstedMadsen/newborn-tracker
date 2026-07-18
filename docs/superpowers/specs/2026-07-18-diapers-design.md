# Newborn Tracker — Diaper Tracker Design

**Date:** 2026-07-18
**Status:** Approved (user delegated approval). Handoff-ready.

## Purpose

Feature: diaper logging (build-order item 4). One-tap logging with editable history,
Home status card, Track entry — in the established design language.

## Data

Migration `0005_diapers.sql`, exactly per the data-model spec
(`docs/superpowers/specs/2026-07-18-data-model-design.md`):
`diapers` — id, baby_id FK, `happened_at timestamptz not null`,
`type text not null check (type in ('pee', 'poop', 'both', 'nothing'))`,
`note text`, created_by FK, created_at, RLS authenticated-full-access.

## Design language (MANDATORY)

Follow `docs/superpowers/specs/2026-07-18-design-restyle.md` and the live codebase:
theme tokens (`trackerColors.diaper` = green `#3a8a6f` / tint `#e2f0ea`, water icon),
primitives (`IconChip`, `PillButton`, `Card`, `SegmentedControl`, `Avatar`),
`mutedDark` for informational text / `muted` for labels only, `timeHHmm`/`relativeTime`
from `@/lib/dates`, Plus Jakarta Sans via `fontFamily` tokens. Pattern-source screens:
`src/app/sleep/index.tsx` (list rows w/ IconChip + Avatar), `src/app/sleep/[id].tsx`
(edit + dirty gating + Alert delete), `src/features/home/StatusCard.tsx`.

## Screens

- `/diaper` (stack over tabs): quick-log card at top — four PillButton-styled type
  buttons in a row/grid (Pee, Poop, Both, Nothing) that log instantly with
  `happened_at = now` (mutation pending-disable, error text). History list below
  (newest first): diaper IconChip, bold type label, `timeHHmm` + relative time,
  Avatar attribution; tap → `/diaper/[id]`.
- `/diaper/[id]`: edit — type via SegmentedControl (4 options), datetime field
  (`YYYY-MM-DDTHH:mm`, dirty-gated), note, Alert-confirmed delete.
- Home: `DiaperStatusCard` via `StatusCard` (tracker 'diaper') — value = latest type
  capitalized ("Poop"), meta = "40m ago · 4 today" (relativeTime + count of today's
  local-date entries; mirrors design home.png). None → "No diapers yet — tap to log".
- Track tab: add diaper row (trackerColors.diaper).
- Routes registered in the protected Stack block.

## Pure logic (unit-tested)

`src/features/diaper/diaperMath.ts`: `todayCount(diapers, todayIsoStr): number`
(bucket by local date of happened_at — reuse `localDateIso`). TDD.

## Out of Scope

Charts (revisit if wanted), diaper contents detail, photos.

## Definition of Done

One-tap logging works; history editable/deletable; Home card matches home.png
diaper card; avatars on rows; tests green; typecheck/lint/export clean.
