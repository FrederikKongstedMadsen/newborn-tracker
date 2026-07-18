import { Button, Text, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const { session } = useSession();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text>hello {session?.user.email}</Text>
      <Button title="Sign out" onPress={() => supabase.auth.signOut()} />
    </View>
  );
}
