import { useSignIn, useOAuth, useAuth, useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TextInput, TouchableOpacity, View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Image } from 'react-native';
import React from 'react';
import { darkColors } from '@/constants/colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const [isOAuthPopup, setIsOAuthPopup] = React.useState(false);
  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isOAuthCallback = params.has('__clerk_handshake') || params.has('__clerk_status');
      
      if (isOAuthCallback && window.opener) {
        console.log('[Sign In] OAuth callback detected in popup - closing after message sent');
        setIsOAuthPopup(true);
        try {
          window.opener.postMessage({ 
            type: 'clerk-oauth-complete',
            url: window.location.href 
          }, window.location.origin);
          setTimeout(() => {
            console.log('[Sign In] Closing OAuth popup');
            window.close();
          }, 1000);
        } catch (error) {
          console.error('[Sign In] Error closing popup:', error);
        }
      }
    }
  }, []);

  const { signIn, setActive, isLoaded } = useSignIn();
  const clerk = useClerk();
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

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type === 'clerk-oauth-complete') {
          console.log('[Sign In] Received OAuth complete message from popup, waiting for session sync');
          setIsLoadingOAuth(true);
          
          let attempts = 0;
          const maxAttempts = 10;
          const checkInterval = 300;
          
          const waitForSession = async () => {
            while (attempts < maxAttempts) {
              attempts++;
              console.log('[Sign In] Checking for session, attempt', attempts);
              
              await new Promise(resolve => setTimeout(resolve, checkInterval));
              
              try {
                await clerk.session?.touch();
                const token = await getToken();
                if (token && isSignedIn) {
                  console.log('[Sign In] Session synced successfully, redirecting');
                  setIsLoadingOAuth(false);
                  router.replace('/');
                  return;
                }
              } catch (err) {
                console.log('[Sign In] Session not ready yet:', err);
              }
            }
            
            console.error('[Sign In] Session sync timeout');
            setIsLoadingOAuth(false);
            window.location.reload();
          };
          
          waitForSession();
        }
      };
      
      window.addEventListener('message', handleMessage);
      return () => window.removeEventListener('message', handleMessage);
    }
  }, [clerk, getToken, isSignedIn, router]);

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
      
      if (Platform.OS === 'web') {
        console.log('[Sign In] Using popup OAuth flow for web');
        await startOAuthFlow({
          redirectUrl,
        });

        console.log('[Sign In] OAuth flow returned (should not reach here for popup)');
        
        return;
      }
      
      const { createdSessionId, setActive: oauthSetActive, signIn: oauthSignIn, signUp: oauthSignUp } = await startOAuthFlow();

      console.log('[Sign In] OAuth flow completed:', { createdSessionId, hasSignIn: !!oauthSignIn, hasSignUp: !!oauthSignUp });

      if (createdSessionId) {
        console.log('[Sign In] Setting active session:', createdSessionId);
        await oauthSetActive!({ session: createdSessionId });
        console.log('[Sign In] OAuth success, session set');
        await new Promise(resolve => setTimeout(resolve, 500));
        await getToken();
        console.log('[Sign In] Token refreshed, redirecting');
        router.replace('/');
      } else {
        const session = oauthSignIn?.createdSessionId || oauthSignUp?.createdSessionId;
        if (session) {
          console.log('[Sign In] Found session from signIn/signUp:', session);
          if (oauthSetActive) {
            await oauthSetActive({ session });
          } else if (setActive) {
            await setActive({ session });
          }
          console.log('[Sign In] OAuth session activated');
          await new Promise(resolve => setTimeout(resolve, 500));
          await getToken();
          console.log('[Sign In] Token refreshed, redirecting');
          router.replace('/');
        } else {
          console.log('[Sign In] No session created from OAuth flow');
          throw new Error('No session created from OAuth flow');
        }
      }
    } catch (err: any) {
      console.error('[Sign In] OAuth Error:', err);
      if (err?.code === 'ERR_OAUTHCALLBACK_CANCELLED') {
        console.log('[Sign In] OAuth cancelled by user');
      } else {
        console.error('[Sign In] Unexpected OAuth error:', err);
      }
    } finally {
      if (Platform.OS !== 'web') {
        setIsLoadingOAuth(false);
      }
    }
  }, [startOAuthFlow, setActive, router, isSignedIn, redirectUrl, getToken]);

  if (isOAuthPopup) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={darkColors.primary} />
        <Text style={{ color: darkColors.text, marginTop: 16 }}>Completing sign in...</Text>
      </View>
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
