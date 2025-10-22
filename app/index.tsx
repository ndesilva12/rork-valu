import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useEffect } from 'react';

export default function Index() {
  const { hasCompletedOnboarding, isLoading: userLoading, isDarkMode } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const colors = isDarkMode ? darkColors : lightColors;

  useEffect(() => {
    console.log('[Index] Render state:', {
      isLoaded,
      userLoading,
      isSignedIn,
      hasCompletedOnboarding,
    });
  }, [isLoaded, userLoading, isSignedIn, hasCompletedOnboarding]);

  if (!isLoaded || userLoading) {
    console.log('[Index] Showing loading state');
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  if (!isSignedIn) {
    console.log('[Index] Redirecting to sign-in');
    return <Redirect href="/(auth)/sign-in" />;
  }

  if (hasCompletedOnboarding) {
    console.log('[Index] Redirecting to home');
    return <Redirect href="/(tabs)/home" />;
  }

  console.log('[Index] Redirecting to onboarding');
  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
