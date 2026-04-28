import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  ReportRecord,
  formatDate,
  getStatusColor,
  getViolationLabel,
} from "../reportUtils";

interface ReportDetailModalProps {
  report: ReportRecord | null;
  onClose: () => void;
}

export default function ReportDetailModal({
  report,
  onClose,
}: ReportDetailModalProps) {
  // opens when a user taps a specific ticket card from the list
  return (
    <Modal
      visible={report !== null}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {report && (
          <View style={styles.modalContent}>
            <View style={styles.modalDragHandle} />

            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Ticket Details</Text>
              <TouchableOpacity onPress={onClose}>
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.statusBanner,
                {
                  backgroundColor: `${getStatusColor(report.status)}15`,
                  borderColor: getStatusColor(report.status),
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBannerText,
                  { color: getStatusColor(report.status) },
                ]}
              >
                STATUS: {report.status.toUpperCase()}
              </Text>
            </View>

            <View style={styles.detailRowUnderline}>
              <Text style={styles.detailLabel}>EVIDENCE LEVEL</Text>
              {/* if linked to specific trip, otherwise manual report*/}
              {report.trip ? (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons
                    name="verified-user"
                    size={16}
                    color="#10B981"
                  />
                  <Text style={styles.verifiedText}>VERIFIED APP TRIP</Text>
                </View>
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons
                    name="report-problem"
                    size={16}
                    color="#F59E0B"
                  />
                  <Text style={styles.manualText}>
                    UNVERIFIED (AWAITING REPORTS)
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TICKET ID</Text>
              <Text style={styles.detailValue}>{report.report_id}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>DATE FILED</Text>
              <Text style={styles.detailValue}>
                {formatDate(report.filed_at)}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>TRICYCLE</Text>
              <Text style={styles.detailValue}>Body #{report.body_number}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>VIOLATION</Text>
              <Text style={styles.detailValueRed}>
                {getViolationLabel(report.violation_type)}
              </Text>
            </View>

            <View style={styles.commentBox}>
              <Text style={styles.detailLabel}>YOUR REPORT</Text>
              <Text style={styles.commentBoxText}>
                "{report.passenger_comments}"
              </Text>
            </View>

            {/* only shows when admin provide response */}
            {report.admin_response ? (
              <View style={styles.adminBox}>
                <View style={styles.adminBoxHeader}>
                  <MaterialIcons
                    name="admin-panel-settings"
                    size={16}
                    color="#059669"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.adminBoxTitle}>ADMIN RESOLUTION</Text>
                </View>
                <Text style={styles.adminBoxText}>{report.admin_response}</Text>
              </View>
            ) : (
              <Text style={styles.pendingText}>
                Waiting for admin review...
              </Text>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  modalDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  statusBanner: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 24,
  },
  statusBannerText: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailRowUnderline: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#10B981",
    marginLeft: 4,
  },
  manualText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#F59E0B",
    marginLeft: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  detailValueRed: { fontSize: 14, fontWeight: "900", color: "#D32F2F" },
  commentBox: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  commentBoxText: {
    fontSize: 14,
    color: "#334155",
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 22,
  },
  adminBox: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  adminBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  adminBoxTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: 0.5,
  },
  adminBoxText: { fontSize: 14, color: "#065F46", lineHeight: 22 },
  pendingText: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 24,
    fontStyle: "italic",
  },
});
