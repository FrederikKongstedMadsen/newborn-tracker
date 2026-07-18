import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  useFonts,
} from '@expo-google-fonts/plus-jakarta-sans';
import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSession } from '@/features/auth/useSession';
import { queryClient } from '@/lib/queryClient';

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
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="growth/index" options={{ title: 'Growth' }} />
        <Stack.Screen name="growth/new" options={{ title: 'Add measurement' }} />
        <Stack.Screen name="growth/[id]" options={{ title: 'Edit measurement' }} />
        <Stack.Screen name="feeding/index" options={{ title: 'Feeding' }} />
        <Stack.Screen name="feeding/[id]" options={{ title: 'Edit feed' }} />
        <Stack.Screen name="sleep/index" options={{ title: 'Sleep' }} />
        <Stack.Screen name="sleep/[id]" options={{ title: 'Edit sleep' }} />
        <Stack.Screen name="diaper/index" options={{ title: 'Diaper' }} />
        <Stack.Screen name="diaper/[id]" options={{ title: 'Edit diaper' }} />
      </Stack.Protected>
      <Stack.Protected guard={session === null}>
        <Stack.Screen name="login" options={{ title: 'Log in' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthGate />
    </QueryClientProvider>
  );
}
