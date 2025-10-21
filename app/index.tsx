import { Redirect } from 'expo-router';
import { useUser } from '@/contexts/UserContext';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';

export default function Index() {
  const { hasCompletedOnboarding, isLoading, isDarkMode, isSignedIn } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }

  if (hasCompletedOnboarding) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
