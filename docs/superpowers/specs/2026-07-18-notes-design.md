# Newborn Tracker — Notes Design

**Date:** 2026-07-18
**Status:** Approved (user delegated approval). Handoff-ready.

## Purpose

Feature: standalone notes (build-order item 6, last of the original feature list) —
freestanding observations ("first smile!") with timestamp. Per-log notes already
exist as columns on every tracker table; this is the independent notes feed.

## Data

Migration `0007_notes.sql`, exactly per the data-model spec:
`notes` — `noted_at timestamptz not null`, `body text not null`, shared conventions
(id, baby_id FK, created_by FK, created_at) + RLS authenticated-full-access.
(No separate `note` column — `body` IS the content.)

## Design language (MANDATORY)

Same regime as diapers/sick specs: tokens (`trackerColors.notes` = gray `#8a857c` /
tint `#f4f1ec`, document icon), primitives, mutedDark rule, dates helpers, pattern
sources (diaper screens once built, else sleep screens; `StatusCard`).

## Screens

- `/notes` (stack over tabs): composer Card at top — multiline FormField
  (placeholder "Write a note…", `multiline`, ~3 visible lines), datetime defaults
  now (editable field, collapsed/simple), PillButton "Save note" (disabled when
  body empty/whitespace, pending-disable, error text, success clears). History
  list: notes IconChip, body text (2-line clamp `numberOfLines={2}`,
  `colors.text`), muted datetime + relativeTime, Avatar. Tap → `/notes/[id]`.
- `/notes/[id]`: full body multiline edit (dirty-gated), datetime (dirty-gated),
  Alert-confirmed delete.
- Home: `NotesStatusCard` via StatusCard (tracker 'notes'): value = latest body
  (single-line ellipsized — pass through StatusCard, it already single-lines);
  meta = relativeTime; none → "No notes yet — tap to write". onPress `/notes`.
- Track row: "Notes".
- Routes in protected block.

## Pure logic

None new (no math). No new tests beyond keeping suite green.

## Out of Scope

Search, tags, photos, pinned notes.

## Definition of Done

Compose/edit/delete notes; Home card + Track row; avatars on rows; all checks green.
