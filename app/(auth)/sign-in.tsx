import { useSignIn, useOAuth, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import React from 'react';
import { darkColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const redirectUrl = React.useMemo(() => {
    if (Platform.OS === 'web') {
      return `${window.location.origin}/`;
    }
    return Linking.createURL('/');
  }, []);
  
  const { startOAuthFlow } = useOAuth({ 
    strategy: 'oauth_google',
    redirectUrl,
  });
  const { isSignedIn, getToken } = useAuth();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [isLoadingOAuth, setIsLoadingOAuth] = React.useState(false);

  const onSignInPress = async () => {
    if (!isLoaded) return;

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
        console.error(JSON.stringify(signInAttempt, null, 2));
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  const onGoogleSignInPress = React.useCallback(async () => {
    if (isSignedIn) {
      console.log('[Sign In] Already signed in, navigating to index');
      router.replace('/');
      return;
    }

    setIsLoadingOAuth(true);
    try {
      console.log('[Sign In] Starting OAuth flow with redirectUrl:', redirectUrl);
      console.log('[Sign In] Platform:', Platform.OS);
      
      const { createdSessionId, setActive: oauthSetActive, signIn: oauthSignIn, signUp: oauthSignUp } = await startOAuthFlow();

      console.log('[Sign In] OAuth flow completed:', { createdSessionId, hasSignIn: !!oauthSignIn, hasSignUp: !!oauthSignUp });

      if (createdSessionId) {
        await oauthSetActive!({ session: createdSessionId });
        console.log('[Sign In] OAuth success, session set');
        await new Promise(resolve => setTimeout(resolve, 500));
        await getToken();
        console.log('[Sign In] Token refreshed, redirecting');
        router.replace('/');
      } else {
        const session = oauthSignIn?.createdSessionId || oauthSignUp?.createdSessionId;
        if (session && setActive) {
          await setActive({ session });
          console.log('[Sign In] OAuth session activated');
          await new Promise(resolve => setTimeout(resolve, 500));
          await getToken();
          console.log('[Sign In] Token refreshed, redirecting');
          router.replace('/');
        } else {
          console.log('[Sign In] No session created, checking auth state');
          await new Promise(resolve => setTimeout(resolve, 500));
          await getToken();
          router.replace('/');
        }
      }
    } catch (err: any) {
      console.error('[Sign In] OAuth Error:', JSON.stringify(err, null, 2));
      if (err.code === 'ERR_OAUTHCALLBACK_CANCELLED') {
        console.log('[Sign In] OAuth cancelled by user');
      } else if (err.errors && err.errors[0]?.code === 'session_exists') {
        console.log('[Sign In] Session already exists - user is already signed in');
        await new Promise(resolve => setTimeout(resolve, 500));
        await getToken();
        console.log('[Sign In] Token refreshed, redirecting to index');
        router.replace('/');
      } else {
        console.error('[Sign In] Unexpected OAuth error:', err);
      }
    } finally {
      setIsLoadingOAuth(false);
    }
  }, [startOAuthFlow, setActive, router, isSignedIn, redirectUrl, getToken]);

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
          
          <TouchableOpacity 
            onPress={onGoogleSignInPress} 
            style={styles.googleButton}
            disabled={isLoadingOAuth}
          >
            {isLoadingOAuth ? (
              <ActivityIndicator color={darkColors.text} />
            ) : (
              <>
                <View style={styles.googleIcon}>
                  <Text style={styles.googleIconText}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

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
          <TouchableOpacity onPress={onSignInPress} style={styles.button}>
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don&apos;t have an account? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
              <Text style={styles.link}>Sign up</Text>
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
  googleButton: {
    backgroundColor: darkColors.backgroundSecondary,
    borderWidth: 1,
    borderColor: darkColors.border,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  googleIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#4285F4',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  googleIconText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: darkColors.text,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: darkColors.border,
  },
  dividerText: {
    marginHorizontal: 16,
    color: darkColors.textSecondary,
    fontSize: 14,
  },
});
