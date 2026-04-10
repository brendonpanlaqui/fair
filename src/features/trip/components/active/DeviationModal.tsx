import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  visible: boolean;
  onClose: () => void;
  onReport: () => void;
}

export const DeviationModal = ({ visible, onClose, onReport }: Props) => (
  <Modal visible={visible} animationType="fade" transparent={true}>
    <View style={styles.deviationOverlay}>
      <View style={styles.deviationCard}>
        <View style={styles.warningIconCircle}>
          <MaterialIcons name="warning" size={32} color="#DC2626" />
        </View>
        <Text style={styles.deviationTitle}>Route Deviation Detected</Text>
        <Text style={styles.deviationText}>
          You have significantly drifted from the agreed route. Are you safe?
        </Text>
        <View style={styles.deviationActions}>
          <TouchableOpacity
            style={styles.safeBtn}
            activeOpacity={0.8}
            onPress={onClose}
          >
            <Text style={styles.safeBtnText}>I'M SAFE, WE TOOK A SHORTCUT</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.endRideBtn}
            activeOpacity={0.9}
            onPress={onReport}
          >
            <Text style={styles.endRideBtnText}>END RIDE & REPORT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  deviationOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  deviationCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    alignItems: "center",
    elevation: 10,
  },
  warningIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "#FECACA",
  },
  deviationTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    textAlign: "center",
  },
  deviationText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  deviationActions: { width: "100%", gap: 12 },
  safeBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
  },
  safeBtnText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  endRideBtn: {
    width: "100%",
    flexDirection: "row",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#DC2626",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  endRideBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});
