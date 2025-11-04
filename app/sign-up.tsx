// This file redirects to the correct sign-up page in the (auth) route group
// The OAuth buttons (Google, Apple, Facebook) have been removed.
// Only email/password sign-up is supported through the (auth)/sign-up route.

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function SignUpRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct sign-up page
    router.replace('/(auth)/sign-up');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
