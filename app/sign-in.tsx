// This file redirects to the correct sign-in page in the (auth) route group
// The OAuth buttons (Google, Apple, Facebook) have been removed.
// Only email/password sign-in is supported through the (auth)/sign-in route.

import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';

export default function SignInRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the correct sign-in page
    router.replace('/(auth)/sign-in');
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
