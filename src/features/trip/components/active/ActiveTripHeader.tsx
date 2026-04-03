import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  bodyNumber: string;
  fixedFare: number;
  onBack: () => void;
}

export const ActiveTripHeader = ({ bodyNumber, fixedFare, onBack }: Props) => {
  const [sosVisible, setSosVisible] = useState(false);

  const handleCall = (number: string) => {
    // Strips out any spaces or dots to ensure the phone dialer works perfectly
    const cleanNumber = number.replace(/[^0-9+]/g, "");
    const url =
      Platform.OS === "android"
        ? `tel:${cleanNumber}`
        : `telprompt:${cleanNumber}`;
    Linking.openURL(url);
    setSosVisible(false);
  };

  return (
    <View style={styles.topOverlay} pointerEvents="box-none">
      {/* UNIFIED HUD: Compact, White, Premium */}
      <View style={styles.hudCard}>
        {/* Top Row: Navigation & SOS */}
        <View style={styles.hudTopRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.titleWrapper}>
            <Text style={styles.hudSubtitle}>ACTIVE RIDE</Text>
            <Text style={styles.hudTitle}>Body #{bodyNumber}</Text>
          </View>

          <TouchableOpacity
            style={styles.sosButton}
            activeOpacity={0.8}
            onPress={() => setSosVisible(true)}
          >
            <MaterialIcons name="health-and-safety" size={16} color="#DC2626" />
            <Text style={styles.sosText}>SOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* Bottom Row: The Fare */}
        <View style={styles.hudBottomRow}>
          <View>
            <Text style={styles.fareLabel}>CURRENT FARE</Text>
            <View style={styles.fareValueRow}>
              <Text style={styles.fareCurrency}>₱</Text>
              <Text style={styles.fareValue}>{fixedFare}.00</Text>
            </View>
          </View>

          <View style={styles.verifiedBadge}>
            <MaterialIcons name="verified" size={14} color="#10B981" />
            <Text style={styles.verifiedText}>LGU Verified</Text>
          </View>
        </View>
      </View>

      {/* 🚀 COMPREHENSIVE EMERGENCY MODAL */}
      <Modal
        visible={sosVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSosVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Emergency Center</Text>
                <Text style={styles.modalSubtitle}>
                  Current Ride: Body #{bodyNumber}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setSosVisible(false)}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* CATEGORY 1: MEDICAL & RESCUE (Life Threatening) */}
              <Text style={styles.sectionLabel}>CRITICAL EMERGENCY</Text>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => handleCall("911")}
              >
                <View
                  style={[styles.actionIconBg, { backgroundColor: "#FEF2F2" }]}
                >
                  <MaterialIcons
                    name="medical-services"
                    size={24}
                    color="#DC2626"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>
                    National Emergency (911)
                  </Text>
                  <Text style={styles.actionSubtext}>
                    Police, Medical, or Rescue
                  </Text>
                </View>
                <MaterialIcons name="call" size={24} color="#CBD5E1" />
              </TouchableOpacity>

              {/* CATEGORY 2: TRAFFIC INCIDENTS (From Poster) */}
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
                POLICE & TRAFFIC
              </Text>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => handleCall("09603071131")}
              >
                <View
                  style={[styles.actionIconBg, { backgroundColor: "#FFF7ED" }]}
                >
                  <MaterialIcons name="traffic" size={24} color="#EA580C" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>PNP - Traffic Unit</Text>
                  <Text style={styles.actionSubtext}>
                    Collisions & traffic disputes
                  </Text>
                </View>
                <MaterialIcons name="call" size={24} color="#CBD5E1" />
              </TouchableOpacity>

              {/* CATEGORY 3: LGU REGULATION (From Poster) */}
              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
                FARE & REGULATION
              </Text>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => handleCall("09931696052")}
              >
                <View
                  style={[styles.actionIconBg, { backgroundColor: "#F1F5F9" }]}
                >
                  <MaterialIcons name="gavel" size={24} color="#0F172A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>PTRO Angeles City</Text>
                  <Text style={styles.actionSubtext}>
                    Report overcharging & violations
                  </Text>
                </View>
                <MaterialIcons name="call" size={24} color="#CBD5E1" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === "ios" ? 55 : 45,
    paddingHorizontal: 16,
  },

  // HUD CARD
  hudCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  hudTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrapper: {
    flex: 1,
    alignItems: "center",
  },
  hudSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 2,
  },
  hudTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sosText: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },

  divider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 12,
  },

  hudBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 2,
  },
  fareValueRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  fareCurrency: {
    fontSize: 16,
    fontWeight: "900",
    color: "#D32F2F",
    marginTop: 4,
    marginRight: 2,
  },
  fareValue: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedText: {
    color: "#059669",
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 4,
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%", // Allows ScrollView to expand cleanly
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 4,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
  },

  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  actionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionTitle: { color: "#0F172A", fontSize: 15, fontWeight: "800" },
  actionSubtext: { color: "#64748B", fontSize: 12, marginTop: 2 },
});
