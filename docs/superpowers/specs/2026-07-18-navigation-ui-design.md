# Newborn Tracker — Navigation & UI Restructure Design

**Date:** 2026-07-18
**Status:** Approved

## Purpose

Replace the single-screen hub with a bottom-tab layout, fix safe-area handling
(status bar top, Android navigation bar bottom), and establish light UI
conventions (theme constants, card components) before more trackers land.

## Navigation Structure

Expo Router route groups:

```
src/app/
  _layout.tsx          # root Stack + auth gate (Stack.Protected) — structure unchanged
  login.tsx
  (tabs)/
    _layout.tsx        # Tabs navigator: Home | Track | Profile
    index.tsx          # Home — overview
    track.tsx          # Track — tracker directory
    profile.tsx        # Profile — baby profile + sign out
  growth/
    index.tsx          # stack screens push over the tabs; routes unchanged
    new.tsx
    [id].tsx
```

The former `/baby` route's form moves into the Profile tab; the `/baby` route is
deleted. The root layout registers `(tabs)` as a single protected screen (header
hidden — tabs manage their own headers) alongside the `growth/*` stack screens.

## Tabs

### Home (overview)

- Header: baby name + age in days (age via existing `ageInDays`).
- One status card per tracker showing its latest datapoint and relative time,
  e.g. "Weight 4.2 kg · 3d ago". Tap card → that tracker's screen.
- Growth card only for now (latest measurement: whichever of weight/height/head
  the newest row has). Cards for feeding/sleep/etc. are added as those features land.
- No baby row yet → single "Create baby profile" card linking to Profile tab.

### Track

- List of tracker entries (icon + name), each navigating to its tracker screen.
- Growth only for now; future trackers append here.

### Profile

- Baby profile form (name, sex, birthdate) — moved from the old `/baby` screen,
  same hooks and validation.
- Sign out button.

## Safe Areas

- Tab bar handles the bottom inset natively (React Navigation tabs).
- New shared `Screen` component (`src/components/Screen.tsx`): safe-area-aware
  wrapper using `useSafeAreaInsets` — applies top inset only where there is no
  header, standard horizontal padding, optional scroll. All screens (tabs +
  existing growth screens) adopt it.

## UI Conventions

- `src/lib/theme.ts`: exported constants — colors (text, muted, background,
  card, primary, danger, border), spacing scale, font sizes. Existing hardcoded
  hex values in screens/chart migrate to it where straightforward.
- `src/components/Card.tsx`: pressable card (rounded, bordered, padded) used by
  Home status cards and Track list rows.
- Keep native stack headers for pushed screens (growth/new, growth/[id]).
- No dark mode, no theming framework (YAGNI).

## Out of Scope

- New trackers or data changes (no migrations).
- Dark mode, animations, icon packs beyond what expo/vector-icons already ships.
- Tablet layouts.

## Definition of Done

- Bottom tabs render with correct icons/labels; no content under status bar or
  behind Android nav bar on any screen.
- Home shows baby header + growth status card (or create-profile card).
- Track lists Growth; Profile edits baby + signs out.
- Old `/baby` route gone; growth add/edit/delete flows still work.
- Existing 11 tests pass; typecheck/lint/export clean.
