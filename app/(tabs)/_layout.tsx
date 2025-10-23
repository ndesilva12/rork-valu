import { Tabs } from "expo-router";
import { BookOpen, Heart, MapPin, ShoppingBag } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";

export default function TabLayout() {
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  
  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
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
        name="shop"
        options={{
          title: "Shop",
          tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} strokeWidth={2} />,
        }}
      />
      <Tabs.Screen
        name="local"
        options={{
          title: "Local",
          tabBarIcon: ({ color }) => <MapPin size={24} color={color} strokeWidth={2} />,
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
  );
}
