import { Tabs, useSegments } from "expo-router";
import { BookOpen, DollarSign, Heart, Search, User, BarChart3 } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions, StyleSheet, StatusBar, View, Text } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStandalone } from "@/hooks/useIsStandalone";

export default function TabLayout() {
  const isStandalone = useIsStandalone();
  const { isDarkMode, profile } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();

  const isBusiness = profile.accountType === 'business';

  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;
  const tabBarHeight = isTabletOrLarger ? 64 : 64;

  // Use safe area insets to avoid content going under system UI (status bar / home indicator)
  const insets = useSafeAreaInsets();

  // In PWA/standalone mode, CSS handles safe areas, so we don't use SafeAreaView edges
  // In regular mobile browser, use safe area insets as normal
  const topInset = (isStandalone && Platform.OS === 'web') ? 0 : (insets.top || 0);
  const bottomInset = (isStandalone && Platform.OS === 'web') ? 0 : (insets.bottom || 0);

  // helper to render icon + label beside it on wide screens
  const renderTabIconWithLabel = (Icon: React.ComponentType<any>, label: string, focusedColor: string) => {
    return ({ color, focused }: { color: string; focused?: boolean }) => {
      const active = Boolean(focused);
      if (isTabletOrLarger) {
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

  // Conditionally use SafeAreaView edges based on standalone mode
  // In PWA mode, don't use edges since CSS handles it
  const safeAreaEdges = (isStandalone && Platform.OS === 'web') ? [] : ['top', 'bottom'] as const;

  return (
    <SafeAreaView edges={safeAreaEdges} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        // Keep translucent false to avoid content being pushed under the status bar on many phones.
        translucent={false}
        backgroundColor={colors.background}
      />

      {/* Center and constrain the app content on wide screens so nothing stretches beyond 50% of the viewport */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        {/* Ensure this inner container fills vertical space so Tabs layout behaves correctly */}
        <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768, flex: 1 }}>
          <Tabs
            screenOptions={{
              tabBarActiveTintColor: colors.primary,
              headerShown: false,
              tabBarPosition: isTabletOrLarger ? 'top' : 'bottom',
              // we'll render our own label next to icons on wide screens
              tabBarShowLabel: false,
              tabBarStyle: {
                position: isTabletOrLarger ? 'relative' : 'absolute',
                top: isTabletOrLarger ? 0 : undefined,
                bottom: isTabletOrLarger ? undefined : 0,
                left: 0,
                right: 0,
                height: tabBarHeight,
                // In PWA mode, reduce padding since CSS safe areas handle spacing
                paddingBottom: isTabletOrLarger ? 0 : (isStandalone && Platform.OS === 'web' ? 0 : 4),
                paddingTop: isTabletOrLarger ? 0 : 12,
                borderTopWidth: isTabletOrLarger ? 0 : 1,
                borderBottomWidth: isTabletOrLarger ? 1 : 0,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
                zIndex: isTabletOrLarger ? 10 : undefined,
                elevation: isTabletOrLarger ? 10 : undefined,
              },
              tabBarItemStyle: {
                paddingTop: isTabletOrLarger ? 0 : 4,
                // In PWA mode, reduce bottom padding
                paddingBottom: isTabletOrLarger ? 0 : (isStandalone && Platform.OS === 'web' ? 4 : 12),
              },
              contentStyle: {
                // Reserve space for the top tab bar + system top inset on wide screens,
                // and reserve space for the bottom tab bar + bottom inset on mobile.
                paddingTop: isTabletOrLarger ? (tabBarHeight + topInset) : topInset,
                paddingBottom: isTabletOrLarger ? bottomInset : (tabBarHeight + bottomInset),
              },
            }}
          >
            <Tabs.Screen
              name="home"
              options={{
                title: "Playbook",
                tabBarIcon: renderTabIconWithLabel(BookOpen, "Playbook", colors.primary),
              }}
            />
            <Tabs.Screen
              name="values"
              options={{
                title: "Values",
                tabBarIcon: renderTabIconWithLabel(Heart, "Values", colors.primary),
              }}
            />
            {/* Search tab - only for individual users */}
            <Tabs.Screen
              name="search"
              options={{
                title: "Search",
                tabBarIcon: renderTabIconWithLabel(Search, "Search", colors.primary),
                href: isBusiness ? null : undefined,
              }}
            />
            {/* Data tab - only for business users */}
            <Tabs.Screen
              name="data"
              options={{
                title: "Data",
                tabBarIcon: renderTabIconWithLabel(BarChart3, "Data", colors.primary),
                href: !isBusiness ? null : undefined,
              }}
            />
            <Tabs.Screen
              name="money"
              options={{
                title: "Money",
                tabBarIcon: renderTabIconWithLabel(DollarSign, "Money", colors.primary),
              }}
            />
            <Tabs.Screen
              name="profile"
              options={{
                title: "Profile",
                tabBarIcon: renderTabIconWithLabel(User, "Profile", colors.primary),
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
