import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { Cause, UserProfile } from '@/types';
import { trpc } from '@/lib/trpc';

const DARK_MODE_KEY = '@dark_mode';

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const [profile, setProfile] = useState<UserProfile>({
    causes: [],
    searchHistory: [],
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  const profileQuery = trpc.user.getProfile.useQuery(undefined, {
    enabled: !!clerkUser,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const saveProfileMutation = trpc.user.saveProfile.useMutation();

  useEffect(() => {
    if (!clerkUser) {
      console.log('[UserContext] No clerk user, resetting state');
      setProfile({ causes: [], searchHistory: [] });
      setHasCompletedOnboarding(false);
      return;
    }

    if (profileQuery.data) {
      console.log('[UserContext] Loaded profile from backend with', profileQuery.data.causes.length, 'causes');
      setProfile(profileQuery.data);
      setHasCompletedOnboarding(profileQuery.data.causes.length > 0);
    }
  }, [clerkUser, profileQuery.data]);

  useEffect(() => {
    let mounted = true;
    const loadDarkMode = async () => {
      try {
        const darkModeStored = await AsyncStorage.getItem(DARK_MODE_KEY);
        if (darkModeStored !== null && mounted) {
          try {
            setIsDarkMode(JSON.parse(darkModeStored));
          } catch (parseError) {
            console.error('[UserContext] Failed to parse dark mode, using default:', parseError);
            setIsDarkMode(true);
            await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(true));
          }
        } else if (mounted) {
          setIsDarkMode(true);
          await AsyncStorage.setItem(DARK_MODE_KEY, JSON.stringify(true));
        }
      } catch (error) {
        console.error('[UserContext] Failed to load dark mode:', error);
      }
    };
    loadDarkMode();
    return () => {
      mounted = false;
    };
  }, []);

  const addCauses = useCallback(async (causes: Cause[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot save causes: User not logged in');
      return;
    }
    
    const newProfile = { ...profile, causes };
    console.log('[UserContext] Saving', causes.length, 'causes to backend for user:', clerkUser.id);
    
    setProfile(newProfile);
    setHasCompletedOnboarding(causes.length > 0);
    
    try {
      await saveProfileMutation.mutateAsync(newProfile);
      console.log('[UserContext] Profile saved successfully to backend');
    } catch (error) {
      console.error('[UserContext] Failed to save profile to backend:', error);
    }
  }, [clerkUser, profile, saveProfileMutation]);

  const addToSearchHistory = useCallback((query: string) => {
    if (!clerkUser) {
      console.error('Cannot save search history: User not logged in');
      return;
    }
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    setProfile(newProfile);
    
    saveProfileMutation.mutate(newProfile);
  }, [profile, clerkUser, saveProfileMutation]);

  const resetProfile = useCallback(async () => {
    if (!clerkUser) {
      console.error('Cannot reset profile: User not logged in');
      return;
    }
    try {
      const emptyProfile = { causes: [], searchHistory: [] };
      setProfile(emptyProfile);
      setHasCompletedOnboarding(false);
      await saveProfileMutation.mutateAsync(emptyProfile);
      console.log('[UserContext] Profile reset successfully');
    } catch (error) {
      console.error('Failed to reset profile:', error);
    }
  }, [clerkUser, saveProfileMutation]);

  const clearAllStoredData = useCallback(async () => {
    try {
      console.log('[UserContext] Clearing ALL AsyncStorage data');
      await AsyncStorage.clear();
      setProfile({ causes: [], searchHistory: [] });
      setHasCompletedOnboarding(false);
      setIsDarkMode(true);
      console.log('[UserContext] All data cleared successfully');
    } catch (error) {
      console.error('[UserContext] Failed to clear all data:', error);
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
    isLoading: profileQuery.isLoading || !isClerkLoaded,
    hasCompletedOnboarding,
    addCauses,
    addToSearchHistory,
    resetProfile,
    clearAllStoredData,
    isDarkMode,
    toggleDarkMode,
    clerkUser,
  }), [profile, profileQuery.isLoading, isClerkLoaded, hasCompletedOnboarding, addCauses, addToSearchHistory, resetProfile, clearAllStoredData, isDarkMode, toggleDarkMode, clerkUser]);
});
