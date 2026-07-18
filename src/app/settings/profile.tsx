import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { FormField } from '@/components/FormField';
import { PillButton } from '@/components/PillButton';
import { Screen } from '@/components/Screen';
import { useMyProfile, useSaveMyProfile } from '@/features/profiles/hooks';
import { colors, fontSize, spacing } from '@/lib/theme';
import { supabase } from '@/lib/supabase';

const COLOR_OPTIONS = ['#5a60c6', '#c07a45', '#3a8a6f', '#3f76c2', '#cf6257', '#c9922e'];

export default function MyProfile() {
  const { data: myProfile } = useMyProfile();
  const saveProfile = useSaveMyProfile();

  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[0]);
  const [emoji, setEmoji] = useState('');
  const [email, setEmail] = useState('');
  const [initialEmail, setInitialEmail] = useState('');
  const [emailUpdateSent, setEmailUpdateSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Render-time sync: prefill form when the profile row first arrives (React docs:
  // "adjusting state when a prop changes").
  const [prevProfile, setPrevProfile] = useState(myProfile);
  if (myProfile !== prevProfile) {
    setPrevProfile(myProfile);
    if (myProfile) {
      setDisplayName(myProfile.display_name);
      setColor(myProfile.color);
      setEmoji(myProfile.emoji ?? '');
    }
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const currentEmail = data.user?.email ?? '';
      setEmail(currentEmail);
      setInitialEmail(currentEmail);
    });
  }, []);

  const valid = displayName.trim().length > 0;
  const previewProfile = {
    id: myProfile?.id ?? '',
    display_name: displayName || '?',
    color,
    emoji: emoji || null,
  };

  const handleSave = async () => {
    setEmailError(null);
    setEmailUpdateSent(false);
    await saveProfile.mutateAsync({
      display_name: displayName.trim(),
      color,
      emoji: emoji.trim() || null,
    });

    const trimmedEmail = email.trim();
    if (trimmedEmail && trimmedEmail !== initialEmail) {
      const { error } = await supabase.auth.updateUser({ email: trimmedEmail });
      if (error) {
        setEmailError(error.message);
      } else {
        setEmailUpdateSent(true);
      }
    }
  };

  return (
    <Screen topInset={false}>
      <View style={styles.previewRow}>
        <Avatar profile={previewProfile} size={96} />
      </View>
      <FormField label="Display name" value={displayName} onChangeText={setDisplayName} />
      <View style={styles.colorRow}>
        {COLOR_OPTIONS.map((option) => (
          <Pressable
            key={option}
            onPress={() => setColor(option)}
            style={[
              styles.swatch,
              { backgroundColor: option },
              color === option && styles.swatchSelected,
            ]}
          />
        ))}
      </View>
      <FormField
        label="Emoji (optional)"
        value={emoji}
        onChangeText={setEmoji}
        maxLength={2}
        placeholder="🙂"
      />
      <FormField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {emailUpdateSent ? (
        <Text style={styles.info}>
          Confirmation links sent to your old and new email — the change applies after confirming.
        </Text>
      ) : null}
      {saveProfile.isError ? <Text style={styles.error}>{saveProfile.error.message}</Text> : null}
      {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
      {saveProfile.isSuccess ? <Text style={styles.saved}>Saved</Text> : null}
      <PillButton title="Save" disabled={!valid || saveProfile.isPending} onPress={handleSave} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  previewRow: { alignItems: 'center', marginBottom: spacing.md },
  colorRow: { flexDirection: 'row', gap: spacing.sm },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  swatchSelected: { borderColor: colors.text },
  info: { color: colors.mutedDark, fontSize: fontSize.sm },
  error: { color: colors.danger, fontSize: fontSize.sm },
  saved: { color: colors.primary, fontSize: fontSize.sm },
});
