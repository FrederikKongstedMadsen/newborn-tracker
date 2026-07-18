import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useBaby, useSaveBaby } from '@/features/baby/hooks';
import { colors, fontFamily, fontSize, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SEX_OPTIONS = ['Boy', 'Girl'] as const;

function sexToOption(sex: 'male' | 'female'): 'Boy' | 'Girl' {
  return sex === 'male' ? 'Boy' : 'Girl';
}

function optionToSex(option: string): 'male' | 'female' {
  return option === 'Boy' ? 'male' : 'female';
}

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
      <Text style={styles.heading}>Baby profile</Text>
      <FormField label="Name" value={name} onChangeText={setName} />
      <View style={styles.sexRow}>
        <SegmentedControl
          options={[...SEX_OPTIONS]}
          selected={sexToOption(sex)}
          onSelect={(option) => setSex(optionToSex(option))}
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
      {saveBaby.isSuccess ? <Text style={styles.saved}>Saved</Text> : null}
      <PillButton
        title="Save"
        disabled={!valid || saveBaby.isPending}
        onPress={() =>
          saveBaby.mutate({ id: baby?.id, name: name.trim(), sex, birth_date: birthDate })
        }
      />
      <View style={styles.signOut}>
        <PillButton title="Sign out" variant="danger" onPress={() => supabase.auth.signOut()} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  sexRow: { flexDirection: 'row' },
  error: { color: colors.danger, fontSize: fontSize.sm },
  saved: { color: colors.primary, fontSize: fontSize.sm },
  signOut: { marginTop: spacing.xl },
});
