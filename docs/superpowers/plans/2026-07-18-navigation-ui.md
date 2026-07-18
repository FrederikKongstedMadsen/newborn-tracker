# Navigation & UI Restructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bottom-tab navigation (Home overview / Track / Profile), safe-area-correct screens, and shared theme/card conventions.

**Architecture:** Expo Router `(tabs)` route group nested inside the existing auth-gated root Stack. New shared primitives (`theme.ts`, `Screen`, `Card`) that every screen adopts. Growth stack screens keep their routes and push over the tabs. No data or schema changes.

**Tech Stack:** Existing app (Expo SDK 57, TypeScript strict, Expo Router, TanStack Query, Supabase). `@expo/vector-icons` (ships with Expo) for tab icons. `react-native-safe-area-context` (already installed) for insets.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-07-18-navigation-ui-design.md`.
- TypeScript strict. No new dependencies beyond what's installed.
- Existing 11 tests must keep passing; no new unit tests required (pure UI).
- Verification per task: `npm run format && npm run typecheck && npm run lint && npm test`, and `npx expo export --platform android` on tasks that change navigation (remove `dist/` after).
- Auth gate invariant: every screen except `login` stays inside `Stack.Protected guard={session !== null}` in `src/app/_layout.tsx`.
- Commit messages end body with: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`

---

### Task 1: Theme constants + Screen + Card primitives

**Files:**

- Create: `src/lib/theme.ts`
- Create: `src/components/Screen.tsx`
- Create: `src/components/Card.tsx`

**Interfaces:**

- Produces: `theme` object (`colors`, `spacing`, `fontSize`); `<Screen scroll?: boolean, edges?: ('top'|'bottom')[]>` wrapper; `<Card onPress?, children>` pressable card.

- [ ] **Step 1: Theme**

`src/lib/theme.ts`:

```ts
export const colors = {
  background: '#f7f7f8',
  card: '#ffffff',
  text: '#1a1a1a',
  muted: '#6b7280',
  border: '#e5e7eb',
  primary: '#2a78d6',
  danger: '#d95f5f',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const fontSize = {
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
};
```

- [ ] **Step 2: Screen wrapper**

`src/components/Screen.tsx`:

```tsx
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '@/lib/theme';

interface Props {
  children: ReactNode;
  /** Scrollable content (default true). */
  scroll?: boolean;
  /** Apply the top inset — use on screens WITHOUT a native header (tabs). */
  topInset?: boolean;
}

export function Screen({ children, scroll = true, topInset = false }: Props) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingTop: topInset ? insets.top + spacing.md : spacing.md,
    paddingLeft: spacing.md + insets.left,
    paddingRight: spacing.md + insets.right,
    paddingBottom: spacing.md,
  };

  if (!scroll) {
    return <View style={[styles.container, padding]}>{children}</View>;
  }
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, padding]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { gap: spacing.md },
});
```

(Bottom inset intentionally not applied: tab bar covers it on tab screens, and pushed stack screens sit above the keyboard/nav bar with normal padding.)

- [ ] **Step 3: Card**

`src/components/Card.tsx`:

```tsx
import { ReactNode } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, spacing } from '@/lib/theme';

interface Props {
  children: ReactNode;
  onPress?: () => void;
}

export function Card({ children, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.card, pressed && onPress ? styles.pressed : null]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pressed: { opacity: 0.7 },
});
```

- [ ] **Step 4: Verify + commit**

Run: `npm run format && npm run typecheck && npm run lint && npm test`
Expected: pass (components unused yet — lint must not flag that; if unused-module rules complain, they won't since these are exports).

```bash
git add src && git commit -m "feat: add theme constants, Screen and Card primitives"
```

### Task 2: Tab navigator + root layout rewiring

**Files:**

- Create: `src/app/(tabs)/_layout.tsx`
- Create: `src/app/(tabs)/index.tsx` (placeholder content, Task 3 fills)
- Create: `src/app/(tabs)/track.tsx` (placeholder content, Task 4 fills)
- Create: `src/app/(tabs)/profile.tsx` (placeholder content, Task 4 fills)
- Modify: `src/app/_layout.tsx`
- Delete: `src/app/index.tsx`, `src/app/baby.tsx`

**Interfaces:**

- Consumes: nothing new.
- Produces: routes `/` (Home tab), `/track`, `/profile`; root layout registers `(tabs)` protected screen with `headerShown: false`.

- [ ] **Step 1: Tabs layout**

`src/app/(tabs)/_layout.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors } from '@/lib/theme';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="track"
        options={{
          title: 'Track',
          tabBarIcon: ({ color, size }) => <Ionicons name="add-circle" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Placeholder tab screens**

Each of `index.tsx`, `track.tsx`, `profile.tsx` in `src/app/(tabs)/` temporarily:

```tsx
import { Text } from 'react-native';

import { Screen } from '@/components/Screen';

export default function Home() {
  return (
    <Screen topInset>
      <Text>Home</Text>
    </Screen>
  );
}
```

(Component name/title per file: `Home`, `Track`, `Profile`.)

- [ ] **Step 3: Rewire root layout**

`src/app/_layout.tsx` — inside the authenticated `Stack.Protected` block, replace the `index` and `baby` screen registrations with a single `(tabs)` entry; keep growth screens:

```tsx
<Stack.Protected guard={session !== null}>
  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
  <Stack.Screen name="growth/index" options={{ title: 'Growth' }} />
  <Stack.Screen name="growth/new" options={{ title: 'Add measurement' }} />
  <Stack.Screen name="growth/[id]" options={{ title: 'Edit measurement' }} />
</Stack.Protected>
```

Delete `src/app/index.tsx` and `src/app/baby.tsx` (their content moves into tabs in Tasks 3–4; the old home's sign-out lives in Profile from Task 4 — losing it for one task inside this branch is fine).

- [ ] **Step 4: Verify + commit**

Run: `npm run format && npm run typecheck && npm run lint && npm test && npx expo export --platform android && rm -rf dist`
Expected: pass.

```bash
git add -A && git commit -m "feat: add bottom tab navigation shell"
```

### Task 3: Home tab — overview with status cards

**Files:**

- Create: `src/features/home/GrowthStatusCard.tsx`
- Modify: `src/app/(tabs)/index.tsx`

**Interfaces:**

- Consumes: `useBaby` (`@/features/baby/hooks`), `useGrowthMeasurements` (`@/features/growth/hooks`), `ageInDays` (`@/features/growth/who/curveMath`), `Screen`, `Card`, theme.
- Produces: Home screen per spec.

- [ ] **Step 1: Growth status card**

`src/features/home/GrowthStatusCard.tsx`:

```tsx
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';
import { colors, fontSize, spacing } from '@/lib/theme';

function latestSummary(m: GrowthMeasurement): string {
  const parts: string[] = [];
  if (m.weight_g != null) parts.push(`${(m.weight_g / 1000).toFixed(2)} kg`);
  if (m.height_cm != null) parts.push(`${m.height_cm} cm`);
  if (m.head_circumference_cm != null) parts.push(`head ${m.head_circumference_cm} cm`);
  return parts.join(' · ');
}

function relativeDays(dateIso: string): string {
  const days = Math.round((Date.now() - Date.parse(`${dateIso}T00:00:00`)) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  return `${days}d ago`;
}

export function GrowthStatusCard({ babyId }: { babyId: string }) {
  const { data: measurements } = useGrowthMeasurements(babyId);
  const latest = measurements?.[measurements.length - 1];

  return (
    <Card onPress={() => router.push('/growth')}>
      <Text style={styles.title}>Growth</Text>
      {latest ? (
        <>
          <Text style={styles.value}>{latestSummary(latest)}</Text>
          <Text style={styles.meta}>{relativeDays(latest.measured_at)}</Text>
        </>
      ) : (
        <Text style={styles.meta}>No measurements yet — tap to add</Text>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: fontSize.sm, color: colors.muted, textTransform: 'uppercase' },
  value: { fontSize: fontSize.lg, fontWeight: '600', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.muted, marginTop: spacing.xs },
});
```

- [ ] **Step 2: Home screen**

`src/app/(tabs)/index.tsx`:

```tsx
import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { useBaby } from '@/features/baby/hooks';
import { GrowthStatusCard } from '@/features/home/GrowthStatusCard';
import { ageInDays } from '@/features/growth/who/curveMath';
import { colors, fontSize } from '@/lib/theme';

export default function Home() {
  const { data: baby, isLoading } = useBaby();

  if (isLoading) return <Screen topInset>{null}</Screen>;

  return (
    <Screen topInset>
      {baby ? (
        <>
          <Text style={styles.name}>{baby.name}</Text>
          <Text style={styles.age}>
            {ageInDays(baby.birth_date, new Date().toISOString().slice(0, 10))} days old
          </Text>
          <GrowthStatusCard babyId={baby.id} />
        </>
      ) : (
        <Card onPress={() => router.push('/profile')}>
          <Text style={styles.name}>Welcome</Text>
          <Text style={styles.age}>Create the baby profile to get started</Text>
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  name: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  age: { fontSize: fontSize.md, color: colors.muted },
});
```

- [ ] **Step 3: Verify + commit**

Run: `npm run format && npm run typecheck && npm run lint && npm test`
Expected: pass.

```bash
git add -A && git commit -m "feat: add home overview with growth status card"
```

### Task 4: Track + Profile tabs

**Files:**

- Modify: `src/app/(tabs)/track.tsx`
- Modify: `src/app/(tabs)/profile.tsx`

**Interfaces:**

- Consumes: `Screen`, `Card`, theme, `useBaby`/`useSaveBaby`, `FormField`, `supabase` (sign out).
- Produces: Track directory and Profile screens per spec.

- [ ] **Step 1: Track tab**

`src/app/(tabs)/track.tsx`:

```tsx
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { Screen } from '@/components/Screen';
import { colors, fontSize, spacing } from '@/lib/theme';

const TRACKERS = [
  { title: 'Growth', icon: 'trending-up' as const, href: '/growth' as const },
  // future: feeding, sleep, diapers, sick, notes
];

export default function Track() {
  return (
    <Screen topInset>
      <Text style={styles.heading}>Track</Text>
      {TRACKERS.map((t) => (
        <Card key={t.href} onPress={() => router.push(t.href)}>
          <View style={styles.row}>
            <Ionicons name={t.icon} size={22} color={colors.primary} />
            <Text style={styles.title}>{t.title}</Text>
          </View>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: fontSize.md, fontWeight: '600', color: colors.text },
});
```

- [ ] **Step 2: Profile tab**

`src/app/(tabs)/profile.tsx` — the old `src/app/baby.tsx` form (git history has it; commit e-range of growth-tracking branch) adapted: wrapped in `Screen topInset`, heading "Profile", same name/sex/birthdate fields + render-time prefill sync pattern, save via `useSaveBaby` (no `router.back()` — stay on tab, show saved state), plus sign-out button at the bottom:

```tsx
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { Screen } from '@/components/Screen';
import { useBaby, useSaveBaby } from '@/features/baby/hooks';
import { colors, fontSize, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function Profile() {
  const { data: baby } = useBaby();
  const saveBaby = useSaveBaby();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');
  // Render-time sync: prefill form when the baby row first arrives (React docs:
  // "adjusting state when a prop changes").
  const [prevBaby, setPrevBaby] = useState(baby);
  if (baby !== prevBaby) {
    setPrevBaby(baby);
    if (baby) {
      setName(baby.name);
      setSex(baby.sex);
      setBirthDate(baby.birth_date);
    }
  }

  const valid = name.trim().length > 0 && DATE_RE.test(birthDate);

  return (
    <Screen topInset>
      <Text style={styles.heading}>Profile</Text>
      <FormField label="Name" value={name} onChangeText={setName} />
      <View style={styles.sexRow}>
        <Button title={sex === 'male' ? '● Boy' : 'Boy'} onPress={() => setSex('male')} />
        <Button title={sex === 'female' ? '● Girl' : 'Girl'} onPress={() => setSex('female')} />
      </View>
      <FormField
        label="Birth date (YYYY-MM-DD)"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="2026-07-01"
        autoCapitalize="none"
      />
      {saveBaby.isError ? <Text style={styles.error}>{saveBaby.error.message}</Text> : null}
      {saveBaby.isSuccess ? <Text style={styles.saved}>Saved</Text> : null}
      <Button
        title="Save"
        disabled={!valid || saveBaby.isPending}
        onPress={() =>
          saveBaby.mutate({ id: baby?.id, name: name.trim(), sex, birth_date: birthDate })
        }
      />
      <View style={styles.signOut}>
        <Button title="Sign out" color={colors.danger} onPress={() => supabase.auth.signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: fontSize.xl, fontWeight: '700', color: colors.text },
  sexRow: { flexDirection: 'row', gap: spacing.sm, justifyContent: 'center' },
  error: { color: colors.danger },
  saved: { color: colors.primary },
  signOut: { marginTop: spacing.xl },
});
```

- [ ] **Step 3: Verify + commit**

Run: `npm run format && npm run typecheck && npm run lint && npm test`
Expected: pass.

```bash
git add -A && git commit -m "feat: add track directory and profile tab"
```

### Task 5: Migrate growth screens to Screen/theme

**Files:**

- Modify: `src/app/growth/index.tsx`, `src/app/growth/new.tsx`, `src/app/growth/[id].tsx`
- Modify: `src/components/FormField.tsx`, `src/features/growth/GrowthChart.tsx` (theme constants only)

**Interfaces:**

- Consumes: `Screen`, theme.
- Produces: growth screens with correct insets and theme colors; no behavior change.

- [ ] **Step 1: Growth screens adopt Screen**

- `growth/new.tsx` and `growth/[id].tsx`: replace outer `View style={styles.container}` with `<Screen>` (no `topInset` — they have native headers). Keep field structure; move hardcoded colors (`red`, `#ccc`) to theme (`colors.danger`, `colors.border`).
- `growth/index.tsx`: replace outer container with `<Screen scroll={false}>` (FlatList must own scrolling); chart + switcher become the FlatList's `ListHeaderComponent` so the whole screen scrolls as one unit; hardcoded `#2a78d6` switcher color → `colors.primary`.

- [ ] **Step 2: FormField + chart theme migration**

- `FormField.tsx`: `#555` → `colors.muted`, `#ccc` → `colors.border`.
- `GrowthChart.tsx`: replace its local color literals with theme equivalents where an exact match exists (`MEASUREMENT_COLOR` → `colors.primary`); percentile band colors stay local to the chart (domain-specific, not theme).

- [ ] **Step 3: Verify + commit**

Run: `npm run format && npm run typecheck && npm run lint && npm test && npx expo export --platform android && rm -rf dist`
Expected: pass.

```bash
git add -A && git commit -m "refactor: adopt Screen wrapper and theme across growth screens"
```

## Self-Review Notes

- Spec coverage: tabs ✓ (T2), Home cards ✓ (T3), Track ✓ (T4), Profile+signout ✓ (T4), /baby deleted ✓ (T2), Screen safe-area ✓ (T1+T5), theme ✓ (T1+T5), Card ✓ (T1). Definition-of-done items all mapped.
- Type consistency: `Screen` props (`scroll`, `topInset`) used in T2–T5 match T1 definition; `Card` `onPress` matches; theme keys (`colors.primary/danger/muted/border`, `spacing.*`, `fontSize.*`) referenced in later tasks all exist in T1.
- Known risk: `Tabs` + nested `Stack.Protected` interplay — `(tabs)` group inside protected block is the documented expo-router pattern; T2's export check catches route-resolution failures.
- relativeDays uses local-midnight parse (`T00:00:00` without Z) intentionally: measured_at is a calendar date in the user's timezone.
