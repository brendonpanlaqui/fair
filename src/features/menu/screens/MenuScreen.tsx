import { useAuth } from "@/src/hooks/AuthContext";
import { api } from "@/src/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// mostly UI with API calls to fetch the user's verification status. AuthContext provides the user info and logout function, while the api service is used to fetch the latest profile data from Django.
interface MenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle?: string;
  onPress: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  title,
  subtitle,
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
    <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
  </TouchableOpacity>
);

export default function ProfileScreen() {
  const router = useRouter();
  // provides user info and logout function
  const { user, isGuest, logout } = useAuth();

  // hold the live data fetched from my Django.
  const [isIdVerified, setIsIdVerified] = useState(false);
  const [userType, setUserType] = useState("Regular");

  // refresh everytime user goes to this screen, if guest then skip
  useFocusEffect(
    useCallback(() => {
      // guest don't have profile data anyway
      if (!isGuest) {
        const fetchProfileData = async () => {
          try {
            // GET request to Django's get_user_profile view
            const response = await api.get("/users/me/");
            setIsIdVerified(response.data.is_discount_verified);
            setUserType(response.data.user_type);
          } catch (error) {
            console.warn("Failed to fetch profile status:", error);
          }
        };
        fetchProfileData();
      }
    }, [isGuest]),
  );

  const handleExit = () => {
    if (isGuest) {
      logout();
      router.replace("/auth"); //redirect to auth screen after logging out as guest
      return;
    }
    // for logged-in users, double-check if they actually want to log out.
    Alert.alert("Log Out", "Are you sure you want to log out of Fair?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log Out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert("Error", "Failed to log out.");
          }
        },
      },
    ]);
  };

  const handleApplyDiscount = () => {
    // must create an account first, if guest
    if (isGuest) {
      Alert.alert(
        "Account Required",
        "You must create an account to submit your ID for LGU discounts.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Create Account", onPress: handleExit },
        ],
      );
    } else {
      // navigate to this screen to submit ID for verification
      router.push("/(menu)/verify-id");
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
        {/* HEADER */}
        <View style={styles.redHeaderBackground}>
          <Text style={styles.headerTitle}>Menu</Text>
        </View>

        {/* PROFILE CARD */}
        <View style={styles.profileCardWrapper}>
          <TouchableOpacity
            style={styles.profileCard}
            activeOpacity={0.9}
            onPress={() => {
              if (isGuest) {
                Alert.alert(
                  "Guest Mode",
                  "Please sign in to manage account settings.",
                );
              } else {
                router.push("/manage-account"); 
              }
            }}
          >
            <View style={styles.avatarContainer}>
              <MaterialIcons name="person" size={36} color="#D32F2F" />
            </View>
            <View style={styles.profileInfo}>
              {/* show user's name, or a fallback if the name is missing/they are a guest */}
              <Text style={styles.profileName}>
                {isGuest
                  ? "Guest User"
                  : user?.first_name
                    ? `${user?.first_name} ${user?.last_name}`
                    : user?.email?.split("@")[0] || "Fair User"}
              </Text>

              {/* logic based on their status */}
              {isGuest && (
                <Text style={styles.guestSubtitle}>
                  Sign in to save preferences
                </Text>
              )}
              {!isGuest && !isIdVerified && (
                <Text style={styles.guestSubtitle}>Standard Account</Text>
              )}
              {!isGuest && isIdVerified && (
                <View style={styles.verifiedBadge}>
                  <MaterialIcons
                    name="verified"
                    size={14}
                    color="#D32F2F"
                    style={{ marginRight: 4 }}
                  />
                  {/* shows verification status */}
                  <Text style={styles.verifiedText}>
                    {userType === "Regular"
                      ? "Verified User"
                      : `${userType} Verified`}
                  </Text>
                </View>
              )}
            </View>
            <View style={{ paddingLeft: 8 }}>
              <MaterialIcons name="chevron-right" size={28} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.menuContent}>
          {/* show only if not verified or is guest */}
          {(!isIdVerified || isGuest) && (
            <>
              <Text style={styles.sectionLabel}>FARE DISCOUNTS</Text>
              <View style={styles.discountCard}>
                <View style={styles.discountHeaderRow}>
                  <View style={styles.warningIconBox}>
                    <MaterialIcons name="warning" size={22} color="#D97706" />
                  </View>
                  <View style={styles.discountTextWrapper}>
                    <Text style={styles.discountTitle}>
                      Regular Fares Active
                    </Text>
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
            </>
          )}

          <Text style={styles.sectionLabel}>RIDE PREFERENCES</Text>
          <View style={styles.sectionContainer}>
            <MenuItem
              icon="location-on"
              title="Saved Places"
              subtitle="Home, CCA Campus, Nepo Mall"
              onPress={() => {
                // prevent guests from saving places since it uses AsyncStorage tied to accounts
                if (isGuest)
                  Alert.alert(
                    "Guest Mode",
                    "Please sign in to save locations.",
                  );
                else router.push("/saved-places");
              }}
            />
          </View>

          <Text style={styles.sectionLabel}>LEGAL & SUPPORT</Text>
          <View style={styles.sectionContainer}>
            <MenuItem
              icon="gavel"
              title="View Ordinance No. 723"
              subtitle="Official tricycle fare matrix guide"
              onPress={() => router.push("/ordinance")}
            />
            <View style={styles.divider} />
            <MenuItem
              icon="headset-mic"
              title="Help & Support"
              subtitle="FAQs, Contact, and App Feedback"
              onPress={() => router.push("/help-support")}
            />
          </View>

          {/* (Changes colors depending on if it's a guest or real user) */}
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
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  scrollContent: { paddingBottom: 40 },
  redHeaderBackground: {
    backgroundColor: "#D32F2F",
    paddingTop: 65,
    paddingHorizontal: 24,
    paddingBottom: 60,
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
  settingsButton: { position: "absolute", right: 24, top: 65, padding: 4 },
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
  profileCardWrapper: { marginTop: -40, paddingHorizontal: 16, zIndex: 10 },
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
  guestSubtitle: { fontSize: 14, color: "#64748B" },
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
  discountHeaderRow: { flexDirection: "row", alignItems: "flex-start" },
  warningIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  discountTextWrapper: { flex: 1 },
  discountTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  discountSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16,
  },
  applyDiscountBtn: {
    backgroundColor: "#C62828",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  applyDiscountBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
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
  logoutBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FECACA",
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  logoutText: { color: "#D32F2F" },
  guestExitBtn: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  guestExitText: { color: "#0F172A" },
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
