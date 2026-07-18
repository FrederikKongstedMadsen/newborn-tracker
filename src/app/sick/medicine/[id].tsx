import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';

import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useBaby } from '@/features/baby/hooks';
import { useDeleteDose, useDoses, useUpdateDose } from '@/features/sick/hooks';
import type { MedicineDose } from '@/features/sick/types';
import { colors, fontSize } from '@/lib/theme';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

export default function EditDose() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: baby } = useBaby();
  const { data: doses } = useDoses(baby?.id);
  const dose = doses?.find((d) => d.id === id);
  const updateDose = useUpdateDose();
  const deleteDose = useDeleteDose();

  const [givenAt, setGivenAt] = useState('');
  const [amountText, setAmountText] = useState('');
  const [unit, setUnit] = useState<'ml' | 'mg'>('ml');
  const [medicine, setMedicine] = useState('');
  const [note, setNote] = useState('');

  // Remember prefilled values so save() only sends fields the user actually
  // edited, vs. re-sending a redundant/rounded value on every note-only edit.
  const [prefilledGivenAt, setPrefilledGivenAt] = useState('');
  const [prefilledAmount, setPrefilledAmount] = useState('');
  const [prefilledUnit, setPrefilledUnit] = useState<'ml' | 'mg'>('ml');
  const [prefilledMedicine, setPrefilledMedicine] = useState('');

  // Sync form fields from the loaded dose whenever it changes, without a
  // useEffect (React docs: "Adjusting some state when a prop changes").
  const [prevDose, setPrevDose] = useState<MedicineDose | undefined>(undefined);
  if (dose !== prevDose) {
    setPrevDose(dose);
    if (dose) {
      const nextGivenAt = toDatetimeLocal(dose.given_at);
      const nextAmount = String(dose.amount);
      setGivenAt(nextGivenAt);
      setAmountText(nextAmount);
      setUnit(dose.unit);
      setMedicine(dose.medicine);
      setNote(dose.note ?? '');
      setPrefilledGivenAt(nextGivenAt);
      setPrefilledAmount(nextAmount);
      setPrefilledUnit(dose.unit);
      setPrefilledMedicine(dose.medicine);
    }
  }

  const amount = parseDecimal(amountText);
  const givenAtValid = DATETIME_RE.test(givenAt) && !Number.isNaN(new Date(givenAt).getTime());
  const valid = !!dose && givenAtValid && amount !== null && amount > 0 && !!medicine.trim();

  function save() {
    if (!dose || !valid || amount === null) return;
    const givenAtChanged = givenAt !== prefilledGivenAt;
    const amountChanged = amountText !== prefilledAmount;
    const unitChanged = unit !== prefilledUnit;
    const medicineChanged = medicine.trim() !== prefilledMedicine;
    updateDose.mutate(
      {
        id: dose.id,
        ...(givenAtChanged ? { given_at: new Date(givenAt).toISOString() } : {}),
        ...(amountChanged ? { amount } : {}),
        ...(unitChanged ? { unit } : {}),
        ...(medicineChanged ? { medicine: medicine.trim() } : {}),
        note: note.trim() || null,
      },
      { onSuccess: () => router.back() },
    );
  }

  function confirmDelete() {
    if (!dose) return;
    Alert.alert('Delete dose?', undefined, [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteDose.mutate(dose.id, { onSuccess: () => router.back() }),
      },
    ]);
  }

  return (
    <Screen>
      <FormField label="Given at (YYYY-MM-DDTHH:mm)" value={givenAt} onChangeText={setGivenAt} />
      <FormField
        label="Amount"
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
      />
      <SegmentedControl
        options={['ml', 'mg']}
        selected={unit}
        onSelect={(o) => setUnit(o as 'ml' | 'mg')}
      />
      <FormField label="Medicine" value={medicine} onChangeText={setMedicine} />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {updateDose.isError ? <Text style={styles.error}>{updateDose.error.message}</Text> : null}
      {deleteDose.isError ? <Text style={styles.error}>{deleteDose.error.message}</Text> : null}
      <PillButton title="Save" disabled={!valid || updateDose.isPending} onPress={save} />
      <PillButton
        title="Delete"
        variant="danger"
        disabled={!dose || deleteDose.isPending}
        onPress={confirmDelete}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: fontSize.sm },
});
