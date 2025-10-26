import { Tabs, useSegments } from "expo-router";
import { BookOpen, Heart, MapPin, ShoppingBag, Search, User } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions, StyleSheet, StatusBar, View } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsStandalone } from '@/hooks/useIsStandalone';

const localColor = '#84CC16';

export default function TabLayout() {
  // Move all hooks INSIDE the component
  const isStandalone = useIsStandalone();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const isLocalTab = segments[segments.length - 1] === 'local';
  const insets = useSafeAreaInsets();

  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;
  const tabBarHeight = isTabletOrLarger ? 64 : 70;
  const topInset = insets.top || 0;
  const bottomInset = insets.bottom || 0;

  return (
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={false}
        backgroundColor={colors.background}
      />

      {/* Center and constrain the app content on wide screens so nothing stretches beyond 50% of the viewport */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        {/* Ensure this inner container fills vertical space so Tabs layout behaves correctly */}
        <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768, flex: 1 }}>
          <Tabs
        screenOptions={{
          tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
          headerShown: false,
          tabBarPosition: isTabletOrLarger ? 'top' : 'bottom',
          tabBarShowLabel: false,
          tabBarStyle: {
            position: isTabletOrLarger ? 'relative' : 'absolute',
            top: isTabletOrLarger ? 0 : undefined,
            bottom: isTabletOrLarger ? undefined : 0,
            left: 0,
            right: 0,
            height: tabBarHeight,
            paddingBottom: 0,
            paddingTop: 0,
            borderTopWidth: isTabletOrLarger ? 0 : 1,
            borderBottomWidth: isTabletOrLarger ? 1 : 0,
            borderTopColor: colors.border,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
            zIndex: isTabletOrLarger ? 10 : undefined,
            elevation: isTabletOrLarger ? 10 : undefined,
          },
          contentStyle: {
            paddingTop: isTabletOrLarger ? (tabBarHeight + topInset) : topInset,
            paddingBottom: isTabletOrLarger ? bottomInset : (tabBarHeight + bottomInset),
          },
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
            href: null, // This hides the tab
          }}
        />
        <Tabs.Screen
         name="search"
         options={{
           title: "Search",
           tabBarIcon: ({ color }) => <Search size={24} color={color} strokeWidth={2} />,
         }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Values",
            tabBarIcon: ({ color }) => <Heart size={24} color={color} strokeWidth={2} />,
          }}
        />
         <Tabs.Screen
         name="values"
         options={{
           title: "Profile",
           tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />,
         }}
       />
      </Tabs>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
