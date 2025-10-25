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

  // visible (icon row) height for the tab bar (tweak to taste)
  const visibleRowHeight = isTabletOrLarger ? 64 : 56;

  // safe area insets (native). For web PWAs we'll use env(safe-area-inset-bottom)
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom || 0;
  const topInset = insets.top || 0;

  // Tab bar height: On web PWA use calc(visibleRow + env(safe-area-inset-bottom)), on native add bottom inset numerically.
  const tabBarCssHeight: number | string =
    Platform.OS === "web" && isStandalone
      ? `calc(${visibleRowHeight}px + env(safe-area-inset-bottom))`
      : visibleRowHeight + bottomInset;

  const contentPaddingBottom: number | string =
    Platform.OS === "web" && isStandalone
      ? `calc(${visibleRowHeight}px + env(safe-area-inset-bottom))`
      : visibleRowHeight + bottomInset;

  const contentPaddingTop: number = isTabletOrLarger ? visibleRowHeight + topInset : topInset;

  // helper to render icon + optional label beside it on wide screens
  const renderTabIconWithLabel = useMemo(
    () =>
      (Icon: React.ComponentType<any>, label: string, focusedColor: string) =>
      ({ color, focused }: { color: string; focused?: boolean }) => {
        const active = Boolean(focused);
        if (isTabletOrLarger) {
          return (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon size={24} color={active ? focusedColor : color} strokeWidth={2} />
              <Text
                style={{
                  marginLeft: 8,
                  fontSize: 14,
                  fontWeight: active ? "700" : "600",
                  color: active ? focusedColor : color,
                }}
              >
                {label}
              </Text>
            </View>
          );
        }
        // mobile: icon only (slightly smaller to fit shorter bar)
        return <Icon size={22} color={color} strokeWidth={2} />;
      },
    [isTabletOrLarger]
  );

  return (
    <SafeAreaView
      edges={["top", "bottom"]}
      style={{
        flex: 1,
        backgroundColor: colors.background,
        // Use the runtime css variable for web to avoid URL bar overlap; fallback to 100vh
        // Also make this container positioned and sized so children using position:fixed/absolute behave relative to the visible viewport
        position: "relative",
        height: Platform.OS === "web" ? "calc(var(--vh, 1vh) * 100)" : "100%",
        minHeight: Platform.OS === "web" ? "calc(var(--vh, 1vh) * 100)" : undefined,
        overflow: "hidden",
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
              tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
              headerShown: false,
              tabBarPosition: isTabletOrLarger ? "top" : "bottom",
              tabBarShowLabel: false,

              // Tab bar - ensure icon row is the visibleRowHeight and background extends into safe area on PWAs
              tabBarStyle: {
                // On wide screens keep relative; on mobile web use fixed so it's anchored to the viewport bottom
                position: isTabletOrLarger ? "relative" : Platform.OS === "web" ? "fixed" : "absolute",
                top: isTabletOrLarger ? 0 : undefined,
                bottom: isTabletOrLarger ? undefined : 0,
                left: 0,
                right: 0,
                height: tabBarCssHeight,
                // distribute icons across the width (avoids icons being tightly grouped center)
                flexDirection: "row",
                justifyContent: isTabletOrLarger ? "flex-start" : "space-around",
                alignItems: "center",
                paddingVertical: 6,
                // Add paddingBottom so tappable area sits above home indicator / url bar when possible
                paddingBottom:
                  Platform.OS === "web"
                    ? isStandalone
                      ? "env(safe-area-inset-bottom)"
                      : undefined
                    : bottomInset,
                borderTopWidth: isTabletOrLarger ? 0 : 1,
                borderBottomWidth: isTabletOrLarger ? 1 : 0,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
                zIndex: 9999,
                elevation: 9999,
              },

              // reserve space so content doesn't go under the tab bar
              contentStyle: {
                paddingTop: contentPaddingTop,
                paddingBottom: contentPaddingBottom,
              },

              // icon cell sizing to vertically center the icon in the visible row
              tabBarIconStyle: {
                height: visibleRowHeight,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 0,
                paddingVertical: 6,
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
  container: { flex: 1 },
});
