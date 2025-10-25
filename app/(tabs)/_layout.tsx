import { Tabs, useSegments } from "expo-router";
import { BookOpen, Heart, MapPin, ShoppingBag, Search, User } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions, StyleSheet, StatusBar, View } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView } from 'react-native-safe-area-context';
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
  
  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;

  return (
    <SafeAreaView edges={isStandalone ? [] : ['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isStandalone ? colors.background : 'transparent'} translucent={isStandalone} />

      {/* Center and constrain the app content on wide screens so nothing stretches beyond 50% of the viewport */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768 }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
              headerShown: false,
              tabBarPosition: isTabletOrLarger ? 'top' : 'bottom',
              tabBarStyle: {
                // Position the tab bar differently for web/desktop (top) vs mobile (bottom)
                position: isTabletOrLarger ? 'relative' : 'absolute',
                top: isTabletOrLarger ? 0 : undefined,
                bottom: isTabletOrLarger ? undefined : 0,
                left: 0,
                right: 0,
                height: isTabletOrLarger ? 64 : 70,
                paddingBottom: 0,
                paddingTop: 0,
                borderTopWidth: isTabletOrLarger ? 0 : 1,
                borderBottomWidth: isTabletOrLarger ? 1 : 0,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
                // Ensure the top tab bar renders above content
                zIndex: isTabletOrLarger ? 10 : undefined,
                elevation: isTabletOrLarger ? 10 : undefined,
              },
              contentStyle: {
                // Reserve space at the top when the tab bar is at the top
                paddingBottom: isTabletOrLarger ? 0 : 50,
                paddingTop: isTabletOrLarger ? 64 : 0,
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
                tabBarShowLabel: false,
              }}
            />
            <Tabs.Screen
              name="local"
              options={{
                title: "Local",
                tabBarIcon: ({ color, focused }) => <MapPin size={24} color={focused ? localColor : color} strokeWidth={2} />, 
                tabBarShowLabel: false,
              }}
            />
            <Tabs.Screen
             name="search"
             options={{
               title: "Search",
               tabBarIcon: ({ color }) => <Search size={24} color={color} strokeWidth={2} />, 
               tabBarShowLabel: false,
             }}
            />
            <Tabs.Screen
              name="shop"
              options={{
                title: "Shop",
                tabBarIcon: ({ color }) => <ShoppingBag size={24} color={color} strokeWidth={2} />, 
                tabBarShowLabel: false,
              }}
            />
             <Tabs.Screen
             name="values"
             options={{
               title: "Profile",
               tabBarIcon: ({ color }) => <User size={24} color={color} strokeWidth={2} />, 
               tabBarShowLabel: false,
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
