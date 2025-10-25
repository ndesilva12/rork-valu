import { Tabs, useSegments } from "expo-router";
import { BookOpen, MapPin, ShoppingBag, Search, User } from "lucide-react-native";
import React, { useMemo } from "react";
import { Platform, useWindowDimensions, StyleSheet, StatusBar, View, Text } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStandalone } from "@/hooks/useIsStandalone";

const localColor = "#84CC16";

export default function TabLayout() {
  const isStandalone = useIsStandalone();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const isLocalTab = segments[segments.length - 1] === "local";

  const isTabletOrLarger = Platform.OS === "web" && width >= 768;

  // visible (icon row) height for the tab bar (adjust as desired)
  const visibleRowHeight = isTabletOrLarger ? 64 : 56;

  // safe area insets (native). For web PWAs we'll use env(safe-area-inset-bottom)
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || 0;
  const topInset = insets.top || 0;

  // On web PWA we use CSS env() to extend the bar background into the home-indicator area.
  const tabBarCssHeight: number | string =
    Platform.OS === "web" && isStandalone
      ? `calc(${visibleRowHeight}px + env(safe-area-inset-bottom))`
      : visibleRowHeight + bottomInset;

  const contentPaddingBottom: number | string =
    Platform.OS === "web" && isStandalone
      ? `calc(${visibleRowHeight}px + env(safe-area-inset-bottom))`
      : visibleRowHeight + bottomInset;

  const contentPaddingTop: number =
    isTabletOrLarger ? visibleRowHeight + topInset : topInset;

  // helper to render icon + optional label beside it on wide screens
  // Use explicit visible colors (active/inactive) so icons are always visible
  const renderTabIconWithLabel = useMemo(
    () =>
      (Icon: React.ComponentType<any>, label: string, focusedColor: string) =>
      ({ color, focused }: { color: string; focused?: boolean }) => {
        const active = Boolean(focused);
        // explicit inactive color to ensure visibility against background
        const inactiveColor = colors.text; // more contrast than textSecondary
        const useColor = active ? focusedColor : inactiveColor;

        if (isTabletOrLarger) {
          return (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon size={24} color={useColor} strokeWidth={2} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: active ? "700" : "600",
                  color: useColor,
                }}
              >
                {label}
              </Text>
            </View>
          );
        }
        // mobile: icon only (smaller for fitting in a shorter bar)
        return <Icon size={22} color={useColor} strokeWidth={2} />;
      },
    [isTabletOrLarger, colors.text]
  );

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
    >
      <StatusBar
        barStyle={isDarkMode ? "light-content" : "dark-content"}
        translucent={false}
        backgroundColor={colors.background}
      />

      {/* Center and constrain the app content on wide screens */}
      <View style={{ flex: 1, alignItems: "center" }}>
        <View style={{ width: "100%", maxWidth: isTabletOrLarger ? "50%" : 768, flex: 1 }}>
          <Tabs
            screenOptions={{
              // active and inactive tint explicitly set so the Icon receives a usable color
              tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
              tabBarInactiveTintColor: colors.text, // use text for better contrast
              headerShown: false,
              tabBarPosition: isTabletOrLarger ? "top" : "bottom",
              // render custom labels on wide screens; keep default labels off
              tabBarShowLabel: false,

              // ensure the tab bar background covers the safe area on PWAs and native
              tabBarStyle: {
                position: isTabletOrLarger ? "relative" : "absolute",
                top: isTabletOrLarger ? 0 : undefined,
                bottom: isTabletOrLarger ? undefined : 0,
                left: 0,
                right: 0,
                // ensure the tab bar background covers the safe area (uses calc(...) on web PWAs)
                height: tabBarCssHeight,
                // distribute icons evenly across the bar on mobile; keep left/top layout on wide screens
                flexDirection: "row",
                justifyContent: isTabletOrLarger ? "flex-start" : "space-around",
                alignItems: "center",
                paddingVertical: 6,
                borderTopWidth: isTabletOrLarger ? 0 : 1,
                borderBottomWidth: isTabletOrLarger ? 1 : 0,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
                zIndex: isTabletOrLarger ? 10 : undefined,
                elevation: isTabletOrLarger ? 10 : undefined,
              },

              // reserve space so content doesn't go under the tab bar
              contentStyle: {
                paddingTop: contentPaddingTop,
                paddingBottom: contentPaddingBottom,
              },

              // icon cell sizing to vertically center the icon in the visible row
              // make mobile icon cells flexible so icons spread evenly
              tabBarIconStyle: {
                height: visibleRowHeight,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 0,
                flex: Platform.OS === "web" && !isTabletOrLarger ? 1 : undefined,
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
              name="local"
              options={{
                title: "Local",
                tabBarIcon: renderTabIconWithLabel(MapPin, "Local", localColor),
              }}
            />
            <Tabs.Screen
              name="search"
              options={{
                title: "Search",
                tabBarIcon: renderTabIconWithLabel(Search, "Search", colors.primary),
              }}
            />
            <Tabs.Screen
              name="shop"
              options={{
                title: "Shop",
                tabBarIcon: renderTabIconWithLabel(ShoppingBag, "Shop", colors.primary),
              }}
            />
            <Tabs.Screen
              name="values"
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
