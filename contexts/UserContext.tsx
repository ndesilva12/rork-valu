import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { Cause, UserProfile, Charity, AccountType, BusinessInfo } from '@/types';

const DARK_MODE_KEY = '@dark_mode';
const PROFILE_KEY = '@user_profile';
const IS_NEW_USER_KEY = '@is_new_user';

// Generate a random 6-digit promo code
const generatePromoCode = (): string => {
  const digits = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `VALU${digits}`;
};

export const [UserProvider, useUser] = createContextHook(() => {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useClerkUser();
  const [profile, setProfile] = useState<UserProfile>({
    causes: [],
    searchHistory: [],
    promoCode: undefined,
    donationAmount: 0,
    selectedCharities: [],
  });
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState<boolean | null>(null);

  useEffect(() => {
    let mounted = true;
    const loadProfile = async () => {
      if (!clerkUser) {
        console.log('[UserContext] No clerk user, resetting state');
        if (mounted) {
          setProfile({ causes: [], searchHistory: [] });
          setHasCompletedOnboarding(false);
          setIsNewUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
        const isNewUserKey = `${IS_NEW_USER_KEY}_${clerkUser.id}`;
        
        const [storedProfile, storedIsNewUser] = await Promise.all([
          AsyncStorage.getItem(storageKey),
          AsyncStorage.getItem(isNewUserKey)
        ]);
        
        if (storedProfile && mounted) {
          const parsedProfile = JSON.parse(storedProfile) as UserProfile;
          console.log('[UserContext] Loaded profile from AsyncStorage with', parsedProfile.causes.length, 'causes');

          // Generate promo code if it doesn't exist
          if (!parsedProfile.promoCode) {
            parsedProfile.promoCode = generatePromoCode();
            parsedProfile.donationAmount = parsedProfile.donationAmount ?? 0;
            parsedProfile.selectedCharities = parsedProfile.selectedCharities ?? [];
            await AsyncStorage.setItem(storageKey, JSON.stringify(parsedProfile));
            console.log('[UserContext] Generated new promo code:', parsedProfile.promoCode);
          }

          setProfile(parsedProfile);
          setHasCompletedOnboarding(parsedProfile.causes.length > 0);
        } else if (mounted) {
          console.log('[UserContext] No stored profile found, creating new profile with promo code');
          const newProfile: UserProfile = {
            causes: [],
            searchHistory: [],
            promoCode: generatePromoCode(),
            donationAmount: 0,
            selectedCharities: [],
          };
          setProfile(newProfile);
          setHasCompletedOnboarding(false);
        }
        
        if (mounted) {
          if (storedIsNewUser === null) {
            console.log('[UserContext] First time seeing this user - marking as new');
            setIsNewUser(true);
            await AsyncStorage.setItem(isNewUserKey, 'false');
          } else {
            console.log('[UserContext] User has logged in before - marking as existing');
            setIsNewUser(false);
          }
        }
      } catch (error) {
        console.error('[UserContext] Failed to load profile:', error);
        if (mounted) {
          setProfile({
            causes: [],
            searchHistory: [],
            promoCode: generatePromoCode(),
            donationAmount: 0,
            selectedCharities: [],
          });
          setHasCompletedOnboarding(false);
          setIsNewUser(false);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, [clerkUser]);

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
    console.log('[UserContext] Saving', causes.length, 'causes to AsyncStorage for user:', clerkUser.id);
    
    setProfile(newProfile);
    setHasCompletedOnboarding(causes.length > 0);
    
    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      console.log('[UserContext] Profile saved successfully to AsyncStorage');
    } catch (error) {
      console.error('[UserContext] Failed to save profile to AsyncStorage:', error);
    }
  }, [clerkUser, profile]);

  const addToSearchHistory = useCallback(async (query: string) => {
    if (!clerkUser) {
      console.error('Cannot save search history: User not logged in');
      return;
    }
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    setProfile(newProfile);
    
    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, [profile, clerkUser]);

  const updateSelectedCharities = useCallback(async (charities: Charity[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot update charities: User not logged in');
      return;
    }

    const newProfile = { ...profile, selectedCharities: charities };
    console.log('[UserContext] Updating selected charities:', charities.length);

    setProfile(newProfile);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      console.log('[UserContext] Selected charities saved successfully');
    } catch (error) {
      console.error('[UserContext] Failed to save selected charities:', error);
    }
  }, [clerkUser, profile]);

  const resetProfile = useCallback(async () => {
    if (!clerkUser) {
      console.error('Cannot reset profile: User not logged in');
      return;
    }
    try {
      const emptyProfile: UserProfile = {
        causes: [],
        searchHistory: [],
        promoCode: profile.promoCode || generatePromoCode(),
        donationAmount: 0,
        selectedCharities: [],
      };
      setProfile(emptyProfile);
      setHasCompletedOnboarding(false);
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(emptyProfile));
      console.log('[UserContext] Profile reset successfully');
    } catch (error) {
      console.error('Failed to reset profile:', error);
    }
  }, [clerkUser, profile.promoCode]);

  const clearAllStoredData = useCallback(async () => {
    try {
      console.log('[UserContext] Clearing ALL AsyncStorage data');
      await AsyncStorage.clear();
      setProfile({
        causes: [],
        searchHistory: [],
        promoCode: generatePromoCode(),
        donationAmount: 0,
        selectedCharities: [],
      });
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

  const setAccountType = useCallback(async (accountType: AccountType) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot set account type: User not logged in');
      return;
    }

    const newProfile = { ...profile, accountType };
    console.log('[UserContext] Setting account type to:', accountType);

    setProfile(newProfile);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      console.log('[UserContext] Account type saved successfully');
    } catch (error) {
      console.error('[UserContext] Failed to save account type:', error);
    }
  }, [clerkUser, profile]);

  const setBusinessInfo = useCallback(async (businessInfo: Partial<BusinessInfo>) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot set business info: User not logged in');
      return;
    }

    const newProfile = {
      ...profile,
      businessInfo: {
        ...profile.businessInfo,
        ...businessInfo,
      } as BusinessInfo,
    };
    console.log('[UserContext] Updating business info');

    setProfile(newProfile);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      console.log('[UserContext] Business info saved successfully');
    } catch (error) {
      console.error('[UserContext] Failed to save business info:', error);
    }
  }, [clerkUser, profile]);

  return useMemo(() => ({
    profile,
    isLoading: isLoading || !isClerkLoaded,
    hasCompletedOnboarding,
    isNewUser,
    addCauses,
    addToSearchHistory,
    updateSelectedCharities,
    resetProfile,
    clearAllStoredData,
    isDarkMode,
    toggleDarkMode,
    clerkUser,
    setAccountType,
    setBusinessInfo,
  }), [profile, isLoading, isClerkLoaded, hasCompletedOnboarding, isNewUser, addCauses, addToSearchHistory, updateSelectedCharities, resetProfile, clearAllStoredData, isDarkMode, toggleDarkMode, clerkUser, setAccountType, setBusinessInfo]);
});
