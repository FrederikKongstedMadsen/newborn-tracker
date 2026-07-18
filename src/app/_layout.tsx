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
import { colors, fontFamily } from '@/lib/theme';

function AuthGate() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTitleStyle: { fontFamily: fontFamily.bold, color: colors.text },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Protected guard={session !== null}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="growth/index" options={{ headerShown: false }} />
        <Stack.Screen name="growth/new" options={{ title: 'Add measurement' }} />
        <Stack.Screen name="growth/[id]" options={{ title: 'Edit measurement' }} />
        <Stack.Screen name="feeding/index" options={{ headerShown: false }} />
        <Stack.Screen name="feeding/[id]" options={{ title: 'Edit feed' }} />
        <Stack.Screen name="sleep/index" options={{ headerShown: false }} />
        <Stack.Screen name="sleep/[id]" options={{ title: 'Edit sleep' }} />
        <Stack.Screen name="diaper/index" options={{ headerShown: false }} />
        <Stack.Screen name="diaper/[id]" options={{ title: 'Edit diaper' }} />
        <Stack.Screen name="sick/index" options={{ headerShown: false }} />
        <Stack.Screen name="sick/temperature/[id]" options={{ title: 'Edit temperature' }} />
        <Stack.Screen name="sick/medicine/[id]" options={{ title: 'Edit dose' }} />
        <Stack.Screen name="notes/index" options={{ headerShown: false }} />
        <Stack.Screen name="notes/[id]" options={{ title: 'Edit note' }} />
        <Stack.Screen name="settings/baby" options={{ title: 'Baby profile' }} />
        <Stack.Screen name="settings/profile" options={{ title: 'My profile' }} />
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
