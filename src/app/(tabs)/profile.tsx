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
