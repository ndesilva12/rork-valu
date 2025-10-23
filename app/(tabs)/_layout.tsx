import { Tabs, useSegments } from "expo-router";
import { BookOpen, Heart, MapPin, ShoppingBag } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions, StyleSheet } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView } from 'expo-safe-area-context';

const localColor = '#84CC16';

export default function TabLayout() {
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const isLocalTab = segments[segments.length - 1] === 'local';
  
  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;

  return (
    <SafeAreaView style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
          headerShown: false,
          tabBarPosition: isTabletOrLarger ? 'top' : 'bottom',
          tabBarStyle: {
            height: isTabletOrLarger ? undefined : 70,
            paddingBottom: isTabletOrLarger ? undefined : 10,
            paddingTop: isTabletOrLarger ? undefined : 10,
            borderTopWidth: isTabletOrLarger ? 0 : 1,
            borderBottomWidth: isTabletOrLarger ? 1 : 0,
            borderTopColor: colors.border,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
          tabBarLabelStyle: isTabletOrLarger ? {
            fontSize: 14,
            fontWeight: '600' as const,
            textTransform: 'none' as const,
          } : undefined,
          tabBarIconStyle: isTabletOrLarger ? {
            marginTop: 4,
          } : undefined,
        }}
      >
        <Tabs.Screen
          name="home"
          options={{
            title: "Playbook",
            tabBarIcon: ({ color }) => <BookOpen size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="local"
          options={{
            title: "Local",
            tabBarIcon: ({ color, focused }) => <MapPin size={24} color={focused ? localColor : color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} strokeWidth={2} />,
          }}
        />
        <Tabs.Screen
          name="values"
          options={{
            title: "Values",
            tabBarIcon: ({ color }) => <Heart size={24} color={color} strokeWidth={2} />,
          }}
        />
      </Tabs>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
