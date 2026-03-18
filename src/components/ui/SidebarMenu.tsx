import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

interface SidebarMenuProps {
  visible: boolean;
  onClose: () => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ visible, onClose }) => {
  const menuItems = [
    {
      icon: "document-text",
      title: "View City Ordinance",
      subtitle: "Angeles City Ord. No. 723",
    },
    {
      icon: "bookmark",
      title: "Saved Places",
      subtitle: "CCA Campus, Home, etc.",
    },
    { icon: "settings", title: "Settings", subtitle: "GPS Accuracy, Theme" },
    {
      icon: "help-buoy",
      title: "Help & Support",
      subtitle: "How to report, FAQs",
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Tapping the dark background closes the menu */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        {/* The sliding panel */}
        <View style={styles.sidebar}>
          {/* User Profile Header */}
          <View style={styles.profileSection}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>B</Text>
            </View>
            <View>
              <Text style={styles.userName}>Brendon</Text>
              <Text style={styles.userRole}>3rd Year CS @ CCA</Text>
            </View>
          </View>

          {/* Navigation Links */}
          <View style={styles.linksContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuRow}
                activeOpacity={0.7}
              >
                <View style={styles.iconBox}>
                  <Ionicons name={item.icon as any} size={22} color="#555555" />
                </View>
                <View style={styles.menuTextContainer}>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                  <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#CCCCCC" />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer Version Info */}
          <View style={styles.footer}>
            <Text style={styles.versionText}>Fair App Prototype v1.0.0</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sidebar: {
    width: "75%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    height: "100%",
    position: "absolute",
    left: 0,
    top: 0,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },

  profileSection: {
    backgroundColor: "#E53935",
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  avatarText: { fontSize: 24, fontWeight: "bold", color: "#E53935" },
  userName: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },
  userRole: { fontSize: 13, color: "#FFCDD2", marginTop: 2 },

  linksContainer: { paddingTop: 20 },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  iconBox: { width: 32, alignItems: "center", marginRight: 15 },
  menuTextContainer: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: "600", color: "#333333" },
  menuSubtitle: { fontSize: 12, color: "#888888", marginTop: 2 },

  footer: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  versionText: { fontSize: 12, color: "#AAAAAA" },
});

export default SidebarMenu;
