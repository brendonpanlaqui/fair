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
        <View style={styles.dragHandle} />

        <View style={styles.statusRow}>
          <TouchableOpacity
            style={styles.onRouteBadge}
            activeOpacity={0.9}
            onPress={onSecretTrigger}
          >
            <MaterialIcons
              name="alt-route"
              size={14}
              color="#10B981"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.onRouteText}>{"ON ROUTE"}</Text>
          </TouchableOpacity>

          <Text style={styles.updatedText}>{"GPS Active"}</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="schedule" size={16} color="#64748B" />
              <Text style={styles.metricLabel}>{"EST. ARRIVAL"}</Text>
            </View>
            <View style={styles.metricValueRow}>
              {/* 🚀 FIX: Converting the number variable safely to a string */}
              <Text style={styles.metricValue}>{`${estimatedMinutes}`}</Text>
              <Text style={styles.metricUnit}>{"min"}</Text>
            </View>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricHeader}>
              <MaterialIcons name="place" size={16} color="#64748B" />
              <Text style={styles.metricLabel}>{"DISTANCE"}</Text>
            </View>
            <View style={styles.metricValueRow}>
              {/* 🚀 FIX: Stringifying the fixed distance */}
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
          <MaterialIcons
            name="stop-circle"
            size={24}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.endTripText}>{"End Trip Now"}</Text>
        </TouchableOpacity>
      </View>

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
                <MaterialIcons name="location-on" size={32} color="#D32F2F" />
              </View>
            </View>

            <Text style={styles.modalTitle}>{"End this trip?"}</Text>
            <Text style={styles.modalSubtitle}>
              {
                "Are you sure you have arrived at your destination? Your final fare and map-trace will be locked."
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
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  dragHandle: {
    width: 48,
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
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
  updatedText: { color: "#94A3B8", fontSize: 12, fontWeight: "600" },
  metricsGrid: { flexDirection: "row", gap: 16, marginBottom: 24 },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  metricHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  metricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  metricValueRow: { flexDirection: "row", alignItems: "baseline" },
  metricValue: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  metricUnit: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "700",
    marginLeft: 4,
  },
  endTripButton: {
    flexDirection: "row",
    height: 60,
    borderRadius: 20,
    backgroundColor: "#D32F2F",
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
    fontWeight: "bold",
    letterSpacing: 0.5,
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
    alignItems: "center",
  },
  modalIconContainer: { marginBottom: 20, marginTop: 8 },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
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
    elevation: 2,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  cancelBtn: {
    height: 56,
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelBtnText: { color: "#0F172A", fontSize: 16, fontWeight: "bold" },
});
