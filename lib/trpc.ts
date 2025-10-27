import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import type { AppRouter } from "@/backend/trpc/app-router";
import superjson from "superjson";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

export const trpc = createTRPCReact<AppRouter>();

const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const origin = window.location.origin;
    console.log('[tRPC] Using window origin:', origin);
    return origin;
  }

  if (process.env.EXPO_PUBLIC_RORK_API_BASE_URL) {
    console.log('[tRPC] Using EXPO_PUBLIC_RORK_API_BASE_URL:', process.env.EXPO_PUBLIC_RORK_API_BASE_URL);
    return process.env.EXPO_PUBLIC_RORK_API_BASE_URL;
  }

  console.log('[tRPC] Using fallback localhost:8081');
  return 'http://localhost:8081';
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
      url: `${process.env.EXPO_PUBLIC_RORK_API_BASE_URL ?? (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081')}/api/trpc`,
      transformer: superjson,
      async headers() {
        const token = await getAuthToken();
        return token ? { authorization: `Bearer ${token}` } : {};
      },
      fetch: async (url, options) => {
        try {
          console.log('[tRPC] Request URL:', url);
          console.log('[tRPC] Base URL:', getBaseUrl());
          const response = await fetch(url, options);
          
          if (!response.ok) {
            const text = await response.text();
            console.error('[tRPC] Non-OK response:', response.status, text.substring(0, 200));
            
            try {
              JSON.parse(text);
              return new Response(text, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
              });
            } catch {
              return new Response(
                JSON.stringify({
                  error: {
                    json: {
                      message: text || `HTTP ${response.status}`,
                      code: -32000,
                      data: { httpStatus: response.status },
                    },
                  },
                }),
                {
                  status: response.status,
                  headers: { 'content-type': 'application/json' },
                }
              );
            }
          }
          
          return response;
        } catch (error) {
          console.error('[tRPC] Fetch error. URL:', url, 'Error:', error);
          console.error('[tRPC] Base URL:', getBaseUrl());
          throw error;
        }
      },
    }),
  ],
});
