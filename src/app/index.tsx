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
          <Text>{ageInDays(baby.birth_date, new Date().toISOString().slice(0, 10))} days old</Text>
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
