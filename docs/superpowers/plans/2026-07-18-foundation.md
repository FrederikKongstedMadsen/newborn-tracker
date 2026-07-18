# Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffold the newborn-tracker Expo app with Supabase auth so both users can log in, see "hello {email}", and the session persists.

**Architecture:** Expo managed workflow with Expo Router file-based navigation. Supabase is the only backend; the app talks to it directly through `@supabase/supabase-js` wrapped in React Query. Auth state gates navigation in the root layout.

**Tech Stack:** Expo SDK (latest), TypeScript strict, Expo Router, @supabase/supabase-js, @tanstack/react-query, @react-native-async-storage/async-storage.

## Global Constraints

- Free tiers only; no paid services, no Apple developer account.
- TypeScript strict mode.
- Env vars use the `EXPO_PUBLIC_` prefix (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`); `.env` is gitignored, `.env.example` is committed.
- Session storage uses AsyncStorage (official Supabase Expo pattern) — deviation from the spec's `expo-secure-store`, which has a 2048-byte value limit that Supabase session JSON exceeds. Note this in the spec.
- Verification without a device: `npm run typecheck`, `npm run lint`, and `npx expo export --platform android` (bundles the app; catches import/runtime-module errors).

---

### Task 1: Scaffold Expo app

**Files:**
- Create: entire Expo template at repo root (`app/`, `package.json`, `tsconfig.json`, `app.json`, `.gitignore`, `assets/`)
- Delete: template example screens/components not needed

**Interfaces:**
- Produces: working Expo project where `app/*.tsx` files are routes (Expo Router), `npm run typecheck` and `npx expo export --platform android` pass.

- [ ] **Step 1: Scaffold with create-expo-app**

```bash
cd /Users/frederikkongstedmadsen/newborn-tracker
npx create-expo-app@latest . --template default
```

(The default template ships TypeScript + Expo Router. `.` works because the repo only contains `docs/` and `.git`; if it refuses, scaffold into a temp dir and move contents in.)

- [ ] **Step 2: Reset template to blank state**

Run the template's reset script if present (`npm run reset-project` — answer "delete"), or manually delete example tab screens so `app/` contains only `_layout.tsx` and `index.tsx` with minimal content:

`app/_layout.tsx`:
```tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

`app/index.tsx`:
```tsx
import { Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Newborn Tracker</Text>
    </View>
  );
}
```

- [ ] **Step 3: Enable strict TypeScript and add typecheck script**

In `tsconfig.json` ensure `"strict": true` under `compilerOptions`. In `package.json` scripts add:

```json
"typecheck": "tsc --noEmit"
```

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: exits 0, no errors.

Run: `npx expo export --platform android`
Expected: bundle succeeds, output in `dist/`. Add `dist/` to `.gitignore` if not present.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo app with TypeScript and Expo Router"
```

### Task 2: Lint/format tooling

**Files:**
- Create: `eslint.config.js` (template may already ship one), `.prettierrc`
- Modify: `package.json` (scripts, devDependencies)

**Interfaces:**
- Produces: `npm run lint` and `npm run format` scripts that pass on the codebase.

- [ ] **Step 1: Install**

```bash
npx expo lint   # sets up eslint-config-expo + eslint.config.js if missing
npm install -D prettier eslint-config-prettier
```

- [ ] **Step 2: Configure**

Append prettier compat to `eslint.config.js` exports (flat config):

```js
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([expoConfig, prettierConfig, { ignores: ['dist/*'] }]);
```

`.prettierrc`:
```json
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

`package.json` scripts:
```json
"lint": "expo lint",
"format": "prettier --write ."
```

- [ ] **Step 3: Verify**

Run: `npm run format && npm run lint && npm run typecheck`
Expected: all exit 0.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "chore: add eslint + prettier tooling"
```

### Task 3: Supabase client + React Query wiring

**Files:**
- Create: `src/lib/supabase.ts`, `src/lib/queryClient.ts`, `.env.example`
- Modify: `app/_layout.tsx`, `.gitignore`

**Interfaces:**
- Produces: `supabase` (SupabaseClient) exported from `src/lib/supabase.ts`; `queryClient` (QueryClient) from `src/lib/queryClient.ts`; root layout wraps app in `QueryClientProvider`.

- [ ] **Step 1: Install**

```bash
npx expo install @react-native-async-storage/async-storage
npm install @supabase/supabase-js @tanstack/react-query
```

- [ ] **Step 2: Create env files**

`.env.example`:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Copy to `.env` (placeholder values fine until Supabase project exists). Ensure `.gitignore` contains `.env`.

- [ ] **Step 3: Supabase client**

`src/lib/supabase.ts`:
```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY. Copy .env.example to .env and fill it in.',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 4: Query client + provider**

`src/lib/queryClient.ts`:
```ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient();
```

`app/_layout.tsx`:
```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';

import { queryClient } from '../src/lib/queryClient';

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack />
    </QueryClientProvider>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npx expo export --platform android`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add supabase client and react-query provider"
```

### Task 4: Auth — session hook, login screen, auth gate, home

**Files:**
- Create: `src/features/auth/useSession.ts`, `app/login.tsx`
- Modify: `app/_layout.tsx`, `app/index.tsx`

**Interfaces:**
- Consumes: `supabase` from `src/lib/supabase.ts`.
- Produces: `useSession(): { session: Session | null; isLoading: boolean }`; `/login` route; root layout redirects unauthenticated users to `/login` and authenticated users away from it.

- [ ] **Step 1: Session hook**

`src/features/auth/useSession.ts`:
```ts
import type { Session } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return { session, isLoading };
}
```

- [ ] **Step 2: Auth gate in root layout**

`app/_layout.tsx`:
```tsx
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '../src/features/auth/useSession';
import { queryClient } from '../src/lib/queryClient';

function AuthGate() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="index" options={{ title: 'Newborn Tracker' }} />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="login" options={{ title: 'Log in' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}
```

(`Stack.Protected` requires Expo Router v5+/SDK 53+. If the installed version lacks it, use a `useEffect` + `router.replace` redirect in the layout instead.)

- [ ] **Step 3: Login screen**

`app/login.tsx`:
```tsx
import { useState } from 'react';
import { ActivityIndicator, Button, StyleSheet, Text, TextInput, View } from 'react-native';

import { supabase } from '../src/lib/supabase';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function signIn() {
    setIsSubmitting(true);
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) setError(signInError.message);
    setIsSubmitting(false);
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {isSubmitting ? <ActivityIndicator /> : <Button title="Log in" onPress={signIn} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12 },
  error: { color: 'red' },
});
```

- [ ] **Step 4: Home screen with email + sign out**

`app/index.tsx`:
```tsx
import { Button, Text, View } from 'react-native';

import { useSession } from '../src/features/auth/useSession';
import { supabase } from '../src/lib/supabase';

export default function Home() {
  const { session } = useSession();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text>hello {session?.user.email}</Text>
      <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}
```

- [ ] **Step 5: Verify**

Run: `npm run typecheck && npm run lint && npx expo export --platform android`
Expected: all pass. (Live login requires a real Supabase project — manual step, see Task 5 README.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add login screen with supabase auth gate"
```

### Task 5: EAS build config, migrations dir, README

**Files:**
- Create: `eas.json`, `supabase/migrations/.gitkeep`, `README.md`

**Interfaces:**
- Produces: `eas build -p android --profile preview` yields an installable APK; README documents all manual Supabase steps.

- [ ] **Step 1: eas.json**

```json
{
  "cli": {
    "appVersionSource": "remote"
  },
  "build": {
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

- [ ] **Step 2: migrations dir**

```bash
mkdir -p supabase/migrations && touch supabase/migrations/.gitkeep
```

- [ ] **Step 3: README.md**

Write a README covering: what the app is, stack summary, local dev (`npm install`, `.env` setup, `npx expo start`), the four manual Supabase steps from the spec (create project, fill `.env`, disable signups, create two users), and APK builds (`npx eas build -p android --profile preview`, requires free Expo account; note EXPO_PUBLIC_ env vars are baked in at build time so `.env` must be filled before building).

- [ ] **Step 4: Verify + commit**

Run: `npm run lint && npm run typecheck`
Expected: pass.

```bash
git add -A
git commit -m "chore: add EAS build config, migrations dir, and README"
```

## Self-Review Notes

- Spec coverage: structure ✓ (Tasks 1,3,4,5), auth ✓ (Task 4), tooling ✓ (Tasks 2,5), env handling ✓ (Task 3), migrations dir ✓ (Task 5), manual Supabase steps documented ✓ (Task 5). `src/components/` intentionally not created — empty dirs add nothing (YAGNI); first shared component creates it.
- Deviation from spec: AsyncStorage instead of expo-secure-store (2048-byte limit). Spec updated to match.
- No automated tests: foundation has no logic beyond glue; test infra deferred per spec.
