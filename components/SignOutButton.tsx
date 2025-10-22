import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { lightColors } from '@/constants/colors';
import { useState } from 'react';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      console.log('[SignOutButton] Signing out...');
      await signOut();
      console.log('[SignOutButton] Sign out complete, navigating to sign-in');
      
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 100);
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
