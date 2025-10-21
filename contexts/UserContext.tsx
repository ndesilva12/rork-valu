import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { Cause, UserProfile } from '@/types';

const USER_PROFILE_KEY = '@user_profile';
const DARK_MODE_KEY = '@dark_mode';

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const [profile, setProfile] = useState<UserProfile>({
    causes: [],
    searchHistory: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;
      
      try {
        const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
        if (stored && mounted) {
          const parsed = JSON.parse(stored);
          setProfile(parsed);
          setHasCompletedOnboarding(parsed.causes.length > 0);
        }

        const darkModeStored = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (darkModeStored !== null && mounted) {
          setIsDarkMode(JSON.parse(darkModeStored));
        } else if (mounted) {
          setIsDarkMode(true);
          await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(true));
        }
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, []);

  const addCauses = useCallback((causes: Cause[]) => {
    const newProfile = { ...profile, causes };
    setProfile(newProfile);
    setHasCompletedOnboarding(newProfile.causes.length > 0);
    AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile))
      .catch(error => console.error('Failed to save profile:', error));
  }, [profile]);

  const addToSearchHistory = useCallback((query: string) => {
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    setProfile(newProfile);
    setHasCompletedOnboarding(newProfile.causes.length > 0);
    AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(newProfile))
      .catch(error => console.error('Failed to save profile:', error));
  }, [profile]);

  const resetProfile = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      setProfile({ causes: [], searchHistory: [] });
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Failed to reset profile:', error);
    }
  }, []);

  const toggleDarkMode = useCallback(async () => {
    try {
      const newValue = !isDarkMode;
      await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(newValue));
      setIsDarkMode(newValue);
    } catch (error) {
      console.error('Failed to toggle dark mode:', error);
    }
  }, [isDarkMode]);

  return useMemo(() => ({
    profile,
    isLoading: isLoading || !isClerkLoaded,
    hasCompletedOnboarding,
    addCauses,
    addToSearchHistory,
    resetProfile,
    isDarkMode,
    toggleDarkMode,
    clerkUser,
  }), [profile, isLoading, isClerkLoaded, hasCompletedOnboarding, addCauses, addToSearchHistory, resetProfile, isDarkMode, toggleDarkMode, clerkUser]);
});
