import { useSignIn, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import React from 'react';
import { darkColors, lightColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '@/contexts/UserContext';
export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState('');
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [resetCode, setResetCode] = React.useState('');
  const [newPassword, setNewPassword] = React.useState('');
  const [resetStep, setResetStep] = React.useState<'email' | 'code' | 'password'>('email');

  React.useEffect(() => {
    if (authLoaded && isSignedIn) {
      console.log('[Sign In] Already signed in, redirecting to home');
      router.replace('/');
    }
  }, [authLoaded, isSignedIn, router]);

  const onSignInPress = async () => {
    if (!isLoaded || isSubmitting) return;

    if (!emailAddress || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    setError('');
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
        setError('Sign in incomplete. Please try again.');
      }
    } catch (err: any) {
      console.error('[Sign In] Error:', JSON.stringify(err, null, 2));
      
      if (err?.errors?.[0]?.code === 'session_exists') {
        console.log('[Sign In] Session exists, redirecting to home');
        router.replace('/');
        return;
      }
      
      if (err?.errors?.[0]?.code === 'form_identifier_not_found') {
        setError("Account not found. Please check your email or sign up to create a new account.");
        return;
      }
      
      if (err?.errors?.[0]?.code === 'form_password_incorrect') {
        setError('Incorrect password. Please try again.');
        return;
      }
      
      const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'An error occurred during sign in';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onForgotPasswordPress = async () => {
    if (!emailAddress) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: emailAddress,
      });

      setShowForgotPassword(true);
      setResetStep('code');
    } catch (err: any) {
      console.error('[Forgot Password] Error:', JSON.stringify(err, null, 2));
      const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to send reset code';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onResetCodeSubmit = async () => {
    if (!resetCode) {
      setError('Please enter the verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });

      if (result.status === 'needs_new_password') {
        setResetStep('password');
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[Reset Code] Error:', JSON.stringify(err, null, 2));
      const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Invalid verification code';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onNewPasswordSubmit = async () => {
    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await signIn.resetPassword({
        password: newPassword,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        setShowForgotPassword(false);
        setResetStep('email');
        setResetCode('');
        setNewPassword('');
        router.replace('/');
      } else {
        setError('Password reset failed. Please try again.');
      }
    } catch (err: any) {
      console.error('[New Password] Error:', JSON.stringify(err, null, 2));
      const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'Failed to reset password';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelForgotPassword = () => {
    setShowForgotPassword(false);
    setResetStep('email');
    setResetCode('');
    setNewPassword('');
    setError('');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
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
              source={isDarkMode ? require('@/assets/images/stand logo white.png') : require('@/assets/images/stand logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={[styles.tagline, { color: colors.primary }]}>Vote With Your Money</Text>
          </View>
          {!showForgotPassword ? (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Welcome back</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to your account</Text>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Email</Text>
                <TextInput
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
                  style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={[styles.label, { color: colors.text }]}>Password</Text>
                <TextInput
                  value={password}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.textSecondary}
                  secureTextEntry={true}
                  onChangeText={(password) => setPassword(password)}
                  style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                />
              </View>
              <TouchableOpacity onPress={onSignInPress} style={[styles.button, { backgroundColor: colors.primary }]} disabled={isSubmitting}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </TouchableOpacity>
              <View style={styles.forgotPasswordContainer}>
                <TouchableOpacity onPress={onForgotPasswordPress}>
                  <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>Forgot password?</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.linkContainer}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
                  <Text style={[styles.link, { color: colors.primary }]}>Sign up</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text }]}>Reset Password</Text>
              {resetStep === 'code' && (
                <>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    We sent a verification code to {emailAddress}
                  </Text>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>Verification Code</Text>
                    <TextInput
                      value={resetCode}
                      placeholder="Enter the 6-digit code"
                      placeholderTextColor={colors.textSecondary}
                      onChangeText={setResetCode}
                      style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                      keyboardType="number-pad"
                      maxLength={6}
                    />
                  </View>
                  <TouchableOpacity onPress={onResetCodeSubmit} style={[styles.button, { backgroundColor: colors.primary }]} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Verify Code</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              {resetStep === 'password' && (
                <>
                  <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    Enter your new password
                  </Text>
                  {error ? <Text style={styles.errorText}>{error}</Text> : null}
                  <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: colors.text }]}>New Password</Text>
                    <TextInput
                      value={newPassword}
                      placeholder="Enter your new password"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry={true}
                      onChangeText={setNewPassword}
                      style={[styles.input, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border, color: colors.text }]}
                    />
                  </View>
                  <TouchableOpacity onPress={onNewPasswordSubmit} style={[styles.button, { backgroundColor: colors.primary }]} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonText}>Reset Password</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
              <View style={styles.linkContainer}>
                <TouchableOpacity onPress={cancelForgotPassword}>
                  <Text style={[styles.link, { color: colors.primary }]}>Back to sign in</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
    maxWidth: Platform.OS === 'web' ? 480 : '100%',
    width: '100%',
    alignSelf: 'center',
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
  tagline: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginTop: -20,
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    textAlign: 'left',
    lineHeight: 20,
  },
  forgotPasswordContainer: {
    alignItems: 'center',
    marginTop: 12,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
