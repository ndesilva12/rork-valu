import { useRouter, useSegments } from 'expo-router';
import { Menu, RefreshCw, LogOut, Settings, Search as SearchIcon, User } from 'lucide-react-native';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useClerk } from '@clerk/clerk-expo';

export default function MenuButton() {
  const router = useRouter();
  const segments = useSegments();
  const { isDarkMode, toggleDarkMode, clerkUser, resetProfile, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { signOut } = useClerk();
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const isBusiness = profile.accountType === 'business';

  const handleUpdate = () => {
    setIsMenuVisible(false);
    router.push('/onboarding');
  };

  const handleReset = () => {
    console.log('[MenuButton] Opening reset confirmation');
    setIsMenuVisible(false);
    setTimeout(() => {
      setShowResetConfirm(true);
    }, 300);
  };

  const handleConfirmReset = async () => {
    console.log('[MenuButton] Confirming reset');
    try {
      setShowResetConfirm(false);
      await resetProfile();
      console.log('[MenuButton] Reset completed successfully');
    } catch (error) {
      console.error('[MenuButton] Reset failed:', error);
    }
  };

  const handleCancelReset = () => {
    setShowResetConfirm(false);
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
    router.push('/search');
  };

  const handleNavigateToSettings = () => {
    setIsMenuVisible(false);
    router.push('/settings');
  };

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={() => setIsMenuVisible(true)}
        activeOpacity={0.7}
      >
        <Menu size={28} color={colors.text} strokeWidth={2} />
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
          <TouchableOpacity
            style={[
              styles.menuContainer,
              {
                backgroundColor: isDarkMode ? '#1F2937' : '#F9FAFB',
                borderWidth: 3,
                borderColor: '#FFFFFF',
              }
            ]}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/upright wide logo1.png')}
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
                onPress={handleNavigateToSettings}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <User size={26} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Settings</Text>
                </View>
              </TouchableOpacity>

              {/* Search menu item - only for business accounts */}
              {isBusiness && (
                <TouchableOpacity
                  style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                  onPress={handleNavigateToSearch}
                  activeOpacity={0.7}
                >
                  <View style={styles.menuItemLeft}>
                    <SearchIcon size={26} color={colors.primary} strokeWidth={2} />
                    <Text style={[styles.menuItemTitle, { color: colors.text }]}>Search</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={handleUpdate}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <Settings size={26} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Update My Values</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.menuItem, { borderBottomColor: colors.border, borderBottomWidth: 1 }]}
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <RefreshCw size={26} color={colors.primary} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.text }]}>Reset My Values</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={styles.menuItemLeft}>
                  <LogOut size={26} color={colors.danger} strokeWidth={2} />
                  <Text style={[styles.menuItemTitle, { color: colors.danger }]}>Logout</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showResetConfirm}
        animationType="fade"
        transparent
        onRequestClose={handleCancelReset}
      >
        <View style={styles.confirmOverlay}>
          <View style={[styles.confirmContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.confirmTitle, { color: colors.text }]}>Reset Your Values?</Text>
            <Text style={[styles.confirmMessage, { color: colors.textSecondary }]}>
              This will permanently delete all your selected values and search history. This action cannot be undone.
            </Text>
            <View style={styles.confirmButtons}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton, { backgroundColor: colors.backgroundSecondary }]}
                onPress={handleCancelReset}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.resetButton, { backgroundColor: colors.danger }]}
                onPress={handleConfirmReset}
                activeOpacity={0.7}
              >
                <Text style={[styles.confirmButtonText, { color: colors.white }]}>Reset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}

const { width: screenWidth } = Dimensions.get('window');
const isMobile = screenWidth < 768;

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...(isMobile && { marginLeft: 'auto' }),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'web' && isMobile ? '15%' : '5%',
  },
  menuContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 24,
    overflow: 'hidden',
    maxHeight: '92%',
  },
  logoContainer: {
    padding: Platform.OS === 'web' && isMobile ? 20 : 28,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  menuLogo: {
    width: 300,
    height: 88,
  },
  menuContent: {
    maxHeight: '100%',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Platform.OS === 'web' && isMobile ? 18 : 24,
    paddingHorizontal: 28,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 20,
    fontWeight: '500' as const,
  },
  menuItemSubtitle: {
    fontSize: 16,
    fontWeight: '400' as const,
    marginTop: 4,
  },
  avatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  confirmContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmMessage: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
  },
  confirmButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 0,
  },
  resetButton: {
    borderWidth: 0,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
