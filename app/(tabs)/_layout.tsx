import { Tabs, useSegments } from "expo-router";
import { BookOpen, MapPin, ShoppingBag, Search, User } from "lucide-react-native";
import React from "react";
import { Platform, useWindowDimensions, StyleSheet, StatusBar, View, Text } from "react-native";
import { lightColors, darkColors } from "@/constants/colors";
import { useUser } from "@/contexts/UserContext";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useIsStandalone } from "@/hooks/useIsStandalone";

const localColor = '#84CC16';

export default function TabLayout() {
  const isStandalone = useIsStandalone();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { width } = useWindowDimensions();
  const segments = useSegments();
  const isLocalTab = segments[segments.length - 1] === 'local';

  const isTabletOrLarger = Platform.OS === 'web' && width >= 768;
  // reduce mobile bar height to bring icons visually closer to bottom and make the bar less tall
  const tabBarHeight = isTabletOrLarger ? 64 : 52;
  const visibleIconRow = isTabletOrLarger ? 64 : 48; // used to vertically center icons inside the bar

  // Use safe area insets to avoid content going under system UI (status bar / home indicator)
  const insets = useSafeAreaInsets();
  const topInset = insets.top || 0;
  const bottomInset = insets.bottom || 0;

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
      // mobile: icon only (slightly smaller so it appears centered in the shorter bar)
      return <Icon size={22} color={color} strokeWidth={2} />;
    };
  };

  return (
    // Always reserve safe area for top and bottom so content doesn't shift under system UI.
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
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
              tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
              tabBarInactiveTintColor: colors.text,
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
                // make the bar visually less tall while keeping tappable area (we reserve padded content)
                paddingBottom: Platform.OS === 'web' && isStandalone ? undefined : bottomInset ? bottomInset : 6,
                paddingTop: 6,
                // distribute icons evenly across the width on mobile, keep left on large screens
                flexDirection: 'row',
                justifyContent: isTabletOrLarger ? 'flex-start' : 'space-around',
                alignItems: 'center',
                // border
                borderTopWidth: isTabletOrLarger ? 0 : 1,
                borderBottomWidth: isTabletOrLarger ? 1 : 0,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
                zIndex: isTabletOrLarger ? 10 : undefined,
                elevation: isTabletOrLarger ? 10 : undefined,
              },
              contentStyle: {
                // Reserve space for the top tab bar + system top inset on wide screens,
                // and reserve space for the bottom tab bar + bottom inset on mobile.
                paddingTop: isTabletOrLarger ? (tabBarHeight + topInset) : topInset,
                paddingBottom: isTabletOrLarger ? bottomInset : (tabBarHeight + bottomInset - 8),
                // note: subtract a small amount so content sits slightly closer to the bar
              },
              // ensure each tab icon area centers the icon vertically
              tabBarIconStyle: {
                height: visibleIconRow,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 0,
                // give mobile tabs flexible width so they spread evenly
                flex: Platform.OS === 'web' && !isTabletOrLarger ? 1 : undefined,
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
