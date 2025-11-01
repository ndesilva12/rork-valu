// NOTE: if your current sign-up file is different, use the same pattern below.
// This file follows the same conventions as sign-in: centered column + OAuth mount guard.

import { useSignUp } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';

export default function SignUpScreen() {
  const { signUp, isLoaded } = useSignUp();
  const router = useRouter();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Mount guard for client-only providers / to avoid hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSignUp = async () => {
    if (!isLoaded) return;
    setIsLoading(true);
    setError('');
    try {
      const res = await signUp.create({
        identifier: email,
        password,
      });
      if (res.status === 'complete') {
        // Redirect to consent page before onboarding
        router.replace('/consent');
      } else {
        setError('Sign-up incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('Sign-up error', err);
      setError(err.errors?.[0]?.message || 'Sign up error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Centering wrapper */}
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768 }}>
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/ohh0oqrvnuowj1apebwt9' }}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Create an account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Sign up to get started
            </Text>

            {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

            {/* Example of optionally showing OAuth signups only after client mount. */}
            {mounted && (
              <View style={{ marginBottom: 16 }}>
                {/* If you offer OAuth sign-up you can add buttons here similar to sign-in */}
              </View>
            )}

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}><Mail size={20} color={colors.textSecondary} /></View>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  placeholder="Email"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoComplete="email"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <View style={styles.inputIconContainer}><Lock size={20} color={colors.textSecondary} /></View>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
                  placeholder="Password"
                  placeholderTextColor={colors.textSecondary}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="password-new"
                  editable={!isLoading}
                />
                <TouchableOpacity style={styles.passwordToggle} onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff size={20} color={colors.textSecondary} /> : <Eye size={20} color={colors.textSecondary} />}
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[styles.signUpButton, { backgroundColor: colors.primary }]} onPress={handleSignUp} disabled={isLoading || !email || !password}>
                {isLoading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.signUpButtonText, { color: colors.white }]}>Sign Up</Text>}
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 12 }}>
              <Text style={{ color: colors.textSecondary }}>Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/sign-in')}>
                <Text style={{ color: colors.primary, fontWeight: '600' }}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 24 },
  logoContainer: { width: 200, height: 80, alignSelf: 'center', marginBottom: 32 },
  logo: { width: '100%', height: '100%' },
  title: { fontSize: 28, fontWeight: '700' as const, marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  form: { gap: 16, marginBottom: 24 },
  inputContainer: { position: 'relative' as const },
  inputIconContainer: { position: 'absolute' as const, left: 16, top: 16, zIndex: 1 },
  input: { paddingVertical: 16, paddingLeft: 48, paddingRight: 48, borderRadius: 12, borderWidth: 1, fontSize: 16 },
  passwordToggle: { position: 'absolute' as const, right: 16, top: 16, zIndex: 1 },
  signUpButton: { paddingVertical: 16, borderRadius: 12, alignItems: 'center' },
  signUpButtonText: { fontSize: 17, fontWeight: '600' as const },
});
