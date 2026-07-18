# Newborn Tracker — Sick Tracker Design (Temperature + Medicine)

**Date:** 2026-07-18
**Status:** Approved (user delegated approval). Handoff-ready.

## Purpose

Feature: sickness tracking (build-order item 5) — temperature log + paracetamol
doses with "time since last dose" display.

## Data

Migration `0006_sick.sql`, exactly per the data-model spec:

- `temperatures` — measured_at timestamptz not null, `celsius numeric(3,1) not null`,
  note, shared conventions + RLS.
- `medicine_doses` — given_at timestamptz not null, `medicine text not null default
'paracetamol'`, `amount numeric(6,1) not null`, `unit text not null check (unit in
('ml','mg'))`, note, shared conventions + RLS.

## Design language (MANDATORY)

Same as diapers spec: tokens (`trackerColors.temperature` = red `#cf6257` /
tint `#fbe6e3`, thermometer icon), primitives, mutedDark rule, dates helpers,
pattern-source screens (`src/app/sleep/*`, `src/app/diaper/*` once built,
`StatusCard`).

## Screens

- `/sick` (stack over tabs): two sections via `SegmentedControl ['Temperature', 'Medicine']`:
  - **Temperature segment:** inline log form (celsius decimal FormField with comma
    support via shared parse helper, datetime default now, note) + history list
    (temp IconChip, bold "38.2 °C" — fever emphasis: value in danger color when
    ≥ 38.0 — muted datetime, Avatar). Tap row → `/sick/temperature/[id]` edit
    (dirty-gated datetime/value/note, Alert delete).
  - **Medicine segment:** "last dose" banner card — "Last paracetamol · 3h 20m ago"
    (live coarse tick; none → "No doses logged"); inline dose form (amount decimal,
    unit SegmentedControl ml|mg, medicine text default "paracetamol", datetime, note);
    dose history list (amount + unit + medicine, datetime, Avatar) → `/sick/medicine/[id]`
    edit (same conventions).
- Home: `SickStatusCard` via StatusCard (tracker 'temperature'): value = latest
  temperature "38.2 °C" (danger-colored when ≥ 38.0); meta = latest dose
  "paracetamol 3h ago" when doses exist else temperature relative time; none →
  "No entries yet". onPress `/sick`.
- Track row: temperature tracker colors, title "Sick", href `/sick`.
- Routes in protected block: `sick/index`, `sick/temperature/[id]`, `sick/medicine/[id]`.

## Pure logic (unit-tested)

`src/features/sick/sickMath.ts`: `isFever(celsius): boolean` (≥ 38.0);
`doseSummary(dose): string` ("2.5 ml paracetamol"); reuse `relativeTime` for
time-since-dose (no new time math needed).

## Out of Scope

Dose-interval warnings/alarms, medicine catalog, fever thresholds by age.

## Definition of Done

Both logs work with editable/deletable history; last-dose banner answers the 3am
question; fever coloring; Home card + Track row; avatars; tests green; all checks.
