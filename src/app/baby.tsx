import { router } from 'expo-router';
import { useState } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

import { useBaby, useSaveBaby } from '@/features/baby/hooks';
import { FormField } from '@/components/FormField';
import type { Baby } from '@/features/baby/types';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export default function BabyProfile() {
  const { data: baby } = useBaby();
  const saveBaby = useSaveBaby();
  const [name, setName] = useState('');
  const [sex, setSex] = useState<'male' | 'female'>('male');
  const [birthDate, setBirthDate] = useState('');

  // Sync form fields from the loaded baby whenever it changes, without a useEffect
  // (React docs: "Adjusting some state when a prop changes").
  const [prevBaby, setPrevBaby] = useState<Baby | null | undefined>(undefined);
  if (baby !== prevBaby) {
    setPrevBaby(baby);
    if (baby) {
      setName(baby.name);
      setSex(baby.sex);
      setBirthDate(baby.birth_date);
    }
  }

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
      <Button title="Save" disabled={!valid || saveBaby.isPending} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 16 },
  sexRow: { flexDirection: 'row', gap: 12, justifyContent: 'center' },
  error: { color: 'red' },
});
