import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useUser as useClerkUser } from '@clerk/clerk-expo';
import { Cause, UserProfile, Charity, AccountType, BusinessInfo, UserDetails } from '@/types';
import { saveUserProfile, getUserProfile, createUser } from '@/services/firebase/userService';

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
          setProfile({ causes: [], searchHistory: [], donationAmount: 0, selectedCharities: [] });
          setHasCompletedOnboarding(false);
          setIsNewUser(null);
          setIsLoading(false);
        }
        return;
      }

      try {
        const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
        const isNewUserKey = `${IS_NEW_USER_KEY}_${clerkUser.id}`;

        // Check if this is a new user
        const storedIsNewUser = await AsyncStorage.getItem(isNewUserKey);
        const isFirstTime = storedIsNewUser === null;

        // Try to load from Firebase first (source of truth)
        let firebaseProfile: UserProfile | null = null;
        try {
          firebaseProfile = await getUserProfile(clerkUser.id);
        } catch (firebaseError) {
          console.error('[UserContext] Failed to load from Firebase, will use local cache:', firebaseError);
        }

        if (firebaseProfile && mounted) {
          // Firebase has the profile - use it
          console.log('[UserContext] Loaded profile from Firebase with', firebaseProfile.causes.length, 'causes');

          // Ensure promo code exists
          if (!firebaseProfile.promoCode) {
            firebaseProfile.promoCode = generatePromoCode();
            console.log('[UserContext] Generated new promo code:', firebaseProfile.promoCode);
          }

          // Ensure required fields are initialized
          firebaseProfile.donationAmount = firebaseProfile.donationAmount ?? 0;
          firebaseProfile.selectedCharities = firebaseProfile.selectedCharities ?? [];

          setProfile(firebaseProfile);
          setHasCompletedOnboarding(firebaseProfile.causes.length > 0);

          // Update local cache
          await AsyncStorage.setItem(storageKey, JSON.stringify(firebaseProfile));
        } else {
          // No Firebase profile - check local storage or create new
          const storedProfile = await AsyncStorage.getItem(storageKey);

          if (storedProfile && mounted) {
            const parsedProfile = JSON.parse(storedProfile) as UserProfile;
            console.log('[UserContext] Loaded profile from AsyncStorage with', parsedProfile.causes.length, 'causes');

            // Generate promo code if it doesn't exist
            if (!parsedProfile.promoCode) {
              parsedProfile.promoCode = generatePromoCode();
              console.log('[UserContext] Generated new promo code:', parsedProfile.promoCode);
            }

            parsedProfile.donationAmount = parsedProfile.donationAmount ?? 0;
            parsedProfile.selectedCharities = parsedProfile.selectedCharities ?? [];

            setProfile(parsedProfile);
            setHasCompletedOnboarding(parsedProfile.causes.length > 0);

            // Sync to Firebase
            try {
              if (isFirstTime) {
                const userData = {
                  email: clerkUser.primaryEmailAddress?.emailAddress,
                  firstName: clerkUser.firstName || undefined,
                  lastName: clerkUser.lastName || undefined,
                  fullName: clerkUser.fullName || undefined,
                  imageUrl: clerkUser.imageUrl || undefined,
                };
                await createUser(clerkUser.id, userData, parsedProfile);
                console.log('[UserContext] ✅ New user created in Firebase');
              } else {
                await saveUserProfile(clerkUser.id, parsedProfile);
                console.log('[UserContext] ✅ Profile synced to Firebase');
              }
            } catch (syncError) {
              console.error('[UserContext] Failed to sync to Firebase:', syncError);
            }
          } else if (mounted) {
            console.log('[UserContext] No stored profile found, creating new profile');
            const newProfile: UserProfile = {
              causes: [],
              searchHistory: [],
              promoCode: generatePromoCode(),
              donationAmount: 0,
              selectedCharities: [],
            };
            setProfile(newProfile);
            setHasCompletedOnboarding(false);

            // Create user in Firebase
            try {
              const userData = {
                email: clerkUser.primaryEmailAddress?.emailAddress,
                firstName: clerkUser.firstName || undefined,
                lastName: clerkUser.lastName || undefined,
                fullName: clerkUser.fullName || undefined,
                imageUrl: clerkUser.imageUrl || undefined,
              };
              await createUser(clerkUser.id, userData, newProfile);
              console.log('[UserContext] ✅ New user created in Firebase');
            } catch (createError) {
              console.error('[UserContext] Failed to create user in Firebase:', createError);
            }

            // Save to local storage
            await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
          }
        }

        if (mounted) {
          if (isFirstTime) {
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
          const defaultProfile = {
            causes: [],
            searchHistory: [],
            promoCode: generatePromoCode(),
            donationAmount: 0,
            selectedCharities: [],
          };
          setProfile(defaultProfile);
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
    console.log('[UserContext] Saving', causes.length, 'causes for user:', clerkUser.id);

    setProfile(newProfile);
    setHasCompletedOnboarding(causes.length > 0);

    try {
      // Save to AsyncStorage (local cache)
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      console.log('[UserContext] ✅ Profile saved to AsyncStorage');

      // Save to Firebase (source of truth)
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Profile synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save profile:', error);
    }
  }, [clerkUser, profile]);

  const removeCauses = useCallback(async (causeIds: string[]) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot remove causes: User not logged in');
      return;
    }

    const newCauses = profile.causes.filter(c => !causeIds.includes(c.id));
    const newProfile = { ...profile, causes: newCauses };
    console.log('[UserContext] Removing', causeIds.length, 'causes for user:', clerkUser.id);

    setProfile(newProfile);
    setHasCompletedOnboarding(newCauses.length > 0);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Causes removed and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to remove causes:', error);
    }
  }, [clerkUser, profile]);

  const toggleCauseType = useCallback(async (cause: Cause, newType: 'support' | 'avoid' | 'remove') => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot toggle cause: User not logged in');
      return;
    }

    let newCauses: Cause[];
    if (newType === 'remove') {
      // Remove the cause entirely
      newCauses = profile.causes.filter(c => c.id !== cause.id);
    } else {
      const existingIndex = profile.causes.findIndex(c => c.id === cause.id);
      if (existingIndex >= 0) {
        // Update existing cause type
        newCauses = [...profile.causes];
        newCauses[existingIndex] = { ...cause, type: newType };
      } else {
        // Add new cause
        newCauses = [...profile.causes, { ...cause, type: newType }];
      }
    }

    const newProfile = { ...profile, causes: newCauses };
    console.log('[UserContext] Toggling cause', cause.name, 'to', newType);

    setProfile(newProfile);
    setHasCompletedOnboarding(newCauses.length > 0);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Cause toggled and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to toggle cause:', error);
    }
  }, [clerkUser, profile]);

  const addToSearchHistory = useCallback(async (query: string) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot save search history: User not logged in');
      return;
    }
    const newHistory = [query, ...profile.searchHistory.filter(q => q !== query)].slice(0, 10);
    const newProfile = { ...profile, searchHistory: newHistory };
    setProfile(newProfile);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
    } catch (error) {
      console.error('[UserContext] Failed to save search history:', error);
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
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Selected charities saved and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save selected charities:', error);
    }
  }, [clerkUser, profile]);

  const resetProfile = useCallback(async () => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot reset profile: User not logged in');
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
      await saveUserProfile(clerkUser.id, emptyProfile);
      console.log('[UserContext] ✅ Profile reset and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to reset profile:', error);
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
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Account type saved and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save account type:', error);
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
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ Business info saved and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save business info:', error);
    }
  }, [clerkUser, profile]);

  const setUserDetails = useCallback(async (userDetails: Partial<UserDetails>) => {
    if (!clerkUser) {
      console.error('[UserContext] Cannot set user details: User not logged in');
      return;
    }

    const newProfile = {
      ...profile,
      userDetails: {
        ...profile.userDetails,
        ...userDetails,
      } as UserDetails,
    };
    console.log('[UserContext] Updating user details');

    setProfile(newProfile);

    try {
      const storageKey = `${PROFILE_KEY}_${clerkUser.id}`;
      await AsyncStorage.setItem(storageKey, JSON.stringify(newProfile));
      await saveUserProfile(clerkUser.id, newProfile);
      console.log('[UserContext] ✅ User details saved and synced to Firebase');
    } catch (error) {
      console.error('[UserContext] ❌ Failed to save user details:', error);
    }
  }, [clerkUser, profile]);

  return useMemo(() => ({
    profile,
    isLoading: isLoading || !isClerkLoaded,
    hasCompletedOnboarding,
    isNewUser,
    addCauses,
    removeCauses,
    toggleCauseType,
    addToSearchHistory,
    updateSelectedCharities,
    resetProfile,
    clearAllStoredData,
    isDarkMode,
    toggleDarkMode,
    clerkUser,
    setAccountType,
    setBusinessInfo,
    setUserDetails,
  }), [profile, isLoading, isClerkLoaded, hasCompletedOnboarding, isNewUser, addCauses, removeCauses, toggleCauseType, addToSearchHistory, updateSelectedCharities, resetProfile, clearAllStoredData, isDarkMode, toggleDarkMode, clerkUser, setAccountType, setBusinessInfo, setUserDetails]);
});
