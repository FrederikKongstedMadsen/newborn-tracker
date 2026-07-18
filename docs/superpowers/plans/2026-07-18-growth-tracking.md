# Baby Profile + Growth Tracking Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Baby profile (name/sex/birthdate) plus weight/height/head-circumference logging, drawn as points over WHO percentile curves.

**Architecture:** First migration creates `babies` + `growth_measurements` in Supabase (applied manually via SQL editor — no DB credentials on this machine). WHO percentile data is vendored as static JSON. React Query hooks wrap Supabase CRUD. A hand-rolled react-native-svg chart draws percentile curves + measurement points; curve math (age computation, interpolation) is pure TypeScript with jest tests — this feature introduces the project's test infra.

**Tech Stack:** Existing foundation (Expo SDK 57, TypeScript strict, Expo Router in `src/app/`, Supabase, TanStack Query) + `react-native-svg` + `jest-expo`.

## Global Constraints

- Free tiers only. TypeScript strict. Metric units (`weight_g` integer grams, `height_cm`/`head_circumference_cm` numeric cm).
- Spec: `docs/superpowers/specs/2026-07-18-data-model-design.md` — table definitions there are authoritative.
- Shared table conventions: `id uuid pk default gen_random_uuid()`, `created_by uuid not null references auth.users(id)`, `created_at timestamptz not null default now()`, RLS with full access for `authenticated` role.
- WHO curves: indicators weight-for-age, length-for-age, head-circumference-for-age; sexes both; percentiles 3/15/50/85/97; ages 0–2 years.
- Verification: `npm run typecheck && npm run lint && npm test`, plus `npx expo export --platform android` for bundle integrity. Live-app checks listed per task run via `npx expo start` + Expo Go.
- Before writing chart code (Task 6), load the `dataviz` skill for design guidance.

---

### Task 1: Migration + row types

**Files:**
- Create: `supabase/migrations/0001_babies_growth.sql`
- Create: `src/features/baby/types.ts`
- Create: `src/features/growth/types.ts`

**Interfaces:**
- Produces: DB tables `babies`, `growth_measurements`; TS types `Baby`, `NewBaby`, `GrowthMeasurement`, `NewGrowthMeasurement`.

- [ ] **Step 1: Write migration**

`supabase/migrations/0001_babies_growth.sql`:

```sql
create table babies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sex text not null check (sex in ('male', 'female')),
  birth_date date not null,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now()
);

alter table babies enable row level security;

create policy "authenticated full access" on babies
  for all to authenticated using (true) with check (true);

create table growth_measurements (
  id uuid primary key default gen_random_uuid(),
  baby_id uuid not null references babies (id),
  measured_at date not null,
  weight_g integer,
  height_cm numeric(4, 1),
  head_circumference_cm numeric(4, 1),
  note text,
  created_by uuid not null references auth.users (id),
  created_at timestamptz not null default now(),
  constraint at_least_one_measurement check (
    weight_g is not null
    or height_cm is not null
    or head_circumference_cm is not null
  )
);

alter table growth_measurements enable row level security;

create policy "authenticated full access" on growth_measurements
  for all to authenticated using (true) with check (true);
```

- [ ] **Step 2: Row types**

`src/features/baby/types.ts`:

```ts
export interface Baby {
  id: string;
  name: string;
  sex: 'male' | 'female';
  birth_date: string; // 'YYYY-MM-DD'
  created_by: string;
  created_at: string;
}

export type NewBaby = Pick<Baby, 'name' | 'sex' | 'birth_date'>;
```

`src/features/growth/types.ts`:

```ts
export interface GrowthMeasurement {
  id: string;
  baby_id: string;
  measured_at: string; // 'YYYY-MM-DD'
  weight_g: number | null;
  height_cm: number | null;
  head_circumference_cm: number | null;
  note: string | null;
  created_by: string;
  created_at: string;
}

export type NewGrowthMeasurement = Pick<
  GrowthMeasurement,
  'baby_id' | 'measured_at' | 'weight_g' | 'height_cm' | 'head_circumference_cm' | 'note'
>;
```

(Supabase returns `numeric` columns as JS numbers here; no string handling needed.)

- [ ] **Step 3: Apply migration — MANUAL CHECKPOINT**

Paste the SQL file contents into Supabase dashboard → SQL editor → Run. This machine has no DB credentials, so the user must do this (or the executor pauses and asks). Verify: dashboard → Table editor shows both tables.

- [ ] **Step 4: Verify + commit**

Run: `npm run typecheck && npm run lint`
Expected: pass.

```bash
git add supabase src/features
git commit -m "feat: add babies and growth_measurements schema + row types"
```

### Task 2: Test infra + age/interpolation utils (TDD)

**Files:**
- Create: `src/features/growth/who/types.ts`
- Create: `src/features/growth/who/curveMath.ts`
- Test: `src/features/growth/who/curveMath.test.ts`
- Modify: `package.json` (jest config + test script)

**Interfaces:**
- Produces: `ageInDays(birthDate: string, at: string): number`; `curveValueAt(points: CurvePoint[], percentile: Percentile, ageDays: number): number | null`; types `Percentile`, `CurvePoint`, `WhoCurve`, `Indicator`.

- [ ] **Step 1: Install jest**

```bash
npx expo install jest-expo jest
npm install -D @types/jest
npm pkg set scripts.test="jest"
```

Add to `package.json`:

```json
"jest": {
  "preset": "jest-expo"
}
```

- [ ] **Step 2: WHO types**

`src/features/growth/who/types.ts`:

```ts
export type Percentile = 'p3' | 'p15' | 'p50' | 'p85' | 'p97';

export type Indicator = 'weight-for-age' | 'length-for-age' | 'head-circumference-for-age';

export interface CurvePoint {
  ageDays: number;
  p3: number;
  p15: number;
  p50: number;
  p85: number;
  p97: number;
}

export interface WhoCurve {
  indicator: Indicator;
  sex: 'male' | 'female';
  unit: 'kg' | 'cm';
  points: CurvePoint[]; // ascending ageDays
}

export const PERCENTILES: Percentile[] = ['p3', 'p15', 'p50', 'p85', 'p97'];
```

- [ ] **Step 3: Write failing tests**

`src/features/growth/who/curveMath.test.ts`:

```ts
import { ageInDays, curveValueAt } from './curveMath';
import type { CurvePoint } from './types';

const points: CurvePoint[] = [
  { ageDays: 0, p3: 2.5, p15: 2.9, p50: 3.3, p85: 3.9, p97: 4.3 },
  { ageDays: 30, p3: 3.4, p15: 3.9, p50: 4.5, p85: 5.1, p97: 5.7 },
  { ageDays: 60, p3: 4.4, p15: 4.9, p50: 5.6, p85: 6.3, p97: 7.0 },
];

describe('ageInDays', () => {
  it('is 0 on the birth date', () => {
    expect(ageInDays('2026-07-01', '2026-07-01')).toBe(0);
  });

  it('counts calendar days', () => {
    expect(ageInDays('2026-07-01', '2026-07-18')).toBe(17);
  });

  it('crosses month and DST boundaries safely', () => {
    expect(ageInDays('2026-02-27', '2026-03-02')).toBe(3);
    expect(ageInDays('2026-03-28', '2026-03-30')).toBe(2); // European DST switch
  });
});

describe('curveValueAt', () => {
  it('returns exact value at a data point', () => {
    expect(curveValueAt(points, 'p50', 30)).toBe(4.5);
  });

  it('interpolates linearly between points', () => {
    expect(curveValueAt(points, 'p50', 15)).toBeCloseTo(3.9, 5);
  });

  it('returns null outside the data range', () => {
    expect(curveValueAt(points, 'p50', -1)).toBeNull();
    expect(curveValueAt(points, 'p50', 61)).toBeNull();
  });
});
```

- [ ] **Step 4: Run tests, verify failure**

Run: `npm test`
Expected: FAIL — cannot find module './curveMath'.

- [ ] **Step 5: Implement**

`src/features/growth/who/curveMath.ts`:

```ts
import type { CurvePoint, Percentile } from './types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Both dates as 'YYYY-MM-DD'. Parsed as UTC so DST never shifts the count. */
export function ageInDays(birthDate: string, at: string): number {
  const birth = Date.parse(`${birthDate}T00:00:00Z`);
  const then = Date.parse(`${at}T00:00:00Z`);
  return Math.round((then - birth) / MS_PER_DAY);
}

export function curveValueAt(
  points: CurvePoint[],
  percentile: Percentile,
  ageDays: number,
): number | null {
  if (points.length === 0) return null;
  if (ageDays < points[0].ageDays || ageDays > points[points.length - 1].ageDays) return null;

  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    if (ageDays >= a.ageDays && ageDays <= b.ageDays) {
      const t = b.ageDays === a.ageDays ? 0 : (ageDays - a.ageDays) / (b.ageDays - a.ageDays);
      return a[percentile] + t * (b[percentile] - a[percentile]);
    }
  }
  return null;
}
```

- [ ] **Step 6: Run tests, verify pass**

Run: `npm test`
Expected: PASS (6 tests).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add jest infra and WHO curve math utilities"
```

### Task 3: Vendor WHO percentile data

**Files:**
- Create: `src/features/growth/who/data/weight-for-age-male.json` (+ female, and the four length/head files — six total)
- Create: `src/features/growth/who/curves.ts`
- Test: `src/features/growth/who/curves.test.ts`

**Interfaces:**
- Consumes: `WhoCurve`, `Indicator` from `./types`.
- Produces: `getCurve(indicator: Indicator, sex: 'male' | 'female'): WhoCurve`.

- [ ] **Step 1: Obtain WHO data**

Source: WHO Child Growth Standards percentile tables (https://www.who.int/tools/child-growth-standards/standards) — indicators "Weight-for-age", "Length/height-for-age", "Head circumference-for-age", expanded percentile tables for boys and girls, birth to 2 years. Download the xlsx/csv, extract columns age (days or months → convert to days, 1 month = 30.4375 days), P3, P15, P50, P85, P97. If WHO's site layout blocks direct download, the same LMS/percentile tables ship with CDC's WHO growth charts data files (https://www.cdc.gov/growthcharts/who-data-files.htm). Convert to JSON matching `WhoCurve` (write a throwaway script in the scratchpad — do not commit the converter, only the JSON).

Each file, shape:

```json
{
  "indicator": "weight-for-age",
  "sex": "male",
  "unit": "kg",
  "points": [{ "ageDays": 0, "p3": 2.5, "p15": 2.9, "p50": 3.3, "p85": 3.9, "p97": 4.3 }]
}
```

Granularity: whatever the source table provides (monthly is fine; weekly for the first 13 weeks if available). Range 0–731 days.

- [ ] **Step 2: Loader**

`src/features/growth/who/curves.ts`:

```ts
import type { Indicator, WhoCurve } from './types';

import headFemale from './data/head-circumference-for-age-female.json';
import headMale from './data/head-circumference-for-age-male.json';
import lengthFemale from './data/length-for-age-female.json';
import lengthMale from './data/length-for-age-male.json';
import weightFemale from './data/weight-for-age-female.json';
import weightMale from './data/weight-for-age-male.json';

const curves: Record<Indicator, Record<'male' | 'female', WhoCurve>> = {
  'weight-for-age': { male: weightMale as WhoCurve, female: weightFemale as WhoCurve },
  'length-for-age': { male: lengthMale as WhoCurve, female: lengthFemale as WhoCurve },
  'head-circumference-for-age': { male: headMale as WhoCurve, female: headFemale as WhoCurve },
};

export function getCurve(indicator: Indicator, sex: 'male' | 'female'): WhoCurve {
  return curves[indicator][sex];
}
```

- [ ] **Step 3: Sanity tests against known WHO reference values**

`src/features/growth/who/curves.test.ts`:

```ts
import { curveValueAt } from './curveMath';
import { getCurve } from './curves';
import { PERCENTILES } from './types';

describe('vendored WHO curves', () => {
  it('covers 0-2 years for all six curve files', () => {
    for (const indicator of [
      'weight-for-age',
      'length-for-age',
      'head-circumference-for-age',
    ] as const) {
      for (const sex of ['male', 'female'] as const) {
        const curve = getCurve(indicator, sex);
        expect(curve.points[0].ageDays).toBe(0);
        expect(curve.points[curve.points.length - 1].ageDays).toBeGreaterThanOrEqual(730);
      }
    }
  });

  it('percentiles are strictly increasing at every point', () => {
    const curve = getCurve('weight-for-age', 'male');
    for (const point of curve.points) {
      for (let i = 1; i < PERCENTILES.length; i++) {
        expect(point[PERCENTILES[i]]).toBeGreaterThan(point[PERCENTILES[i - 1]]);
      }
    }
  });

  it('matches known WHO medians (±0.2)', () => {
    // WHO: boys weight-for-age P50 at birth ≈ 3.3 kg, at 1 year ≈ 9.6 kg
    expect(curveValueAt(getCurve('weight-for-age', 'male').points, 'p50', 0)).toBeCloseTo(3.3, 1);
    expect(curveValueAt(getCurve('weight-for-age', 'male').points, 'p50', 365)).toBeCloseTo(
      9.6,
      1,
    );
    // WHO: girls length-for-age P50 at birth ≈ 49.1 cm
    expect(curveValueAt(getCurve('length-for-age', 'female').points, 'p50', 0)).toBeCloseTo(
      49.1,
      1,
    );
  });
});
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS. If median checks fail, the conversion mapped columns wrong — fix data, not tests.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: vendor WHO growth standard percentile data"
```

### Task 4: Baby + measurement hooks

**Files:**
- Create: `src/features/baby/hooks.ts`
- Create: `src/features/growth/hooks.ts`

**Interfaces:**
- Consumes: `supabase` (`@/lib/supabase`), types from Tasks 1.
- Produces: `useBaby(): UseQueryResult<Baby | null>`; `useSaveBaby()` (upsert mutation); `useGrowthMeasurements(babyId: string | undefined)`; `useAddMeasurement()`, `useUpdateMeasurement()`, `useDeleteMeasurement()`.

- [ ] **Step 1: Baby hooks**

`src/features/baby/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { Baby, NewBaby } from './types';

export function useBaby() {
  return useQuery({
    queryKey: ['baby'],
    queryFn: async (): Promise<Baby | null> => {
      const { data, error } = await supabase.from('babies').select('*').limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

/** Creates the baby row, or updates it if `id` is passed. */
export function useSaveBaby() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (baby: NewBaby & { id?: string }): Promise<Baby> => {
      const { data: auth } = await supabase.auth.getUser();
      const row = { ...baby, created_by: auth.user!.id };
      const { data, error } = await supabase.from('babies').upsert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['baby'] }),
  });
}
```

- [ ] **Step 2: Measurement hooks**

`src/features/growth/hooks.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

import type { GrowthMeasurement, NewGrowthMeasurement } from './types';

export function useGrowthMeasurements(babyId: string | undefined) {
  return useQuery({
    queryKey: ['growth_measurements', babyId],
    enabled: !!babyId,
    queryFn: async (): Promise<GrowthMeasurement[]> => {
      const { data, error } = await supabase
        .from('growth_measurements')
        .select('*')
        .eq('baby_id', babyId!)
        .order('measured_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

function useInvalidateMeasurements() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['growth_measurements'] });
}

export function useAddMeasurement() {
  const invalidate = useInvalidateMeasurements();
  return useMutation({
    mutationFn: async (measurement: NewGrowthMeasurement) => {
      const { data: auth } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('growth_measurements')
        .insert({ ...measurement, created_by: auth.user!.id });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateMeasurement() {
  const invalidate = useInvalidateMeasurements();
  return useMutation({
    mutationFn: async ({ id, ...fields }: Partial<NewGrowthMeasurement> & { id: string }) => {
      const { error } = await supabase.from('growth_measurements').update(fields).eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteMeasurement() {
  const invalidate = useInvalidateMeasurements();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('growth_measurements').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}
```

- [ ] **Step 3: Verify + commit**

Run: `npm run typecheck && npm run lint && npm test`
Expected: pass.

```bash
git add src/features
git commit -m "feat: add baby and growth measurement data hooks"
```

### Task 5: Screens — baby profile, home hub, measurement list/add/edit

**Files:**
- Create: `src/app/baby.tsx`
- Create: `src/app/growth/index.tsx`
- Create: `src/app/growth/new.tsx`
- Create: `src/app/growth/[id].tsx`
- Create: `src/components/FormField.tsx`
- Modify: `src/app/index.tsx` (home becomes hub with links)
- Modify: `src/app/_layout.tsx` (register new screens)

**Interfaces:**
- Consumes: hooks from Task 4.
- Produces: navigable screens; `FormField` (labelled TextInput) reused by later features.

- [ ] **Step 1: Shared form field**

`src/components/FormField.tsx`:

```tsx
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';

interface Props extends TextInputProps {
  label: string;
}

export function FormField({ label, ...inputProps }: Props) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} {...inputProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: 4 },
  label: { fontSize: 13, color: '#555' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
});
```

- [ ] **Step 2: Baby profile screen**

`src/app/baby.tsx` — form with name (text), sex (two toggle buttons), birth date (text input `YYYY-MM-DD`; native date picker deferred — YAGNI until it annoys). Prefilled from `useBaby()`, saves via `useSaveBaby()`, navigates back on success:

```tsx
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useBaby, useSaveBaby } from '@/features/baby/hooks';
import { FormField } from '@/components/FormField';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function BabyProfile() {
  const { data: baby } = useBaby();
  const saveBaby = useSaveBaby();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');

  useEffect(() => {
    if (baby) {
      setName(baby.name);
      setSex(baby.sex);
      setBirthDate(baby.birth_date);
    }
  }, [baby]);

  const valid = name.trim().length > 0 && DATE_RE.test(birthDate);

  function save() {
    saveBaby.mutate(
      { id: baby?.id, name: name.trim(), sex, birth_date: birthDate },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <View style={styles.container}>
      <FormField label="Name" value={name} onChangeText={setName} />
      <View style={styles.sexRow}>
        <Button
          title={sex === 'male' ? '● Boy' : 'Boy'}
          onPress={() => setSex('male')}
        />
        <Button
          title={sex === 'female' ? '● Girl' : 'Girl'}
          onPress={() => setSex('female')}
        />
      </View>
      <FormField
        label="Birth date (YYYY-MM-DD)"
        value={birthDate}
        onChangeText={setBirthDate}
        placeholder="2026-07-01"
        autoCapitalize="none"
      />
      {saveBaby.isError ? <Text style={styles.error}>{saveBaby.error.message}</Text> : null}
      <Button title="Save" disabled={!valid || saveBaby.isPending} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  sexRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  error: { color: 'red' },
});
```

- [ ] **Step 3: Home hub**

`src/app/index.tsx` — if `useBaby()` returns null, show "Create baby profile" button (→ `/baby`); otherwise show baby name + age and a link list (Growth now; later features append here). Keep sign-out button.

```tsx
import { Link } from 'expo-router';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useBaby } from '@/features/baby/hooks';
import { ageInDays } from '@/features/growth/who/curveMath';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { data: baby, isLoading } = useBaby();

  if (isLoading) return null;

  return (
    <View style={styles.container}>
      {baby ? (
        <>
          <Text style={styles.title}>{baby.name}</Text>
          <Text>
            {ageInDays(baby.birth_date, new Date().toISOString().slice(0, 10))} days old
          </Text>
          <Link href="/growth" asChild>
            <Button title="Growth" />
          </Link>
          <Link href="/baby" asChild>
            <Button title="Edit profile" />
          </Link>
        </>
      ) : (
        <Link href="/baby" asChild>
          <Button title="Create baby profile" />
        </Link>
      )}
      <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  title: { fontSize: 24, fontWeight: '600' },
});
```

- [ ] **Step 4: Measurement list screen**

`src/app/growth/index.tsx` — chart placeholder (Task 6 fills it), then FlatList of measurements (date + values, tap row → `/growth/[id]`), "Add measurement" button → `/growth/new`:

```tsx
import { Link, router } from 'expo-router';
import { Button, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { useBaby } from '@/features/baby/hooks';
import { useGrowthMeasurements } from '@/features/growth/hooks';
import type { GrowthMeasurement } from '@/features/growth/types';

function summary(m: GrowthMeasurement): string {
  const parts: string[] = [];
  if (m.weight_g != null) parts.push(`${(m.weight_g / 1000).toFixed(2)} kg`);
  if (m.height_cm != null) parts.push(`${m.height_cm} cm`);
  if (m.head_circumference_cm != null) parts.push(`head ${m.head_circumference_cm} cm`);
  return parts.join(' · ');
}

export default function GrowthScreen() {
  const { data: baby } = useBaby();
  const { data: measurements } = useGrowthMeasurements(baby?.id);

  return (
    <View style={styles.container}>
      <FlatList
        data={[...(measurements ?? [])].reverse()}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => router.push(`/growth/${item.id}`)}>
            <Text style={styles.date}>{item.measured_at}</Text>
            <Text>{summary(item)}</Text>
          </Pressable>
        )}
        ListEmptyComponent={<Text style={styles.empty}>No measurements yet</Text>}
      />
      <Link href="/growth/new" asChild>
        <Button title="Add measurement" />
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  date: { fontWeight: '600' },
  empty: { textAlign: 'center', color: '#888', marginTop: 24 },
});
```

- [ ] **Step 5: Add + edit screens**

`src/app/growth/new.tsx` — date (default today), weight in kg (decimal, stored ×1000 as grams), height cm, head cm, note; at least one measurement value required:

```tsx
import { router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { useBaby } from '@/features/baby/hooks';
import { useAddMeasurement } from '@/features/growth/hooks';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

export default function NewMeasurement() {
  const { data: baby } = useBaby();
  const addMeasurement = useAddMeasurement();
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [weightKg, setWeightKg] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [headCm, setHeadCm] = useState('');
  const [note, setNote] = useState('');

  const weight = parseDecimal(weightKg);
  const height = parseDecimal(heightCm);
  const head = parseDecimal(headCm);
  const valid =
    DATE_RE.test(date) && (weight !== null || height !== null || head !== null) && !!baby;

  function save() {
    addMeasurement.mutate(
      {
        baby_id: baby!.id,
        measured_at: date,
        weight_g: weight === null ? null : Math.round(weight * 1000),
        height_cm: height,
        head_circumference_cm: head,
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  return (
    <View style={styles.container}>
      <FormField label="Date (YYYY-MM-DD)" value={date} onChangeText={setDate} />
      <FormField
        label="Weight (kg)"
        value={weightKg}
        onChangeText={setWeightKg}
        keyboardType="decimal-pad"
        placeholder="4.25"
      />
      <FormField
        label="Height (cm)"
        value={heightCm}
        onChangeText={setHeightCm}
        keyboardType="decimal-pad"
        placeholder="54.5"
      />
      <FormField
        label="Head circumference (cm)"
        value={headCm}
        onChangeText={setHeadCm}
        keyboardType="decimal-pad"
        placeholder="37.0"
      />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {addMeasurement.isError ? (
        <Text style={styles.error}>{addMeasurement.error.message}</Text>
      ) : null}
      <Button title="Save" disabled={!valid || addMeasurement.isPending} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  error: { color: 'red' },
});
```

`src/app/growth/[id].tsx` — same form prefilled (find row in `useGrowthMeasurements(baby?.id)` by `useLocalSearchParams<{ id: string }>().id`), saves via `useUpdateMeasurement()`, plus Delete button wired to `useDeleteMeasurement()` behind a confirmation `Alert.alert('Delete measurement?', undefined, [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: ... }])`. Same fields, same `parseDecimal` (import from `../new`), navigate back on success.

- [ ] **Step 6: Register screens in layout**

In `src/app/_layout.tsx`, inside the authenticated `Stack.Protected` block add:

```tsx
<Stack.Screen name="baby" options={{ title: 'Baby profile' }} />
<Stack.Screen name="growth/index" options={{ title: 'Growth' }} />
<Stack.Screen name="growth/new" options={{ title: 'Add measurement' }} />
<Stack.Screen name="growth/[id]" options={{ title: 'Edit measurement' }} />
```

- [ ] **Step 7: Verify**

Run: `npm run typecheck && npm run lint && npm test && npx expo export --platform android`
Expected: all pass.

Live check (`npx expo start` + Expo Go): create baby profile, add a measurement, see it listed, edit it, delete it. Second phone (or web) sees the same data after pull-refresh/navigation.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "feat: add baby profile and growth measurement screens"
```

### Task 6: WHO percentile chart

**Files:**
- Create: `src/features/growth/GrowthChart.tsx`
- Test: `src/features/growth/chartScale.test.ts`
- Create: `src/features/growth/chartScale.ts`
- Modify: `src/app/growth/index.tsx` (replace placeholder with chart + indicator switcher)

**Interfaces:**
- Consumes: `getCurve`, `curveValueAt`, `ageInDays`, `WhoCurve`, `Indicator`, `PERCENTILES`; measurements + baby from hooks.
- Produces: `<GrowthChart indicator sex birthDate measurements width height />`; `makeScale(domain: [number, number], range: [number, number]): (v: number) => number`.

**Before writing chart code, load the `dataviz` skill.**

- [ ] **Step 1: Install react-native-svg**

```bash
npx expo install react-native-svg
```

- [ ] **Step 2: TDD the scale helper**

`src/features/growth/chartScale.test.ts`:

```ts
import { makeScale } from './chartScale';

describe('makeScale', () => {
  it('maps domain to range linearly', () => {
    const scale = makeScale([0, 10], [0, 100]);
    expect(scale(0)).toBe(0);
    expect(scale(5)).toBe(50);
    expect(scale(10)).toBe(100);
  });

  it('supports inverted ranges (svg y axis)', () => {
    const scale = makeScale([0, 10], [200, 0]);
    expect(scale(0)).toBe(200);
    expect(scale(10)).toBe(0);
  });
});
```

`src/features/growth/chartScale.ts`:

```ts
export function makeScale(
  domain: [number, number],
  range: [number, number],
): (value: number) => number {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const span = d1 - d0;
  return (value) => (span === 0 ? r0 : r0 + ((value - d0) / span) * (r1 - r0));
}
```

Run: `npm test` — first FAIL (module missing), then PASS after implementing.

- [ ] **Step 3: Chart component**

`src/features/growth/GrowthChart.tsx` — pure presentational: builds an x-domain of 0 → max(measurement age, 90 days), y-domain from curve values ±padding, draws five percentile `Polyline`s, measurement `Circle`s, and minimal axis labels. Measurement values per indicator: weight `weight_g / 1000` (kg), length `height_cm`, head `head_circumference_cm`; skip rows where the indicator's value is null.

```tsx
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { makeScale } from './chartScale';
import type { GrowthMeasurement } from './types';
import { ageInDays } from './who/curveMath';
import { getCurve } from './who/curves';
import type { Indicator, Percentile } from './who/types';
import { PERCENTILES } from './who/types';

const PERCENTILE_COLORS: Record<Percentile, string> = {
  p3: '#d95f5f',
  p15: '#e2a14e',
  p50: '#3d9a6c',
  p85: '#e2a14e',
  p97: '#d95f5f',
};

const MARGIN = { top: 12, right: 36, bottom: 28, left: 40 };

interface Props {
  indicator: Indicator;
  sex: 'male' | 'female';
  birthDate: string;
  measurements: GrowthMeasurement[];
  width: number;
  height: number;
}

function valueFor(indicator: Indicator, m: GrowthMeasurement): number | null {
  if (indicator === 'weight-for-age') return m.weight_g === null ? null : m.weight_g / 1000;
  if (indicator === 'length-for-age') return m.height_cm;
  return m.head_circumference_cm;
}

export function GrowthChart({ indicator, sex, birthDate, measurements, width, height }: Props) {
  const curve = getCurve(indicator, sex);
  const dataPoints = measurements
    .map((m) => ({ ageDays: ageInDays(birthDate, m.measured_at), value: valueFor(indicator, m) }))
    .filter((p): p is { ageDays: number; value: number } => p.value !== null && p.ageDays >= 0);

  const maxAge = Math.max(90, ...dataPoints.map((p) => p.ageDays)) * 1.1;
  const visible = curve.points.filter((p) => p.ageDays <= maxAge);
  const yValues = [...visible.flatMap((p) => PERCENTILES.map((pc) => p[pc])), ...dataPoints.map((p) => p.value)];
  const yMin = Math.min(...yValues) * 0.95;
  const yMax = Math.max(...yValues) * 1.05;

  const x = makeScale([0, maxAge], [MARGIN.left, width - MARGIN.right]);
  const y = makeScale([yMin, yMax], [height - MARGIN.bottom, MARGIN.top]);

  const monthTicks: number[] = [];
  for (let days = 0; days <= maxAge; days += 30.4375 * (maxAge > 200 ? 2 : 1)) {
    monthTicks.push(days);
  }

  return (
    <View>
      <Svg width={width} height={height}>
        {monthTicks.map((days) => (
          <Line
            key={days}
            x1={x(days)}
            y1={MARGIN.top}
            x2={x(days)}
            y2={height - MARGIN.bottom}
            stroke="#eee"
          />
        ))}
        {monthTicks.map((days) => (
          <SvgText
            key={`label-${days}`}
            x={x(days)}
            y={height - 10}
            fontSize={10}
            fill="#888"
            textAnchor="middle"
          >
            {Math.round(days / 30.4375)}
          </SvgText>
        ))}
        {PERCENTILES.map((pc) => (
          <Polyline
            key={pc}
            points={visible.map((p) => `${x(p.ageDays)},${y(p[pc])}`).join(' ')}
            stroke={PERCENTILE_COLORS[pc]}
            strokeWidth={pc === 'p50' ? 2 : 1}
            fill="none"
          />
        ))}
        {PERCENTILES.map((pc) => (
          <SvgText
            key={`pc-${pc}`}
            x={width - MARGIN.right + 4}
            y={y(visible[visible.length - 1][pc]) + 3}
            fontSize={9}
            fill={PERCENTILE_COLORS[pc]}
          >
            {pc.slice(1)}
          </SvgText>
        ))}
        {[yMin, (yMin + yMax) / 2, yMax].map((v) => (
          <SvgText key={v} x={4} y={y(v) + 3} fontSize={10} fill="#888">
            {v.toFixed(1)}
          </SvgText>
        ))}
        {dataPoints.map((p, i) => (
          <Circle key={i} cx={x(p.ageDays)} cy={y(p.value)} r={4} fill="#2563eb" />
        ))}
      </Svg>
    </View>
  );
}
```

(X axis labelled in months. `visible` is never empty — curve data starts at ageDays 0. Guard anyway: if `dataPoints` is empty the chart still renders bare curves — correct behavior. Adjust styling per dataviz skill guidance; structure above is the contract.)

- [ ] **Step 4: Wire into growth screen**

In `src/app/growth/index.tsx`: add indicator switcher (three buttons: Weight / Height / Head), render chart above the list when baby exists:

```tsx
const [indicator, setIndicator] = useState<Indicator>('weight-for-age');
const { width } = useWindowDimensions();
// inside render, above FlatList:
{baby ? (
  <GrowthChart
    indicator={indicator}
    sex={baby.sex}
    birthDate={baby.birth_date}
    measurements={measurements ?? []}
    width={width - 32}
    height={260}
  />
) : null}
```

with imports `useState`, `useWindowDimensions`, `GrowthChart`, `Indicator`, and a button row setting `indicator`.

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npm test && npx expo export --platform android`
Expected: pass.

Live check: growth screen shows five colored percentile curves; logged measurements appear as blue dots in plausible positions (e.g. a 4.5 kg one-month-old sits near the green median); switcher flips between the three indicators.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add WHO percentile growth chart"
```

## Self-Review Notes

- Spec coverage: babies table ✓ (T1), growth_measurements ✓ (T1), RLS conventions ✓ (T1), WHO vendored data ✓ (T3), chart ✓ (T6), editability ✓ (T5 edit/delete), note column ✓, metric units ✓. Feeding/sleep/diapers/sick/notes are later plans per build order.
- Type consistency: `Indicator`/`Percentile`/`WhoCurve` defined T2, consumed T3/T6; hook names defined T4, consumed T5/T6; `parseDecimal` defined T5 `new.tsx`, imported by `[id].tsx`.
- Manual checkpoint: migration application (T1 step 3) needs the user or a pause — only step no agent can do alone.
