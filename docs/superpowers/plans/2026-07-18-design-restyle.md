# Design Restyle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adopt the user's design across the app (tokens, font, home grid, timer heroes, segmented feeding, attribution avatars) without changing data behavior.

**Architecture:** Token overhaul in `theme.ts` ripples through existing primitives; new primitives (IconChip, PillButton, SegmentedControl, Avatar, ClockDigits) encode the design language once; screens restyle around unchanged hooks/math. Design reference screenshots: `docs/design/*.png` — implementers MUST Read the relevant screenshot(s) before styling a screen.

**Tech Stack:** Existing + `expo-font` / `@expo-google-fonts/plus-jakarta-sans` (only new deps).

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-18-design-restyle.md` — tokens and per-screen requirements there are authoritative; screenshots in `docs/design/` are the visual source of truth.
- Data layer untouched: no hook/math/query changes except the new `profiles` read hook. All 49 tests stay green unmodified (pure-logic only; `formatClock` addition gets its own tests).
- TS strict; verification per task `npm run format && npm run typecheck && npm run lint && npm test` (+ `npx expo export --platform android && rm -rf dist` where noted).
- Commit bodies end: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Migration 0004 + tokens + font + primitives

**Files:**

- Create: `supabase/migrations/0004_profiles.sql` — profiles table (spec) + `create unique index one_open_feed_per_baby on feeds (baby_id) where ended_at is null;`
- Create: `src/features/profiles/types.ts` (`Profile { id, display_name, color }`) and `src/features/profiles/hooks.ts` (`useProfiles(): UseQueryResult<Profile[]>` — select all, staleTime Infinity; `useProfileMap()` convenience returning `Map<string, Profile>` keyed by id, derived via select option)
- Rewrite: `src/lib/theme.ts` — spec palette verbatim: `colors` (background `#f0eee6`, card `#ffffff`, text `#221f1b`, muted `#9b958c`, mutedDark `#6b665e`, border `#e9e4db`, primary `#5a60c6`, primaryDark `#4a4fb0`, danger `#cf6257`), `trackerColors` record ({ sleep: { accent: '#5a60c6', tint: '#ece9fb', icon: 'moon' }, feeding: { accent: '#c07a45', tint: '#fbeadf', icon: 'restaurant' }, diaper: { accent: '#3a8a6f', tint: '#e2f0ea', icon: 'water' }, growth: { accent: '#3f76c2', tint: '#dbe6f6', icon: 'trending-up' }, temperature: { accent: '#cf6257', tint: '#fbe6e3', icon: 'thermometer' }, notes: { accent: '#8a857c', tint: '#f4f1ec', icon: 'document-text' } } — icon names typed `keyof typeof Ionicons.glyphMap`), `radius` ({ card: 20, chip: 12, pill: 999 }), keep `spacing`, extend `fontSize` (+ `timer: 44`), add `fontFamily` ({ regular: 'PlusJakartaSans_400Regular', semibold: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold' })
- Modify: `src/app/_layout.tsx` — `useFonts` from `@expo-google-fonts/plus-jakarta-sans` (three weights), hold splash/render null until loaded (before AuthGate render, hooks stay unconditional)
- Create primitives in `src/components/`: `IconChip.tsx` ({ icon, accent, tint, size? } → rounded-square chip), `PillButton.tsx` ({ title, onPress, icon?, variant: 'primary'|'danger'|'neutral', disabled? } → full-width pill, pressed state darkens), `SegmentedControl.tsx` ({ options: string[], selected, onSelect } → design's pill toggle, white active thumb), `Avatar.tsx` ({ profile: Profile | undefined, size? } → colored circle + initial, '?' fallback), `ClockDigits.tsx` ({ seconds, size? } → mono-spaced-feel big digits using `formatClock`)
- Create: `src/lib/clock.ts` + `src/lib/clock.test.ts` — `formatClock(seconds): string` — `"00:00"` mm:ss under 1h, `"1:02:05"` h:mm:ss above; TDD (cases: 0 → "00:00", 65 → "01:05", 3725 → "1:02:05", 59 → "00:59")
- Modify: `src/components/Card.tsx` (radius 20, soft shadow — `shadowColor '#221f1b'`, opacity ~0.06, radius 12, elevation 2 — drop hard border), `src/components/Screen.tsx` + `src/components/FormField.tsx` (token + fontFamily adoption)

Existing screens keep compiling (token names preserved where possible). Verify + export + commit: `feat: add design tokens, font, and primitive components`

### Task 2: Home redesign

**Files:**

- Rewrite: `src/app/(tabs)/index.tsx` — per `docs/design/home.png`: greeting header row (smiley IconChip in sleep tint; "Good morning/afternoon/evening" muted (<12h/<18h/else local hours), baby name `fontSize.xl` bold, "N days old" muted; right circular Card button (people icon) → `router.push('/profile')`); below, 2-column grid (flexDirection row + flexWrap, gap) of status cards.
- Refactor: `src/features/home/GrowthStatusCard.tsx`, `FeedingStatusCard.tsx`, `SleepStatusCard.tsx` — shared look via new `src/features/home/StatusCard.tsx` presentational wrapper ({ tracker: keyof trackerColors, value, meta, onPress }): IconChip top, tracker name muted, value bold `fontSize.lg`, meta muted small. Each feature card keeps its data logic, renders StatusCard. Growth card value: latest weight "4.15 kg" (or height/head fallback) — percentile meta if cheaply computable via existing curveMath (`curveValueAt` comparison), else keep relative-time meta (implementer's judgment, note choice).
- No-baby state: full-width welcome card → profile.

Verify + commit: `feat: redesign home with greeting and tracker grid`

### Task 3: Sleep screens restyle

**Files:**

- Modify: `src/features/sleep/ActiveSleepCard.tsx` → hero per `docs/design/01-sleep2.png`/`02-sleep2.png`: uppercase eyebrow state label (READY never shown here — card only exists when active: ASLEEP / PAUSED), `ClockDigits` (effective sleep), paused shows "Paused · Xm awake" line, controls as PillButtons (Pause/Resume primary-neutral, Stop danger).
- Modify: `src/app/sleep/index.tsx` — when no active sleep, hero card with READY eyebrow + `ClockDigits seconds={0}` + primary "Start sleep" PillButton (moon icon) — matching screenshot exactly; "RECENT SLEEPS" uppercase section label; rows per screenshot: sleep IconChip, bold "2h 12m" + muted "asleep · 8m paused" (pauseSeconds > 0 only), second line time range "08:55–11:15" (local HH:mm), right column relative time + `Avatar` (via `useProfileMap`, `created_by`).
- Modify: `src/app/sleep/[id].tsx` — segment breakdown per `docs/design/01-sleep-detail.png`/`02-sleep-detail.png`: alternating Sleep/Pause segment rows (accent dot, label, time range, right-aligned duration) computed from sleep + pauses (derive sleep segments between pauses); keep existing edit fields/deletes below, restyled with PillButton/danger.

Verify + commit: `feat: restyle sleep screens to design`

### Task 4: Feeding screens restyle

**Files:**

- Modify: `src/app/feeding/index.tsx` — per `docs/design/feed2.png`: `SegmentedControl ['Breast', 'Formula']` under title. Breast segment: hero card — total `ClockDigits`, "Tap a side to start" muted hint (idle), LEFT/RIGHT side boxes (uppercase label + own mm:ss `formatClock`; tap idle side → `useStartBreastFeed`; tap inactive side while running → `useToggleSide`; active side box highlighted accent border/tint + Stop PillButton appears); replaces old start-row + ActiveFeedCard composition (fold ActiveFeedCard's logic into the hero — delete `ActiveFeedCard.tsx` if fully superseded). Formula segment: inline volume/datetime/note form (move `formula.tsx` form contents into segment; keep `/feeding/formula` route working or delete route + layout entry if fully superseded — implementer picks, notes choice, no dead code). "Feeds per day" chart card: existing FeedingChart wrapped in Card with title row + "count · last 7 days" muted, per-day count row under bars per screenshot. History list rows: icon chip + summary + avatar, same pattern as sleep.
- Modify: `src/features/feeding/FeedingChart.tsx` — palette + count row per screenshot (counts under/over bars as shown).

Verify + commit: `feat: restyle feeding screens with segmented control and side boxes`

### Task 5: Remaining screens sweep + login

**Files:**

- Modify: `src/app/growth/index.tsx`, `growth/new.tsx`, `growth/[id].tsx`, `src/features/growth/GrowthChart.tsx` (palette alignment only — percentile colors adjust toward new palette: p50 `#3a8a6f`, p15/p85 `#c9922e`, p3/p97 `#cf6257`, measurement dots `#3f76c2`), `src/app/(tabs)/track.tsx` (IconChip rows via trackerColors), `src/app/(tabs)/profile.tsx` (PillButtons, sex toggle as SegmentedControl ['Boy','Girl'], danger sign-out pill), `src/app/login.tsx` (Screen + tokens + PillButton — clears backlog), `src/app/feeding/[id].tsx` + `formula.tsx` if still present (token adoption).
- Repo-wide check: `grep -rn '#[0-9a-fA-F]\{3,6\}' src --include='*.tsx' | grep -v theme.ts | grep -v GrowthChart` should return only new-palette values inside chart/domain files; stray old-theme hex (`#2a78d6`, `#d95f5f`, `#e5e7eb`, `#6b7280`, `#f7f7f8`, `#1a1a1a`, `#ccc`, `red`) must be gone.

Verify + export + commit: `refactor: complete design token adoption across remaining screens`

## Self-Review Notes

- Spec DoD coverage: font gate ✓T1, tokens everywhere ✓T1+T5+grep, home ✓T2, heroes ✓T3/T4, segmented ✓T4, avatars ✓T3/T4 (profiles ✓T1), login ✓T5, data flows untouched ✓ (constraint), tests green + formatClock TDD ✓T1.
- Migration 0004 = controller checkpoint after merge (profiles rows filled by user).
- Risk: fold-in of ActiveFeedCard/formula route (T4) is the only structural change — implementer must keep mutation flows identical and document route decision.
