import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Cause, UserProfile } from '@/types';
import { useUser as useClerkUser } from '@clerk/clerk-expo';

const USER_PROFILE_KEY = '@user_profile';
const DARK_MODE_KEY = '@dark_mode';

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: clerkUser, isSignedIn, isLoaded: isClerkLoaded } = useClerkUser();
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
      if (!isClerkLoaded || !mounted) return;
      
      try {
        if (!isSignedIn || !clerkUser) {
          const stored = await AsyncStorage.getItem(USER_PROFILE_KEY);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            setProfile(parsed);
            setHasCompletedOnboarding(parsed.causes.length > 0);
          }
        } else {
          const userKey = `${USER_PROFILE_KEY}_${clerkUser.id}`;
          const stored = await AsyncStorage.getItem(userKey);
          if (stored && mounted) {
            const parsed = JSON.parse(stored);
            setProfile(parsed);
            setHasCompletedOnboarding(parsed.causes.length > 0);
          } else {
            const legacyStored = await AsyncStorage.getItem(USER_PROFILE_KEY);
            if (legacyStored && mounted) {
              const parsed = JSON.parse(legacyStored);
              await AsyncStorage.setItem(userKey, legacyStored);
              await AsyncStorage.removeItem(USER_PROFILE_KEY);
              setProfile(parsed);
              setHasCompletedOnboarding(parsed.causes.length > 0);
            }
          }
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
  }, [isClerkLoaded, clerkUser?.id, isSignedIn]);

  const addCauses = useCallback((causes: Cause[]) => {
    const storageKey = isSignedIn && clerkUser ? `${USER_PROFILE_KEY}_${clerkUser.id}` : USER_PROFILE_KEY;
    const newProfile = { ...profile, causes };
    AsyncStorage.setItem(storageKey, JSON.stringify(newProfile))
      .then(() => {
        setProfile(newProfile);
        setHasCompletedOnboarding(newProfile.causes.length > 0);
      })
      .catch(error => console.error('Failed to save profile:', error));
  }, [profile, isSignedIn, clerkUser]);

  const addToSearchHistory = useCallback((query: string) => {
    const storageKey = isSignedIn && clerkUser ? `${USER_PROFILE_KEY}_${clerkUser.id}` : USER_PROFILE_KEY;
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    AsyncStorage.setItem(storageKey, JSON.stringify(newProfile))
      .then(() => {
        setProfile(newProfile);
        setHasCompletedOnboarding(newProfile.causes.length > 0);
      })
      .catch(error => console.error('Failed to save profile:', error));
  }, [profile, isSignedIn, clerkUser]);

  const resetProfile = useCallback(async () => {
    try {
      const storageKey = isSignedIn && clerkUser ? `${USER_PROFILE_KEY}_${clerkUser.id}` : USER_PROFILE_KEY;
      await AsyncStorage.removeItem(storageKey);
      setProfile({ causes: [], searchHistory: [] });
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Failed to reset profile:', error);
    }
  }, [isSignedIn, clerkUser]);

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
    isSignedIn,
  }), [profile, isLoading, isClerkLoaded, hasCompletedOnboarding, addCauses, addToSearchHistory, resetProfile, isDarkMode, toggleDarkMode, clerkUser, isSignedIn]);
});
