import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { FormField } from '@/components/FormField';
import { IconChip } from '@/components/IconChip';
import { PillButton } from '@/components/PillButton';
import { RowAttribution } from '@/components/RowAttribution';
import { Screen } from '@/components/Screen';
import { SegmentedControl } from '@/components/SegmentedControl';
import { useBaby } from '@/features/baby/hooks';
import { useNowTick } from '@/features/feeding/useNowTick';
import { useProfileMap } from '@/features/profiles/hooks';
import { useDoses, useLogDose, useLogTemperature, useTemperatures } from '@/features/sick/hooks';
import { doseSummary, tempInfo } from '@/features/sick/sickMath';
import type { MedicineDose, Temperature } from '@/features/sick/types';
import { relativeTime, timeHHmm } from '@/lib/dates';
import { colors, fontFamily, fontSize, radius, spacing, trackerColors } from '@/lib/theme';

type Segment = 'Temperature' | 'Medicine';

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function parseDecimal(text: string): number | null {
  const normalized = text.replace(',', '.').trim();
  if (normalized === '') return null;
  const value = Number(normalized);
  return Number.isFinite(value) ? value : null;
}

function nowDatetimeLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function rowDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function TemperatureRow({ item, now }: { item: Temperature; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);
  const info = tempInfo(item.celsius);

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/sick/temperature/${item.id}`)}>
      <IconChip
        icon={trackerColors.temperature.icon}
        accent={trackerColors.temperature.accent}
        tint={trackerColors.temperature.tint}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowValue}>
          <Text style={{ color: info.color }}>{item.celsius.toFixed(1)} °C</Text>
          <Text style={[styles.rowStatus, { color: info.color }]}> {info.label}</Text>
        </Text>
        <Text style={styles.rowDatetime}>
          {timeHHmm(item.measured_at)} · {rowDate(item.measured_at)}
        </Text>
      </View>
      <RowAttribution
        note={item.note}
        timeLabel={relativeTime(item.measured_at, now)}
        profile={profile}
      />
    </Pressable>
  );
}

function DoseRow({ item, now }: { item: MedicineDose; now: number }) {
  const { data: profileMap } = useProfileMap();
  const profile = profileMap?.get(item.created_by);

  return (
    <Pressable style={styles.row} onPress={() => router.push(`/sick/medicine/${item.id}`)}>
      <IconChip
        icon={trackerColors.temperature.icon}
        accent={trackerColors.temperature.accent}
        tint={trackerColors.temperature.tint}
      />
      <View style={styles.rowBody}>
        <Text style={styles.rowValue}>{doseSummary(item)}</Text>
        <Text style={styles.rowDatetime}>
          {timeHHmm(item.given_at)} · {rowDate(item.given_at)}
        </Text>
      </View>
      <RowAttribution
        note={item.note}
        timeLabel={relativeTime(item.given_at, now)}
        profile={profile}
      />
    </Pressable>
  );
}

function TemperatureForm({ babyId }: { babyId: string | undefined }) {
  const logTemperature = useLogTemperature();
  const [celsiusText, setCelsiusText] = useState('');
  const [datetime, setDatetime] = useState(nowDatetimeLocal);
  const [note, setNote] = useState('');

  const celsius = parseDecimal(celsiusText);
  const datetimeValid = DATETIME_RE.test(datetime) && !Number.isNaN(new Date(datetime).getTime());
  const valid = !!babyId && celsius !== null && celsius >= 30 && celsius <= 43 && datetimeValid;

  function save() {
    if (!valid || celsius === null) return;
    logTemperature.mutate(
      {
        baby_id: babyId!,
        measured_at: new Date(datetime).toISOString(),
        celsius,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setCelsiusText('');
          setDatetime(nowDatetimeLocal());
          setNote('');
        },
      },
    );
  }

  return (
    <Card>
      <FormField
        label="Temperature (°C)"
        value={celsiusText}
        onChangeText={setCelsiusText}
        keyboardType="decimal-pad"
        placeholder="37.5"
      />
      <FormField
        label="Measured at (YYYY-MM-DDTHH:mm)"
        value={datetime}
        onChangeText={setDatetime}
      />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {logTemperature.isError ? (
        <Text style={styles.error}>{logTemperature.error.message}</Text>
      ) : null}
      <PillButton
        title="Log temperature"
        icon="thermometer"
        disabled={!valid || logTemperature.isPending}
        onPress={save}
      />
    </Card>
  );
}

function LastDoseBanner({
  latestDose,
  now,
}: {
  latestDose: MedicineDose | undefined;
  now: number;
}) {
  return (
    <Card>
      <View style={styles.bannerRow}>
        <IconChip
          icon={trackerColors.temperature.icon}
          accent={trackerColors.temperature.accent}
          tint={trackerColors.temperature.tint}
          size={32}
        />
        <Text style={styles.bannerText}>
          {latestDose
            ? `Last ${latestDose.medicine} · ${relativeTime(latestDose.given_at, now)}`
            : 'No doses logged'}
        </Text>
      </View>
    </Card>
  );
}

function DoseForm({ babyId }: { babyId: string | undefined }) {
  const logDose = useLogDose();
  const [amountText, setAmountText] = useState('');
  const [unit, setUnit] = useState<'ml' | 'mg'>('ml');
  const [medicine, setMedicine] = useState('paracetamol');
  const [datetime, setDatetime] = useState(nowDatetimeLocal);
  const [note, setNote] = useState('');

  const amount = parseDecimal(amountText);
  const datetimeValid = DATETIME_RE.test(datetime) && !Number.isNaN(new Date(datetime).getTime());
  const valid = !!babyId && amount !== null && amount > 0 && !!medicine.trim() && datetimeValid;

  function save() {
    if (!valid || amount === null) return;
    logDose.mutate(
      {
        baby_id: babyId!,
        given_at: new Date(datetime).toISOString(),
        medicine: medicine.trim(),
        amount,
        unit,
        note: note.trim() || null,
      },
      {
        onSuccess: () => {
          setAmountText('');
          setDatetime(nowDatetimeLocal());
          setNote('');
        },
      },
    );
  }

  return (
    <Card>
      <FormField
        label="Amount"
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        placeholder="2.5"
      />
      <SegmentedControl
        options={['ml', 'mg']}
        selected={unit}
        onSelect={(o) => setUnit(o as 'ml' | 'mg')}
      />
      <FormField label="Medicine" value={medicine} onChangeText={setMedicine} />
      <FormField label="Given at (YYYY-MM-DDTHH:mm)" value={datetime} onChangeText={setDatetime} />
      <FormField label="Note" value={note} onChangeText={setNote} />
      {logDose.isError ? <Text style={styles.error}>{logDose.error.message}</Text> : null}
      <PillButton
        title="Log dose"
        icon="medkit"
        disabled={!valid || logDose.isPending}
        onPress={save}
      />
    </Card>
  );
}

export default function SickScreen() {
  const { data: baby } = useBaby();
  const { data: temperatures } = useTemperatures(baby?.id);
  const { data: doses } = useDoses(baby?.id);
  const now = useNowTick(false);
  const [segment, setSegment] = useState<Segment>('Temperature');

  const latestDose = doses?.[0];

  return (
    <Screen scroll={false} topInset>
      <View style={styles.titleRow}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </Pressable>
        <Text style={styles.heading}>Sick</Text>
      </View>
      {segment === 'Temperature' ? (
        <FlatList
          style={styles.list}
          data={temperatures ?? []}
          keyExtractor={(t) => t.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <SegmentedControl
                options={['Temperature', 'Medicine']}
                selected={segment}
                onSelect={(option) => setSegment(option as Segment)}
              />
              <TemperatureForm babyId={baby?.id} />
              <Text style={styles.sectionLabel}>RECENT TEMPERATURES</Text>
            </View>
          }
          renderItem={({ item }) => <TemperatureRow item={item} now={now} />}
          ListEmptyComponent={<Text style={styles.empty}>No temperatures yet</Text>}
        />
      ) : (
        <FlatList
          style={styles.list}
          data={doses ?? []}
          keyExtractor={(d) => d.id}
          ListHeaderComponent={
            <View style={styles.header}>
              <SegmentedControl
                options={['Temperature', 'Medicine']}
                selected={segment}
                onSelect={(option) => setSegment(option as Segment)}
              />
              <LastDoseBanner latestDose={latestDose} now={now} />
              <DoseForm babyId={baby?.id} />
              <Text style={styles.sectionLabel}>RECENT DOSES</Text>
            </View>
          }
          renderItem={({ item }) => <DoseRow item={item} now={now} />}
          ListEmptyComponent={<Text style={styles.empty}>No doses yet</Text>}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#221f1b',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  heading: { fontSize: fontSize.xl, fontFamily: fontFamily.bold, color: colors.text },
  header: { marginBottom: spacing.sm, gap: spacing.md },
  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  bannerText: { fontFamily: fontFamily.semibold, fontSize: fontSize.md, color: colors.text },
  sectionLabel: {
    color: colors.muted,
    fontFamily: fontFamily.semibold,
    fontSize: fontSize.sm,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm + spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowBody: { flex: 1, gap: 2 },
  rowValue: { fontFamily: fontFamily.bold, fontSize: fontSize.md, color: colors.text },
  rowStatus: { fontFamily: fontFamily.semibold, fontSize: fontSize.sm },
  rowDatetime: { color: colors.mutedDark, fontFamily: fontFamily.regular, fontSize: fontSize.sm },
  empty: { textAlign: 'center', color: colors.muted, marginTop: 24 },
  error: { color: colors.danger, fontSize: fontSize.sm },
});
