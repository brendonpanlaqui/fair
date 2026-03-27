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
      <MaterialIcons name={icon} size={20} color="#D32F2F" />
    </View>
    <View style={styles.menuItemTextContainer}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
    </View>
    <MaterialIcons
      name={isExternalLink ? "open-in-new" : "chevron-right"}
      size={24}
      color="#CBD5E1"
    />
  </TouchableOpacity>
);

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================
const ProfileScreen = () => {
  const router = useRouter();
  const { user, isGuest, logout } = useAuth();

  const handleExit = () => {
    if (isGuest) {
      logout();
      router.replace("/auth");
      return;
    }

    Alert.alert("Log Out", "Are you sure you want to log out of Fair?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            console.error("Logout failed", error);
            Alert.alert("Error", "Failed to log out. Please try again.");
          }
        },
      },
    ]);
  };

  const handleApplyDiscount = () => {
    if (isGuest) {
      Alert.alert(
        "Account Required",
        "You must create an account to submit your ID and apply for Student, Senior, or PWD discounts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Account", onPress: handleExit },
        ],
      );
    } else {
      router.push("/verify-id");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 1. SCROLLABLE RED HEADER */}
        <View style={styles.redHeaderBackground}>
          <Text style={styles.headerTitle}>Menu</Text>

          <TouchableOpacity style={styles.bellButton}>
            <MaterialIcons
              name="notifications-none"
              size={28}
              color="#FFFFFF"
            />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
        </View>

        {/* 2. OVERLAPPING PROFILE CARD */}
        <View style={styles.profileCardWrapper}>
          <TouchableOpacity style={styles.profileCard} activeOpacity={0.9}>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person" size={36} color="#D32F2F" />
            </View>

            <View style={styles.profileInfo}>
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
                    size={14}
                    color="#D32F2F"
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.verifiedText}>Verified User</Text>
                </View>
              )}
            </View>

            <MaterialIcons name="chevron-right" size={28} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        <View style={styles.menuContent}>
          {/* SECTION: FARE DISCOUNTS */}
          <Text style={styles.sectionLabel}>FARE DISCOUNTS</Text>
          <View style={styles.discountCard}>
            <View style={styles.discountHeaderRow}>
              <View style={styles.warningIconBox}>
                <MaterialIcons name="warning" size={22} color="#D97706" />
              </View>
              <View style={styles.discountTextWrapper}>
                <Text style={styles.discountTitle}>Regular Fares Active</Text>
                <Text style={styles.discountSubtitle}>
                  Verify your ID to unlock the LGU-mandated 20%
                  Student/Senior/PWD discount.
                </Text>

                <TouchableOpacity
                  style={styles.applyDiscountBtn}
                  activeOpacity={0.8}
                  onPress={handleApplyDiscount}
                >
                  <Text style={styles.applyDiscountBtnText}>
                    Apply for Discount
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* SECTION: RIDE PREFERENCES */}
          <Text style={styles.sectionLabel}>RIDE PREFERENCES</Text>
          <View style={styles.sectionContainer}>
            <MenuItem
              icon="location-on"
              title="Saved Places"
              subtitle="Home, CCA Campus, Nepo Mall"
              onPress={() => {
                if (isGuest)
                  Alert.alert(
                    "Guest Mode",
                    "Please sign in to save locations.",
                  );
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
            activeOpacity={0.8}
            onPress={handleExit}
          >
            <MaterialIcons
              name={isGuest ? "person-add" : "logout"}
              size={20}
              color={isGuest ? "#0F172A" : "#D32F2F"}
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
  scrollContent: { paddingBottom: 40 },

  // 1. BRAND RED HEADER
  redHeaderBackground: {
    backgroundColor: "#D32F2F", // Brand Crimson
    paddingTop: 65, // Status bar clearance
    paddingHorizontal: 24,
    paddingBottom: 60, // Extra space for the overlap
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
  },
  bellButton: {
    position: "absolute",
    right: 24,
    top: 65,
    padding: 4,
  },
  notificationDot: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#10B981",
    borderWidth: 2,
    borderColor: "#D32F2F",
  },

  // 2. OVERLAPPING PROFILE CARD
  profileCardWrapper: {
    marginTop: -40,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    borderWidth: 1,
    borderColor: "#F8FAFC",
  },
  avatarContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: 14,
    color: "#64748B",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  verifiedText: { color: "#D32F2F", fontSize: 11, fontWeight: "800" },

  menuContent: { paddingHorizontal: 16, paddingTop: 24 },

  // Sections
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 8,
    textTransform: "uppercase",
  },
  sectionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 64 },

  // NEW: FARE DISCOUNT CARD (Matches your image exactly)
  discountCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  discountHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  warningIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7", // Pale yellow matching the image
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  discountTextWrapper: {
    flex: 1,
  },
  discountTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A", // Dark slate color
    marginBottom: 4,
  },
  discountSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16, // Space before the button
  },
  applyDiscountBtn: {
    backgroundColor: "#C62828", // Deep red matching the image
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  applyDiscountBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Menu Item
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16 },
  menuItemIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  menuItemTextContainer: { flex: 1, justifyContent: "center" },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  menuItemSubtitle: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  // Dynamic Exit Button Base
  exitBtn: {
    flexDirection: "row",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
    marginBottom: 32,
    elevation: 2,
  },
  exitBtnText: { fontSize: 16, fontWeight: "900", letterSpacing: 0.5 },

  // Logout Specific Styles
  logoutBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FECACA",
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutText: { color: "#D32F2F" },

  // Guest Specific Styles
  guestExitBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestExitText: { color: "#0F172A" },

  // Footer Metadata
  footerData: { alignItems: "center", marginBottom: 20 },
  versionText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  creditText: { fontSize: 11, color: "#CBD5E1", fontWeight: "600" },
});

export default ProfileScreen;
