import { useAuth } from "@/src/hooks/AuthContext";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// ==========================================
// REUSABLE MENU ITEM COMPONENT
// ==========================================
interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  isExternalLink?: boolean;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
  isExternalLink,
  onPress,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    activeOpacity={0.7}
    onPress={onPress}
  >
    <View style={styles.menuItemIconBg}>
      <MaterialIcons name={icon} size={20} color="#E53935" />
    </View>
    <View style={styles.menuItemTextContainer}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
    </View>
    <MaterialIcons
      name={isExternalLink ? "open-in-new" : "chevron-right"}
      size={20}
      color="#CBD5E1"
    />
  </TouchableOpacity>
);

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
const ProfileScreen = () => {
  const router = useRouter();

  // 1. Pull BOTH isGuest and logout from AuthContext
  const { user, isGuest, logout } = useAuth();

  const handleExit = () => {
    // If they are a guest, don't ask for confirmation. Just route them to Auth.
    if (isGuest) {
      logout();
      router.replace("/auth");
      return;
    }

    // If they are a registered user, show the standard confirmation alert.
    Alert.alert("Log Out", "Are you sure you want to log out of Fair?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            // Layout guard handles the redirect automatically!
          } catch (error) {
            console.error("Logout failed", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Menu</Text>
        <TouchableOpacity style={styles.bellButton}>
          <MaterialIcons name="notifications-none" size={26} color="#0F172A" />
          {/* Notification Badge Dot */}
          <View style={styles.notificationDot} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* PROFILE CARD */}
        <TouchableOpacity style={styles.profileCard} activeOpacity={0.9}>
          <View style={styles.avatarContainer}>
            <MaterialIcons name="person" size={40} color="#94A3B8" />
          </View>

          <View style={styles.profileInfo}>
            {/* DYNAMIC PROFILE NAME */}
            <Text style={styles.profileName}>
              {isGuest
                ? "Guest User"
                : user?.first_name
                  ? `${user?.first_name} ${user?.last_name}`
                  : user?.email?.split("@")[0] || "Fair User"}
            </Text>

            {isGuest ? (
              <Text style={styles.guestSubtitle}>
                Sign in to save preferences
              </Text>
            ) : (
              <View style={styles.verifiedBadge}>
                <MaterialIcons
                  name="verified"
                  size={12}
                  color="#E53935"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.verifiedText}>Verified Student - CCA</Text>
              </View>
            )}
          </View>

          <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
        </TouchableOpacity>

        {/* SECTION: RIDE PREFERENCES */}
        <Text style={styles.sectionLabel}>RIDE PREFERENCES</Text>
        <View style={styles.sectionContainer}>
          <MenuItem
            icon="location-on"
            title="Saved Places"
            subtitle="Home, CCA Campus, Nepo Mall"
            onPress={() => {
              if (isGuest)
                Alert.alert("Guest Mode", "Please sign in to save locations.");
            }}
          />
        </View>

        {/* SECTION: LGU TRANSPARENCY & LEGAL */}
        <Text style={styles.sectionLabel}>LGU TRANSPARENCY & LEGAL</Text>
        <View style={styles.sectionContainer}>
          <MenuItem
            icon="gavel"
            title="View Ordinance No. 723"
            subtitle="Official tricycle fare guide"
            isExternalLink={true}
            onPress={() =>
              Alert.alert("External Link", "Opening PDF viewer...")
            }
          />
          <View style={styles.divider} />
          <MenuItem
            icon="security"
            title="Dispute Guidelines"
            subtitle="How to report overcharging"
            onPress={() => {}}
          />
        </View>

        {/* SECTION: ACCOUNT & SETTINGS */}
        <Text style={styles.sectionLabel}>ACCOUNT & SETTINGS</Text>
        <View style={styles.sectionContainer}>
          <MenuItem
            icon="settings"
            title="App Settings"
            subtitle="GPS Accuracy, Theme, Language"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="help-outline"
            title="Help & Support"
            subtitle="FAQs and contact support"
            onPress={() => {}}
          />
          <View style={styles.divider} />
          <MenuItem
            icon="rate-review"
            title="Give Feedback"
            subtitle="Help us improve Fair App"
            onPress={() => {}}
          />
        </View>

        {/* 3. DYNAMIC LOGOUT / LOGIN BUTTON */}
        <TouchableOpacity
          style={[
            styles.exitBtn,
            isGuest ? styles.guestExitBtn : styles.logoutBtn,
          ]}
          activeOpacity={0.7}
          onPress={handleExit}
        >
          <MaterialIcons
            name={isGuest ? "person-add" : "logout"}
            size={20}
            color={isGuest ? "#0F172A" : "#E53935"}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.exitBtnText,
              isGuest ? styles.guestExitText : styles.logoutText,
            ]}
          >
            {isGuest ? "Sign In / Create Account" : "Log Out"}
          </Text>
        </TouchableOpacity>

        {/* FOOTER METADATA */}
        <View style={styles.footerData}>
          <Text style={styles.versionText}>FAIR APP v1.0.0</Text>
          <Text style={styles.creditText}>
            Angeles City Tricycle Monitoring System
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  bellButton: { position: "relative", padding: 4 },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#E53935",
    borderWidth: 2,
    borderColor: "#F8FAFC",
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },

  // Profile Card
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E2E8F0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: 13,
    color: "#64748B",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  verifiedText: { color: "#E53935", fontSize: 11, fontWeight: "bold" },

  // Sections
  sectionLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 24,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 56 },

  // Menu Item
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  menuItemIconBg: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemTextContainer: { flex: 1, justifyContent: "center" },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  menuItemSubtitle: { fontSize: 12, color: "#64748B" },

  // Dynamic Exit Button Base
  exitBtn: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 24,
  },
  exitBtnText: { fontSize: 16, fontWeight: "bold" },

  // Logout Specific Styles
  logoutBtn: { backgroundColor: "#FFFFFF", borderColor: "#E53935" },
  logoutText: { color: "#E53935" },

  // Guest Specific Styles
  guestExitBtn: { backgroundColor: "#FFFFFF", borderColor: "#E2E8F0" },
  guestExitText: { color: "#0F172A" },

  // Footer Metadata
  footerData: { alignItems: "center", marginBottom: 20 },
  versionText: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  creditText: { fontSize: 10, color: "#CBD5E1" },
});

export default ProfileScreen;
