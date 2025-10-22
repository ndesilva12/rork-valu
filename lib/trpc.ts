import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  throw new Error(
    "No base url found, please set EXPO_PUBLIC_RORK_API_BASE_URL"
  );
};

const getAuthToken = async () => {
  try {
    if (Platform.OS === 'web') {
      const token = localStorage.getItem("__clerk_client_jwt");
      return token;
    }
    const token = await SecureStore.getItemAsync("__clerk_client_jwt");
    return token;
  } catch (error) {
    console.error("Failed to get auth token:", error);
    return null;
  }
};

export const trpcClient = trpc.createClient({
  links: [
    httpLink({
      url: `${getBaseUrl()}/api/trpc`,
      transformer: superjson,
      async headers() {
        const token = await getAuthToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
    }),
  ],
});
