import { useClerk, useAuth } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { lightColors } from '@/constants/colors';
import { useState } from 'react';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('[SignOutButton] Signing out...');
      console.log('[SignOutButton] Currently signed in:', isSignedIn);
      
      await signOut();
      
      if (Platform.OS === 'web') {
        console.log('[SignOutButton] Clearing web storage...');
        localStorage.clear();
        sessionStorage.clear();
        
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const eqPos = cookie.indexOf('=');
          const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
          document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        }
      }
      
      console.log('[SignOutButton] Sign out complete');
      
      router.replace('/(auth)/sign-in');
      
      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.location.href = '/(auth)/sign-in';
        }, 100);
      }
    } catch (err) {
      console.error('[SignOutButton] Error signing out:', JSON.stringify(err, null, 2));
      setIsSigningOut(false);
    }
  };

  return (
    <TouchableOpacity 
      onPress={handleSignOut} 
      style={styles.button}
      disabled={isSigningOut}
    >
      {isSigningOut ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.buttonText}>Sign out</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: lightColors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
