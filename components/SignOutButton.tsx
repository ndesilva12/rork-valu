import { useClerk } from '@clerk/clerk-expo';
import { useRouter } from 'expo-router';
import { Text, TouchableOpacity, StyleSheet } from 'react-native';
import { lightColors } from '@/constants/colors';

export const SignOutButton = () => {
  const { signOut } = useClerk();
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/(auth)/sign-in');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2));
    }
  };

  return (
    <TouchableOpacity onPress={handleSignOut} style={styles.button}>
      <Text style={styles.buttonText}>Sign out</Text>
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
