import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/src/components/ui/haptic-tab";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#D32F2F", // Brand Red
        tabBarInactiveTintColor: "#94A3B8", // Slate Gray
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          // DESIGN TWEAK 1: Increased base height to 70 for premium breathing room
          height: 70 + (insets.bottom > 0 ? insets.bottom : 12),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 12,
          paddingTop: 10,
          borderTopWidth: 1,
          borderTopColor: "#F1F5F9", // Softer, less aggressive border line
          // DESIGN TWEAK 2: Softer, wider shadow spread for a "floating" feel
          elevation: 16,
          shadowColor: "#0F172A",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarLabelStyle: {
          // DESIGN TWEAK 3: Slightly larger font with letter spacing for high legibility
          fontSize: 11,
          marginTop: 6,
          fontWeight: "700",
          letterSpacing: 0.5,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "HOME",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activePill : styles.inactivePill}>
              <MaterialCommunityIcons
                name={
                  focused ? "map-marker-radius" : "map-marker-radius-outline"
                }
                color={color}
                size={24} // Slightly smaller icon to let the pill background breathe
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "HISTORY",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activePill : styles.inactivePill}>
              <MaterialCommunityIcons
                name={focused ? "receipt-text" : "receipt-text-outline"}
                color={color}
                size={24}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="report"
        options={{
          title: "REPORT",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activePill : styles.inactivePill}>
              <MaterialCommunityIcons
                name={focused ? "alert-circle" : "alert-circle-outline"}
                color={color}
                size={24}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: "MENU",
          tabBarIcon: ({ color, focused }) => (
            <View style={focused ? styles.activePill : styles.inactivePill}>
              <MaterialCommunityIcons
                name={focused ? "view-grid" : "view-grid-outline"}
                color={color}
                size={24}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  activePill: {
    // DESIGN TWEAK 4: Wider pill shape (60x32) creates a more elegant horizontal oval
    width: 60,
    height: 32,
    backgroundColor: "#FFF1F2", // A softer, more premium "Tailwind Rose 50" tint
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  inactivePill: {
    width: 60,
    height: 32,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});
