# Newborn Tracker — Settings Design

**Date:** 2026-07-18
**Status:** Approved (user requested; delegated approval)

## Purpose

Replace the "Baby profile" tab with a Settings hub. Baby editing moves under it;
users gain in-app editing of their own profile (display name, email, avatar
color + emoji) — eliminating the manual dashboard step for `profiles` rows.

## Data

Migration `0008_profile_emoji.sql`:
`alter table profiles add column emoji text;` (nullable; when set, Avatar renders
the emoji instead of the initial). No other schema change. A user's profile row
may not exist yet — saving MUST upsert (id = own auth user id).

## Design language (MANDATORY)

Existing regime: tokens/trackerColors/primitives, mutedDark rule, big in-page
titles. Settings rows = Card + IconChip + label + chevron-forward (pattern:
Track tab rows).

## Structure

- Tab rename: `(tabs)/profile.tsx` → `(tabs)/settings.tsx`, tab title "Settings",
  Ionicons `settings` icon. ALL `/profile` route references across the app update
  to `/settings` (home header button, welcome card, any others — grep).
- `(tabs)/settings.tsx` — title "Settings"; rows: "Baby profile" (baby-blue/growth
  chip or dedicated icon, subtitle = current baby name) → `/settings/baby`;
  "My profile" (Avatar of me as leading visual, subtitle = my display name or
  "Not set up yet") → `/settings/profile`; below: Sign out (danger PillButton).
- `src/app/settings/baby.tsx` (stack, native header "Baby profile"): the existing
  baby form moved verbatim (name, Boy/Girl SegmentedControl, birthdate, prefilled
  from current row, upsert-in-place semantics preserved, "Saved" indicator).
- `src/app/settings/profile.tsx` (stack, native header "My profile"): form —
  display name (FormField); avatar color (row of preset swatches from the tracker
  accent palette: #5a60c6, #c07a45, #3a8a6f, #3f76c2, #cf6257, #c9922e — selected
  = ring/border); emoji (single FormField, optional, maxLength 2 in practice);
  live Avatar preview (large, top) reflecting name/color/emoji; email (FormField
  prefilled from session user email) — changing it calls
  `supabase.auth.updateUser({ email })` and shows info text "Confirmation links
  sent to your old and new email"; Save (upserts profiles row: id, display_name,
  color, emoji; email handled separately via auth call only when changed).
- Avatar component: render `profile.emoji` when non-empty, else initial. Same
  colored circle.

## Out of Scope

Password change, image-upload avatars, deleting accounts, multi-baby.

## Definition of Done

Settings hub navigable; baby edit preserves existing row/data; my-profile save
creates/updates own profiles row and avatars update on history rows; email
change triggers Supabase confirmation flow; no `/profile` references remain;
checks green; sim-verified visually.
