import { useRouter } from 'expo-router';
import { Menu, Moon, Sun, RefreshCw, LogOut, Settings, Search as SearchIcon } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Switch,
  Image,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useClerk } from '@clerk/clerk-expo';

export default function MenuButton() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, clerkUser, resetProfile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { signOut } = useClerk();
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  const handleUpdate = () => {
    setIsMenuVisible(false);
    router.push('/onboarding');
  };

  const handleReset = async () => {
    setIsMenuVisible(false);
    await resetProfile();
  };

  const handleSignOut = async () => {
    try {
      console.log('[MenuButton] Starting sign out process...');
      console.log('[MenuButton] Menu visible: false');
      setIsMenuVisible(false);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[MenuButton] Calling Clerk signOut...');
      await signOut();
      console.log('[MenuButton] Clerk signOut complete');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[MenuButton] Navigating to sign-in...');
      router.replace('/(auth)/sign-in');
      console.log('[MenuButton] Navigation complete');
    } catch (error) {
      console.error('[MenuButton] Sign out error:', error);
      await new Promise(resolve => setTimeout(resolve, 100));
      router.replace('/(auth)/sign-in');
    }
  };

  const handleNavigateToSearch = () => {
    setIsMenuVisible(false);
    router.push('/(tabs)/search');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuVisible(true)}
        activeOpacity={0.7}
      >
        <Menu size={32} color={colors.primary} strokeWidth={2.5} />
      </TouchableOpacity>

      <Modal
        visible={isMenuVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View
            style={[styles.menuContainer, { backgroundColor: colors.background }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/01zd2yjl9h93g2cu0yb3u' }}
                style={styles.menuLogo}
                resizeMode="contain"
              />
            </View>

            <ScrollView style={styles.menuContent}>
              {clerkUser && (
                <View style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                  <View style={styles.menuItemLeft}>
                    <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                      <Text style={[styles.avatarText, { color: colors.white }]}>
                        {clerkUser.firstName?.charAt(0) || clerkUser.emailAddresses[0].emailAddress.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                        {clerkUser.firstName ? `${clerkUser.firstName} ${clerkUser.lastName || ''}` : 'User'}
                      </Text>
                      <Text style={[styles.menuItemSubtitle, { color: colors.textSecondary }]}>
                        {clerkUser.emailAddresses[0].emailAddress}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={handleUpdate}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Settings size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Update My Values</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <RefreshCw size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Reset My Values</Text>
                </View>
              </TouchableOpacity>

              <View style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                <View style={styles.menuItemLeft}>
                  {isDarkMode ? (
                    <Moon size={20} color={colors.primary} strokeWidth={2} />
                  ) : (
                    <Sun size={20} color={colors.primary} strokeWidth={2} />
                  )}
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Dark Mode</Text>
                </View>
                <Switch
                  value={isDarkMode}
                  onValueChange={toggleDarkMode}
                  trackColor={{ false: colors.neutralLight, true: colors.primaryLight }}
                  thumbColor={colors.white}
                />
              </View>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={handleNavigateToSearch}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <SearchIcon size={20} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Search</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <LogOut size={20} color={colors.danger} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.danger }]}>Logout</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 90,
  },
  menuContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 20,
    overflow: 'hidden',
    maxHeight: '85%',
  },
  logoContainer: {
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuLogo: {
    width: 240,
    height: 70,
  },
  menuContent: {
    maxHeight: 500,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  menuItemSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  avatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
