import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ClerkProvider, ClerkLoaded } from "@clerk/clerk-expo";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { UserProvider } from "@/contexts/UserContext";
import { trpc, trpcClient } from "@/lib/trpc";
import * as SecureStore from "expo-secure-store";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const tokenCache = {
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
      return await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.error("Error saving token:", err);
    }
  },
};

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || "pk_test_c2F2ZWQtbWFsYW11dGUtOTkuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!publishableKey) {
  throw new Error(
    "Missing Publishable Key. Please set EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in your .env file"
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
      <Stack.Screen name="value/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey!} tokenCache={tokenCache}>
      <ClerkLoaded>
        <trpc.Provider client={trpcClient} queryClient={queryClient}>
          <QueryClientProvider client={queryClient}>
            <UserProvider>
              <GestureHandlerRootView>
                <RootLayoutNav />
              </GestureHandlerRootView>
            </UserProvider>
          </QueryClientProvider>
        </trpc.Provider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
