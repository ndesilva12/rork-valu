import * as React from 'react';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image } from 'react-native';
import { useSignUp } from '@clerk/clerk-expo';
import { Link, useRouter } from 'expo-router';
import { lightColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState('');
  const [error, setError] = React.useState('');

  const onSignUpPress = async () => {
    if (!isLoaded) return;

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setError('');

    try {
      await signUp.create({
        emailAddress,
        password,
      });

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      setPendingVerification(true);
    } catch (err: any) {
      console.error(JSON.stringify(err, null, 2));
      setError(err.errors?.[0]?.message || 'An error occurred during sign up');
    }
  };

  const onVerifyPress = async () => {
    if (!isLoaded) return;

    try {
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace('/');
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
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
                source={require('@/assets/images/icon.png')} 
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Verify your email</Text>
            <Text style={styles.subtitle}>Enter the verification code sent to your email</Text>
            <TextInput
              value={code}
              placeholder="Verification code"
              onChangeText={(code) => setCode(code)}
              style={styles.input}
              keyboardType="number-pad"
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={onVerifyPress} style={styles.button}>
              <Text style={styles.buttonText}>Verify</Text>
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
              source={require('@/assets/images/icon.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TextInput
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Email"
            onChangeText={(email) => setEmailAddress(email)}
            style={styles.input}
            keyboardType="email-address"
          />
          <TextInput
            value={password}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
            style={styles.input}
          />
          <TextInput
            value={confirmPassword}
            placeholder="Confirm Password"
            secureTextEntry={true}
            onChangeText={(confirmPassword) => setConfirmPassword(confirmPassword)}
            style={styles.input}
          />
          <TouchableOpacity onPress={onSignUpPress} style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Already have an account? </Text>
            <Link href="/sign-in" asChild>
              <TouchableOpacity>
                <Text style={styles.link}>Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.background,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: lightColors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: lightColors.textSecondary,
    marginBottom: 32,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: lightColors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  linkText: {
    color: lightColors.textSecondary,
    fontSize: 14,
  },
  link: {
    color: lightColors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
