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
      <View style={styles.hudCard}>
        {/* PERFECTLY BALANCED TOP ROW */}
        <View style={styles.hudTopRow}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.titleWrapper}>
            <Text style={styles.hudSubtitle}>{"ACTIVE RIDE"}</Text>
            {/* Verification is tied to the body number */}
            <View style={styles.bodyNumberRow}>
              <Text style={styles.hudTitle}>{`Body #${bodyNumber}`}</Text>
              <MaterialIcons
                name="verified"
                size={16}
                color="#10B981"
                style={styles.verifiedIcon}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.iconButton, styles.sosButton]}
            activeOpacity={0.8}
            onPress={() => setSosVisible(true)}
          >
            <MaterialIcons name="health-and-safety" size={24} color="#DC2626" />
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        {/* CLEAN, TRANSACTIONAL BOTTOM ROW */}
        <View style={styles.hudBottomRow}>
          <View>
            <Text style={styles.fareLabel}>{"GUARANTEED FARE"}</Text>
            <View style={styles.fareValueRow}>
              <Text style={styles.fareCurrency}>{"₱"}</Text>
              <Text style={styles.fareValue}>{`${fixedFare.toFixed(2)}`}</Text>
            </View>
          </View>

          {/* Replaced the green badge with a subtle pricing tag */}
          <View style={styles.fareTagBadge}>
            <MaterialIcons name="lock-outline" size={14} color="#64748B" />
            <Text style={styles.fareTagText}>{"Fixed Rate"}</Text>
          </View>
        </View>
      </View>

      {/* SOS MODAL (Unchanged but sanitized) */}
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
                <Text style={styles.modalTitle}>{"Emergency Center"}</Text>
                <Text style={styles.modalSubtitle}>
                  {`Current Ride: Body #${bodyNumber}`}
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
              <Text style={styles.sectionLabel}>{"CRITICAL EMERGENCY"}</Text>
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
                    {"National Emergency (911)"}
                  </Text>
                  <Text style={styles.actionSubtext}>
                    {"Police, Medical, or Rescue"}
                  </Text>
                </View>
                <MaterialIcons name="call" size={24} color="#CBD5E1" />
              </TouchableOpacity>

              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
                {"POLICE & TRAFFIC"}
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
                  <Text style={styles.actionTitle}>{"PNP - Traffic Unit"}</Text>
                  <Text style={styles.actionSubtext}>
                    {"Collisions & disputes"}
                  </Text>
                </View>
                <MaterialIcons name="call" size={24} color="#CBD5E1" />
              </TouchableOpacity>

              <Text style={[styles.sectionLabel, { marginTop: 8 }]}>
                {"FARE & REGULATION"}
              </Text>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.8}
                onPress={() => handleCall("09931696052")}
              >
                <View
                  style={[styles.actionIconBg, { backgroundColor: "#F8FAFC" }]}
                >
                  <MaterialIcons name="gavel" size={24} color="#0F172A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>{"PTRO Angeles City"}</Text>
                  <Text style={styles.actionSubtext}>
                    {"Report overcharging"}
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
    zIndex: 100,
  },
  hudCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  hudTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
  },
  sosButton: {
    backgroundColor: "#FFF1F2",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  titleWrapper: { flex: 1, alignItems: "center" },
  hudSubtitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  bodyNumberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  hudTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  verifiedIcon: {
    marginLeft: 6,
    marginTop: 2,
  },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginVertical: 16 },
  hudBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  fareValueRow: { flexDirection: "row", alignItems: "flex-start" },
  fareCurrency: {
    fontSize: 16,
    fontWeight: "900",
    color: "#D32F2F",
    marginTop: 4,
    marginRight: 4,
  },
  fareValue: {
    fontSize: 32,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -1,
  },
  fareTagBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 4,
  },
  fareTagText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    marginLeft: 4,
    textTransform: "uppercase",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginTop: 4,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  actionTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 2,
  },
  actionSubtext: { color: "#64748B", fontSize: 13, fontWeight: "500" },
});
