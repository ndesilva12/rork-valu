import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { Cause, UserProfile } from '@/types';

const getUserProfileKey = (userId: string) => `@user_profile_${userId}`;
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
      console.log('[UserContext] Init - isClerkLoaded:', isClerkLoaded, 'mounted:', mounted, 'clerkUser:', !!clerkUser);
      if (!isClerkLoaded || !mounted) {
        console.log('[UserContext] Waiting for Clerk to load...');
        return;
      }
      
      if (!clerkUser) {
        console.log('[UserContext] No clerk user, resetting state');
        if (mounted) {
          setProfile({ causes: [], searchHistory: [] });
          setHasCompletedOnboarding(false);
          setIsLoading(false);
        }
        return;
      }

      try {
        const userId = clerkUser.id;
        const userProfileKey = getUserProfileKey(userId);
        console.log('[UserContext] Loading profile for user:', userId);
        console.log('[UserContext] Profile key:', userProfileKey);
        
        const stored = await AsyncStorage.getItem(userProfileKey);
        console.log('[UserContext] Stored profile exists:', !!stored);
        if (stored) {
          console.log('[UserContext] Raw stored data length:', stored.length);
          console.log('[UserContext] First 200 chars:', stored.substring(0, 200));
        }
        
        if (stored && mounted) {
          try {
            const parsed = JSON.parse(stored);
            const causesCount = parsed.causes?.length || 0;
            console.log('[UserContext] Loaded profile with', causesCount, 'causes');
            console.log('[UserContext] Causes:', JSON.stringify(parsed.causes, null, 2));
            const hasOnboarded = causesCount > 0;
            console.log('[UserContext] Setting hasCompletedOnboarding to:', hasOnboarded);
            setProfile(parsed);
            setHasCompletedOnboarding(hasOnboarded);
          } catch (parseError) {
            console.error('[UserContext] Failed to parse stored profile, clearing corrupt data:', parseError);
            await AsyncStorage.removeItem(userProfileKey);
            setProfile({ causes: [], searchHistory: [] });
            setHasCompletedOnboarding(false);
          }
        } else if (mounted) {
          console.log('[UserContext] No stored profile, initializing empty');
          setProfile({ causes: [], searchHistory: [] });
          setHasCompletedOnboarding(false);
        }

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
        console.error('[UserContext] Failed to load user data:', error);
        if (mounted) {
          setProfile({ causes: [], searchHistory: [] });
          setHasCompletedOnboarding(false);
        }
      } finally {
        if (mounted) {
          console.log('[UserContext] Init complete, setting isLoading to false');
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [isClerkLoaded, clerkUser]);

  const addCauses = useCallback(async (causes: Cause[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot save causes: User not logged in');
      return;
    }
    
    setProfile(currentProfile => {
      const newProfile = { ...currentProfile, causes };
      console.log('[UserContext] Saving', causes.length, 'causes for user:', clerkUser.id);
      const userProfileKey = getUserProfileKey(clerkUser.id);
      
      AsyncStorage.setItem(userProfileKey, JSON.stringify(newProfile))
        .then(() => {
          console.log('[UserContext] Profile saved successfully to AsyncStorage');
          console.log('[UserContext] Saved data:', JSON.stringify(newProfile, null, 2));
        })
        .catch(error => {
          console.error('[UserContext] Failed to save profile:', error);
        });
      
      return newProfile;
    });
    
    const hasOnboarded = causes.length > 0;
    console.log('[UserContext] Setting hasCompletedOnboarding to:', hasOnboarded);
    setHasCompletedOnboarding(hasOnboarded);
  }, [clerkUser]);

  const addToSearchHistory = useCallback((query: string) => {
    if (!clerkUser) {
      console.error('Cannot save search history: User not logged in');
      return;
    }
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    setProfile(newProfile);
    setHasCompletedOnboarding(newProfile.causes.length > 0);
    const userProfileKey = getUserProfileKey(clerkUser.id);
    AsyncStorage.setItem(userProfileKey, JSON.stringify(newProfile))
      .catch(error => console.error('Failed to save profile:', error));
  }, [profile, clerkUser]);

  const resetProfile = useCallback(async () => {
    if (!clerkUser) {
      console.error('Cannot reset profile: User not logged in');
      return;
    }
    try {
      const userProfileKey = getUserProfileKey(clerkUser.id);
      await AsyncStorage.removeItem(userProfileKey);
      setProfile({ causes: [], searchHistory: [] });
      setHasCompletedOnboarding(false);
    } catch (error) {
      console.error('Failed to reset profile:', error);
    }
  }, [clerkUser]);

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
    isLoading: isLoading || !isClerkLoaded,
    hasCompletedOnboarding,
    addCauses,
    addToSearchHistory,
    resetProfile,
    clearAllStoredData,
    isDarkMode,
    toggleDarkMode,
    clerkUser,
  }), [profile, isLoading, isClerkLoaded, hasCompletedOnboarding, addCauses, addToSearchHistory, resetProfile, clearAllStoredData, isDarkMode, toggleDarkMode, clerkUser]);
});
