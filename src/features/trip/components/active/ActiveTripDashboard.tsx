import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  estimatedMinutes: number;
  lockedDistance: number;
  onSecretTrigger: () => void;
  onEndTrip: () => void;
}

export const ActiveTripDashboard = ({
  estimatedMinutes,
  lockedDistance,
  onSecretTrigger,
  onEndTrip,
}: Props) => {
  const [showEndModal, setShowEndModal] = useState(false);

  const confirmEndTrip = () => {
    setShowEndModal(false);
    onEndTrip();
  };

  return (
    <>
      <View style={styles.bottomSheet}>
        {/* Subtle decorative notch, not an aggressive drag handle */}
        <View style={styles.notch} />

        <View style={styles.statusRow}>
          <TouchableOpacity
            style={styles.onRouteBadge}
            activeOpacity={0.9}
            onPress={onSecretTrigger}
          >
            <MaterialIcons
              name="near-me"
              size={14}
              color="#10B981"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.onRouteText}>{"ON ROUTE"}</Text>
          </TouchableOpacity>

          {/* 🚀 UPGRADE: The "Live" GPS Indicator */}
          <View style={styles.gpsContainer}>
            <View style={styles.liveDot} />
            <Text style={styles.updatedText}>{"GPS Active"}</Text>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="schedule" size={16} color="#94A3B8" />
              <Text style={styles.metricLabel}>{"EST. ARRIVAL"}</Text>
            </View>
            <View style={styles.metricValueRow}>
              <Text style={styles.metricValue}>{`${estimatedMinutes}`}</Text>
              <Text style={styles.metricUnit}>{"min"}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="moving" size={16} color="#94A3B8" />
              <Text style={styles.metricLabel}>{"DISTANCE"}</Text>
            </View>
            <View style={styles.metricValueRow}>
              <Text
                style={styles.metricValue}
              >{`${lockedDistance.toFixed(1)}`}</Text>
              <Text style={styles.metricUnit}>{"km"}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.endTripButton}
          activeOpacity={0.9}
          onPress={() => setShowEndModal(true)}
        >
          {/* changed from stop-circle to a check-circle */}
          <MaterialIcons
            name="check-circle"
            size={24}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          {/* changed from End Trip Now */}
          <Text style={styles.endTripText}>{"Complete Ride"}</Text>
        </TouchableOpacity>
      </View>

      {/* 🚀 UPGRADED END TRIP MODAL */}
      <Modal
        visible={showEndModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <View style={styles.modalIconBg}>
                <MaterialIcons name="flag" size={32} color="#D32F2F" />
              </View>
            </View>

            <Text style={styles.modalTitle}>{"End this trip?"}</Text>
            <Text style={styles.modalSubtitle}>
              {
                "Are you sure you have arrived at your destination? Your final fare and map-trace will be permanently locked."
              }
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.confirmBtn}
                activeOpacity={0.9}
                onPress={confirmEndTrip}
              >
                <Text style={styles.confirmBtnText}>{"Yes, End Trip"}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelBtn}
                activeOpacity={0.7}
                onPress={() => setShowEndModal(false)}
              >
                <Text style={styles.cancelBtnText}>{"Keep Riding"}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    elevation: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  notch: {
    width: 40,
    height: 4,
    backgroundColor: "#F1F5F9", // Much lighter, softer gray
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  onRouteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  onRouteText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  gpsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981", // Bright green
    marginRight: 6,
  },
  updatedText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9", // Softer border than before
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    color: "#94A3B8", // Receded label color
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 1,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  metricUnit: {
    color: "#94A3B8", // Receded unit color to make numbers pop
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 4,
  },
  endTripButton: {
    flexDirection: "row",
    height: 60,
    borderRadius: 20,
    backgroundColor: "#D32F2F", // Brand Crimson
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  endTripText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: 0.5,
  },

  // 🚀 MODAL STYLES
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
    alignItems: "center",
  },
  modalIconContainer: { marginBottom: 20, marginTop: 8 },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF1F2", // Matched to brand pink
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  modalActions: { width: "100%", gap: 12 },
  confirmBtn: {
    height: 56,
    backgroundColor: "#D32F2F",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "900" },
  cancelBtn: {
    height: 56,
    backgroundColor: "#F8FAFC", // Softer neutral background
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { color: "#0F172A", fontSize: 16, fontWeight: "800" },
});
