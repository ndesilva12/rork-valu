import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider, useUser } from "@/contexts/UserContext";
import { DataProvider } from "@/contexts/DataContext";
import { trpc, trpcClient } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { darkColors, lightColors } from "@/constants/colors";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const createTokenCache = () => {
  if (Platform.OS === 'web') {
    return {
      async getToken(key: string) {
        try {
          return localStorage.getItem(key);
        } catch (err) {
          console.error("Error getting token:", err);
          return null;
        }
      },
      async saveToken(key: string, value: string) {
        try {
          if (value) {
            localStorage.setItem(key, value);
          } else {
            localStorage.removeItem(key);
          }
        } catch (err) {
          console.error("Error saving token:", err);
        }
      },
    };
  }
  
  return {
    async getToken(key: string) {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (err) {
        console.error("Error getting token:", err);
        return null;
      }
    },
    async saveToken(key: string, value: string) {
      try {
        if (value) {
          return await SecureStore.setItemAsync(key, value);
        } else {
          return await SecureStore.deleteItemAsync(key);
        }
      } catch (err) {
        console.error("Error saving token:", err);
      }
    },
  };
};

const tokenCache = createTokenCache();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_c2F2ZWQtbWFsYW11dGUtOTkuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file"
  );
}

function RootLayoutNav() {
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: {
          backgroundColor: colors.background,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          color: colors.text,
        },
      }}
    >
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="account-type" options={{ headerShown: false }} />
      <Stack.Screen name="business-setup" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="value/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="customer-discount" options={{ headerShown: false }} />
      <Stack.Screen name="merchant/verify" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <SafeAreaProvider>
      <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
        <ClerkLoaded>
          <trpc.Provider client={trpcClient} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
              <UserProvider>
                <DataProvider>
                  <GestureHandlerRootView>
                    <RootLayoutNav />
                  </GestureHandlerRootView>
                </DataProvider>
              </UserProvider>
            </QueryClientProvider>
          </trpc.Provider>
        </ClerkLoaded>
      </ClerkProvider>
    </SafeAreaProvider>
  );
}
