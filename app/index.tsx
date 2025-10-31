import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@clerk/clerk-expo';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useEffect } from 'react';

export default function Index() {
  const { hasCompletedOnboarding, isLoading: userLoading, isDarkMode, isNewUser, profile } = useUser();
  const { isSignedIn, isLoaded } = useAuth();
  const colors = isDarkMode ? darkColors : lightColors;

  useEffect(() => {
    console.log('[Index] Render state:', {
      isLoaded,
      userLoading,
      isSignedIn,
      hasCompletedOnboarding,
      isNewUser,
      causeCount: profile.causes.length,
    });
  }, [isLoaded, userLoading, isSignedIn, hasCompletedOnboarding, isNewUser, profile.causes.length]);

  useEffect(() => {
    if (isSignedIn && !userLoading && profile.causes.length > 0 && !hasCompletedOnboarding) {
      console.log('[Index] Detected mismatch: has causes but hasCompletedOnboarding is false');
    }
  }, [isSignedIn, userLoading, profile.causes.length, hasCompletedOnboarding]);

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
    console.log('[Index] User has completed onboarding, redirecting to home');
    return <Redirect href="/(tabs)/home" />;
  }

  if (isNewUser === true) {
    // Check if account type has been selected
    if (!profile.accountType) {
      console.log('[Index] New user without account type, redirecting to account type selection');
      return <Redirect href="/account-type" />;
    }

    // Check if business user has set business info
    if (profile.accountType === 'business' && !profile.businessInfo) {
      console.log('[Index] New business user without business info, redirecting to business setup');
      return <Redirect href="/business-setup" />;
    }

    console.log('[Index] New user without onboarding, redirecting to onboarding');
    return <Redirect href="/onboarding" />;
  }

  console.log('[Index] Existing user without values, redirecting to home');
  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
