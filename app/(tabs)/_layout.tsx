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
  // Make the tab bar larger to visually fill any gap; mobile value increased to cover browser chrome.
  const tabBarHeight = isTabletOrLarger ? 64 : 58;
  const visibleIconRow = isTabletOrLarger ? 64 : 48; // used to vertically center icons inside the bar

  // Use safe area insets to avoid content going under system UI (status bar / home indicator)
  const insets = useSafeAreaInsets();
  const topInset = insets.top || 0;
  const bottomInset = insets.bottom || 0;

  // helper to render icon + label beside it on wide screens
  // Ensure icons always get an explicit visible color and both stroke and fill so they render on web
  const renderTabIconWithLabel = (Icon: React.ComponentType<any>, label: string, focusedColor: string) => {
    return ({ color, focused }: { color: string; focused?: boolean }) => {
      const active = Boolean(focused);
      const fallbackColor = colors.text || (isDarkMode ? '#ffffff' : '#000000');
      const useColor = active ? focusedColor : (color ?? fallbackColor);

      const iconProps = {
        color: useColor,
        stroke: useColor,
        fill: useColor,
        strokeWidth: 2,
        style: { opacity: 1 },
      };

      if (isTabletOrLarger) {
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Icon size={24} {...iconProps} />
            <Text style={{
              marginLeft: 8,
              fontSize: 14,
              fontWeight: active ? '700' : '600',
              color: useColor,
            }}>
              {label}
            </Text>
          </View>
        );
      }
      // mobile: icon only (size tuned to sit centered in visibleIconRow)
      return <Icon size={22} {...iconProps} />;
    };
  };

  return (
    // Reserve safe area for top and bottom (native). On web the SafeAreaView is a no-op but harmless.
    <SafeAreaView edges={['top','bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        translucent={false}
        backgroundColor={colors.background}
      />

      {/* Center and constrain the app content on wide screens */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={{ width: '100%', maxWidth: isTabletOrLarger ? '50%' : 768, flex: 1 }}>
          <Tabs
            screenOptions={{
              // ensure Tabs passes explicit colors to the icon renderer
              tabBarActiveTintColor: isLocalTab ? localColor : colors.primary,
              tabBarInactiveTintColor: colors.text,
              headerShown: false,
              tabBarPosition: isTabletOrLarger ? 'top' : 'bottom',
              tabBarShowLabel: false,

              // Position the bar fixed to the viewport bottom on web/mobile so it stays pinned.
              // Use absolute on native-like environments and fixed on web to avoid layout gaps
              tabBarStyle: {
                position: isTabletOrLarger ? 'relative' : (Platform.OS === 'web' ? 'fixed' : 'absolute'),
                top: isTabletOrLarger ? 0 : undefined,
                bottom: isTabletOrLarger ? undefined : 0,
                left: 0,
                right: 0,
                // Make the bar larger so it visually fills the gap between bar and browser chrome.
                height: tabBarHeight,
                // Remove extra internal bottom padding that could create visible gap.
                paddingBottom: Platform.OS === 'web' && !isStandalone ? 0 : bottomInset,
                paddingTop: 6,
                flexDirection: 'row',
                justifyContent: isTabletOrLarger ? 'flex-start' : 'space-around',
                alignItems: 'center',
                borderTopWidth: isTabletOrLarger ? 0 : 1,
                borderBottomWidth: isTabletOrLarger ? 1 : 0,
                borderTopColor: colors.border,
                borderBottomColor: colors.border,
                backgroundColor: colors.background,
                zIndex: 9999,
                elevation: 9999,
              },

              // Reserve exactly the tabBarHeight space for content so there's no leftover gap under the bar.
              // On mobile subtract zero — we use the full tabBarHeight as reserved space.
              contentStyle: {
                paddingTop: isTabletOrLarger ? (tabBarHeight + topInset) : topInset,
                paddingBottom: isTabletOrLarger ? bottomInset : tabBarHeight,
              },

              // ensure each tab icon area centers the icon vertically and stretches so icons are spaced
              tabBarIconStyle: {
                height: visibleIconRow,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 0,
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
