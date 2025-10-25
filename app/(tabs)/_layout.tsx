import { Tabs, useSegments } from "expo-router";
import { BookOpen, MapPin, ShoppingBag, Search, User } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions, StyleSheet, StatusBar, View, Text } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView } from 'react-native-safe-area-context';
import { useIsStandalone } from '@/hooks/useIsStandalone';

const localColor = '#84CC16';

export default function TabLayout() {
  const isStandalone = useIsStandalone(); 
  const { isDarkMode } = useUser(); 
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const isLocalTab = segments[segments.length - 1] === 'local';
  
  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;

  // helper to render icon + label beside it on wide screens
  const renderTabIconWithLabel = (Icon: React.ComponentType<any>, label: string, focusedColor: string) => {
    return ({ color, focused }: { color: string; focused?: boolean }) => {
      if (isTabletOrLarger) {
        const active = Boolean(focused);
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon size={24} color={active ? focusedColor : color} strokeWidth={2} />
            <Text style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: active ? '700' : '600',
              color: active ? focusedColor : color,
            }}>
              {label}
            </Text>
          </View>
        );
      }

      // mobile: icon only
      return <Icon size={24} color={color} strokeWidth={2} />;
    };
  };

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
              // we'll render our own label next to icon on wide screens, so keep default labels off
              tabBarShowLabel: false,
              tabBarStyle: {
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
                zIndex: isTabletOrLarger ? 10 : undefined,
                elevation: isTabletOrLarger ? 10 : undefined,
              },
              contentStyle: {
                paddingBottom: isTabletOrLarger ? 0 : 50,
                paddingTop: isTabletOrLarger ? 64 : 0,
              },
            }}
          >
            <Tabs.Screen
              name="home"
              options={{
                title: "Playbook",
                tabBarIcon: renderTabIconWithLabel(BookOpen, "Playbook", colors.primary),
                tabBarShowLabel: false,
              }}
            />
            <Tabs.Screen
              name="local"
              options={{
                title: "Local",
                tabBarIcon: renderTabIconWithLabel(MapPin, "Local", localColor),
                tabBarShowLabel: false,
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: "Search",
                tabBarIcon: renderTabIconWithLabel(Search, "Search", colors.primary),
                tabBarShowLabel: false,
              }}
            />
            <Tabs.Screen
              name="shop"
              options={{
                title: "Shop",
                tabBarIcon: renderTabIconWithLabel(ShoppingBag, "Shop", colors.primary),
                tabBarShowLabel: false,
              }}
            />
            <Tabs.Screen
              name="values"
              options={{
                title: "Profile",
                tabBarIcon: renderTabIconWithLabel(User, "Profile", colors.primary),
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
