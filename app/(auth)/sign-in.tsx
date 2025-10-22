import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import React from 'react';
import { darkColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const { clearAllStoredData } = useUser();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authLoaded && isSignedIn) {
      console.log('[Sign In] Already signed in, redirecting to home');
      router.replace('/');
    }
  }, [authLoaded, isSignedIn, router]);

  const onSignInPress = async () => {
    if (!isLoaded || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId });
        console.log('[Sign In] Email sign-in successful, redirecting to index');
        router.replace('/');
      } else {
        console.error('[Sign In] Incomplete:', JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err: any) {
      console.error('[Sign In] Error:', JSON.stringify(err, null, 2));
      if (err?.errors?.[0]?.code === 'session_exists') {
        console.log('[Sign In] Session exists, redirecting to home');
        router.replace('/');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearData = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Clear All Local Data?\n\n' +
        'This will remove all locally stored user data including:\n' +
        '- User profiles\n' +
        '- Selected values\n' +
        '- Search history\n' +
        '- App settings\n\n' +
        'This is useful if you\'ve deleted users from Clerk and want to sync the local data.'
      );
      if (confirmed) {
        clearAllStoredData();
        window.alert('All local data has been cleared!');
      }
    } else {
      Alert.alert(
        'Clear All Local Data?',
        'This will remove all locally stored user data including:\n\n' +
        '• User profiles\n' +
        '• Selected values\n' +
        '• Search history\n' +
        '• App settings\n\n' +
        'This is useful if you\'ve deleted users from Clerk and want to sync the local data.',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Clear Data',
            style: 'destructive',
            onPress: async () => {
              await clearAllStoredData();
              Alert.alert('Success', 'All local data has been cleared!');
            },
          },
        ]
      );
    }
  };





  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoContainer}>
            <Image 
              source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/vm8mawdqlu8xi5ltc0lcb' }} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your account</Text>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter your email"
              placeholderTextColor={darkColors.textSecondary}
              onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
              style={styles.input}
              keyboardType="email-address"
            />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              placeholder="Enter your password"
              placeholderTextColor={darkColors.textSecondary}
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
              style={styles.input}
            />
          </View>
          <TouchableOpacity onPress={onSignInPress} style={styles.button} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.link}>Sign up</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity onPress={handleClearData} style={styles.clearDataButton}>
            <Text style={styles.clearDataText}>Clear All Local Data</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    width: 180,
    height: 180,
    tintColor: undefined,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: darkColors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: darkColors.textSecondary,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: darkColors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: darkColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: darkColors.text,
  },
  button: {
    backgroundColor: darkColors.primary,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  linkText: {
    color: darkColors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: darkColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  clearDataButton: {
    marginTop: 32,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  clearDataText: {
    color: '#EF4444',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
});
