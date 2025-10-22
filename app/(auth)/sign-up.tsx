import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, ActivityIndicator } from 'react-native';
import { useSignUp, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { darkColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const { isSignedIn, isLoaded: authLoaded } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (authLoaded && isSignedIn && !pendingVerification) {
      console.log('[Sign Up] Already signed in, redirecting to home');
      router.replace('/');
    }
  }, [authLoaded, isSignedIn, router, pendingVerification]);

  React.useEffect(() => {
    if (isLoaded && signUp) {
      console.log('[Sign Up] Component mounted, checking sign-up state');
      console.log('[Sign Up] Current status:', signUp.status);
      
      if (signUp.status === 'complete' && !pendingVerification) {
        console.log('[Sign Up] Sign-up already complete, redirecting');
        router.replace('/');
      }
      setError('');
    }
  }, [isLoaded, signUp, router, pendingVerification]);

  const onSignUpPress = async () => {
    console.log('[Sign Up] Button pressed, isLoaded:', isLoaded, 'isSubmitting:', isSubmitting);
    
    if (!isLoaded) {
      console.log('[Sign Up] Clerk not loaded yet');
      setError('Please wait, loading...');
      return;
    }
    
    if (isSubmitting) {
      console.log('[Sign Up] Already submitting');
      return;
    }

    if (!emailAddress || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!emailAddress.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      console.log('[Sign Up] Creating account for:', emailAddress);
      console.log('[Sign Up] Current signUp status:', signUp?.status);
      
      if (!signUp) {
        throw new Error('Clerk SignUp not initialized');
      }
      
      const result = await signUp.create({
        emailAddress,
        password,
      });

      console.log('[Sign Up] Account created successfully');
      console.log('[Sign Up] Sign-up status:', result.status);
      console.log('[Sign Up] Verification needed:', result.verifications.emailAddress.status);
      
      if (result.verifications.emailAddress.status === 'verified') {
        console.log('[Sign Up] Email already verified, completing sign-up');
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          setIsSubmitting(false);
          router.replace('/onboarding');
          return;
        }
      }
      
      console.log('[Sign Up] Preparing verification...');
      await result.prepareEmailAddressVerification({ strategy: 'email_code' });

      console.log('[Sign Up] Verification email sent');
      setPendingVerification(true);
      setIsSubmitting(false);
    } catch (err: any) {
      console.error('[Sign Up] Error:', JSON.stringify(err, null, 2));
      
      if (err?.errors?.[0]?.code === 'session_exists') {
        console.log('[Sign Up] Session exists, redirecting to home');
        setIsSubmitting(false);
        router.replace('/');
        return;
      }
      
      if (err?.errors?.[0]?.code === 'form_identifier_exists') {
        setError('This email is already registered. Please sign in instead.');
        setIsSubmitting(false);
        return;
      }
      
      if (err?.errors?.[0]?.code === 'client_state_invalid') {
        console.log('[Sign Up] Invalid client state detected, retrying with fresh signup...');
        try {
          const freshResult = await signUp.create({
            emailAddress,
            password,
          });
          console.log('[Sign Up] Fresh account created successfully');
          
          if (freshResult.verifications.emailAddress.status === 'verified') {
            console.log('[Sign Up] Email already verified, completing sign-up');
            if (freshResult.status === 'complete') {
              await setActive({ session: freshResult.createdSessionId });
              setIsSubmitting(false);
              router.replace('/onboarding');
              return;
            }
          }
          
          await freshResult.prepareEmailAddressVerification({ strategy: 'email_code' });
          console.log('[Sign Up] Verification email sent after retry');
          setPendingVerification(true);
          setIsSubmitting(false);
          return;
        } catch (retryErr: any) {
          console.error('[Sign Up] Retry failed:', JSON.stringify(retryErr, null, 2));
          const retryErrorMessage = retryErr?.errors?.[0]?.longMessage || retryErr?.errors?.[0]?.message || 'Session error. Please try again.';
          setError(retryErrorMessage);
          setIsSubmitting(false);
          return;
        }
      }
      
      const errorMessage = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || err?.message || 'An error occurred during sign up';
      console.error('[Sign Up] Setting error message:', errorMessage);
      setError(errorMessage);
      setIsSubmitting(false);
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded || isSubmitting) return;
    
    if (!code || code.length < 6) {
      setError('Please enter a valid verification code');
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      console.log('[Sign Up] Attempting verification with code:', code);
      
      if (!signUp) {
        console.error('[Sign Up] No signUp instance available');
        setError('Session expired. Please start sign up again.');
        setPendingVerification(false);
        setIsSubmitting(false);
        return;
      }
      
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      console.log('[Sign Up] Verification attempt result:', result.status);
      console.log('[Sign Up] Created session ID:', result.createdSessionId);

      if (result.status === 'complete') {
        console.log('[Sign Up] Verification complete, setting active session...');
        await setActive({ session: result.createdSessionId });
        console.log('[Sign Up] Session set successfully');
        
        setIsSubmitting(false);
        
        console.log('[Sign Up] Redirecting to onboarding...');
        router.replace('/onboarding');
      } else {
        console.error('[Sign Up] Verification incomplete:', JSON.stringify(result, null, 2));
        setError('Verification incomplete. Please try again.');
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('[Sign Up] Verification error:', JSON.stringify(err, null, 2));
      
      if (err?.errors?.[0]?.code === 'client_state_invalid') {
        console.log('[Sign Up] Invalid client state during verification, restarting signup');
        setError('Session expired. Please sign up again.');
        setPendingVerification(false);
        setEmailAddress('');
        setPassword('');
        setConfirmPassword('');
        setCode('');
        setIsSubmitting(false);
        return;
      }
      
      if (err?.errors?.[0]?.code === 'form_code_incorrect') {
        setError('Incorrect verification code. Please try again.');
      } else {
        setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Verification failed. Please check your code.');
      }
      setIsSubmitting(false);
    }
  };



  if (pendingVerification) {
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
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>Enter the verification code sent to your email</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Verification Code</Text>
              <TextInput
                value={code}
                placeholder="Enter verification code"
                placeholderTextColor={darkColors.textSecondary}
                onChangeText={(code) => setCode(code)}
                style={styles.input}
                keyboardType="number-pad"
                autoCapitalize="none"
              />
            </View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity onPress={onVerifyPress} style={styles.button} disabled={isSubmitting}>
              {isSubmitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter your email"
              placeholderTextColor={darkColors.textSecondary}
              onChangeText={(email) => setEmailAddress(email)}
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
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <TextInput
              value={confirmPassword}
              placeholder="Re-enter your password"
              placeholderTextColor={darkColors.textSecondary}
              secureTextEntry={true}
              onChangeText={(confirmPassword) => setConfirmPassword(confirmPassword)}
              style={styles.input}
            />
          </View>
          <TouchableOpacity onPress={onSignUpPress} style={styles.button} disabled={isSubmitting || !isLoaded}>
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continue</Text>
            )}
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
              <Text style={styles.link}>Sign in</Text>
            </TouchableOpacity>
          </View>
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
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
});
