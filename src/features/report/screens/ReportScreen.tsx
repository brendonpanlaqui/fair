import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// 1. EXTENDED ERD INTERFACE
interface ReportRecord {
  report_id: string;
  trip_id: string;
  body_number: string;
  violation_type: string;
  passenger_comments: string;
  status: "Pending" | "Investigating" | "Resolved";
  filed_at: string;
  admin_response?: string;
}

// 2. INITIAL MOCK DATA
const INITIAL_REPORTS: ReportRecord[] = [
  {
    report_id: "TKT-10492",
    trip_id: "TRP-88172B",
    body_number: "0888",
    violation_type: "Overcharging",
    passenger_comments:
      "Driver asked for ₱100 even though the app computed ₱80 with my student discount.",
    status: "Resolved",
    filed_at: "2026-03-12T18:00:00Z",
    admin_response:
      "Verified with the driver. A formal warning has been issued by the TODA President, and the excess ₱20 has been credited to your account.",
  },
  {
    report_id: "TKT-10550",
    trip_id: "TRP-99281A",
    body_number: "0406",
    violation_type: "Reckless Driving",
    passenger_comments:
      "Driver was texting while driving and almost hit a parked car near SM Clark.",
    status: "Investigating",
    filed_at: "2026-03-14T09:15:00Z",
  },
];

const ReportScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // STATES
  const [reports, setReports] = useState<ReportRecord[]>(INITIAL_REPORTS);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(
    null,
  );
  const [isFormVisible, setIsFormVisible] = useState(false);

  // NEW REPORT FORM STATES
  const [newTripId, setNewTripId] = useState("");
  const [newBodyNumber, setNewBodyNumber] = useState("");
  const [newViolation, setNewViolation] = useState("Overcharging");
  const [newComments, setNewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // UX MAGIC: Auto-open form if routed from HistoryScreen
  useEffect(() => {
    if (params.tripId && params.bodyNumber) {
      setNewTripId(params.tripId as string);
      setNewBodyNumber(params.bodyNumber as string);
      setIsFormVisible(true);
    }
  }, [params]);

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Pending":
        return "#F59E0B"; // Amber
      case "Investigating":
        return "#3B82F6"; // Blue
      case "Resolved":
        return "#10B981"; // Green
      default:
        return "#64748B"; // Slate
    }
  };

  const handleSubmitReport = () => {
    if (!newComments) {
      Alert.alert("Required", "Please provide details about the incident.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const newTicket: ReportRecord = {
        report_id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
        trip_id: newTripId || "Manual Entry",
        body_number: newBodyNumber || "Unknown",
        violation_type: newViolation,
        passenger_comments: newComments,
        status: "Pending",
        filed_at: new Date().toISOString(),
      };

      setReports([newTicket, ...reports]);
      setIsSubmitting(false);
      setIsFormVisible(false);
      setNewComments("");

      router.setParams({ tripId: "", bodyNumber: "" });

      Alert.alert(
        "Report Submitted",
        "Your ticket has been forwarded to the Angeles City PTRO.",
      );
    }, 1500);
  };

  const renderTicketCard = ({ item }: { item: ReportRecord }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => setSelectedReport(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <MaterialIcons name="confirmation-number" size={16} color="#64748B" />
          <Text style={styles.ticketId}>{item.report_id}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${getStatusColor(item.status)}15` },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(item.status) },
            ]}
          />
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {item.status}
          </Text>
        </View>
      </View>

      <Text style={styles.violationText}>{item.violation_type}</Text>
      <Text style={styles.commentsText} numberOfLines={2}>
        "{item.passenger_comments}"
      </Text>

      <View style={styles.cardFooter}>
        <Text style={styles.bodyNumberText}>
          Tricycle Body #{item.body_number}
        </Text>
        <Text style={styles.dateText}>{formatDate(item.filed_at)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* 1. BRAND RED HEADER (Centered like History Screen) */}
      <View style={styles.redHeaderBackground}>
        <Text style={styles.headerTitle}>Support Center</Text>
        <Text style={styles.headerSubtitle}>Track and file complaints</Text>
      </View>

      {/* 2. THE OVERLAPPING ACTION PILL (Replaces the FAB) */}
      <View style={styles.actionWrapper}>
        <TouchableOpacity
          style={styles.actionPill}
          activeOpacity={0.9}
          onPress={() => {
            setNewTripId("");
            setNewBodyNumber("");
            setIsFormVisible(true);
          }}
        >
          <MaterialIcons name="add-circle" size={22} color="#D32F2F" />
          <Text style={styles.actionPillText}>FILE NEW REPORT</Text>
        </TouchableOpacity>
      </View>

      {/* 3. THE LIST */}
      <FlatList
        data={reports}
        keyExtractor={(item) => item.report_id}
        renderItem={renderTicketCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyStateIconCircle}>
              <MaterialIcons name="gavel" size={40} color="#94A3B8" />
            </View>
            <Text style={styles.emptyStateTitle}>No reports filed</Text>
            <Text style={styles.emptyStateSubtitle}>
              If you experience overcharging or unsafe driving, file a report
              here.
            </Text>
          </View>
        )}
      />

      {/* ========================================== */}
      {/* 4. TICKET DETAILS MODAL (READ-ONLY) */}
      {/* ========================================== */}
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedReport(null)}
      >
        <View style={styles.modalOverlay}>
          {selectedReport && (
            <View style={styles.modalContent}>
              <View style={styles.modalDragHandle} />

              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Ticket Details</Text>
                <TouchableOpacity onPress={() => setSelectedReport(null)}>
                  <MaterialIcons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View
                style={[
                  styles.statusBanner,
                  {
                    backgroundColor: `${getStatusColor(selectedReport.status)}15`,
                    borderColor: getStatusColor(selectedReport.status),
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusBannerText,
                    { color: getStatusColor(selectedReport.status) },
                  ]}
                >
                  STATUS: {selectedReport.status.toUpperCase()}
                </Text>
              </View>

              <View
                style={[
                  styles.detailRow,
                  {
                    paddingBottom: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: "#F1F5F9",
                    marginBottom: 16,
                  },
                ]}
              >
                <Text style={styles.detailLabel}>EVIDENCE LEVEL</Text>
                {selectedReport.trip_id !== "Manual Entry" ? (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons
                      name="verified-user"
                      size={16}
                      color="#10B981"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "900",
                        color: "#10B981",
                        marginLeft: 4,
                      }}
                    >
                      VERIFIED APP TRIP
                    </Text>
                  </View>
                ) : (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons
                      name="report-problem"
                      size={16}
                      color="#F59E0B"
                    />
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "900",
                        color: "#F59E0B",
                        marginLeft: 4,
                      }}
                    >
                      MANUAL REPORT
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>TICKET ID</Text>
                <Text style={styles.detailValue}>
                  {selectedReport.report_id}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>DATE FILED</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedReport.filed_at)}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>TRICYCLE</Text>
                <Text style={styles.detailValue}>
                  Body #{selectedReport.body_number}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>VIOLATION</Text>
                <Text style={styles.detailValueRed}>
                  {selectedReport.violation_type}
                </Text>
              </View>

              <View style={styles.commentBox}>
                <Text style={styles.detailLabel}>YOUR REPORT</Text>
                <Text style={styles.commentBoxText}>
                  "{selectedReport.passenger_comments}"
                </Text>
              </View>

              {/* ADMIN RESPONSE */}
              {selectedReport.admin_response ? (
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
                  <Text style={styles.adminBoxText}>
                    {selectedReport.admin_response}
                  </Text>
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

      {/* ========================================== */}
      {/* 5. NEW REPORT FORM MODAL */}
      {/* ========================================== */}
      <Modal
        visible={isFormVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => {
          setIsFormVisible(false);
          router.setParams({ tripId: "", bodyNumber: "" });
        }}
      >
        <View style={styles.fullModalContainer}>
          <View style={styles.fullModalHeader}>
            <TouchableOpacity
              onPress={() => {
                setIsFormVisible(false);
                router.setParams({ tripId: "", bodyNumber: "" });
              }}
              style={{ padding: 4 }}
            >
              <MaterialIcons name="close" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.fullModalTitle}>File a Complaint</Text>
            <View style={{ width: 28 }} />
          </View>

          <View style={styles.formContent}>
            <View style={styles.warningBanner}>
              <MaterialIcons name="info-outline" size={20} color="#B91C1C" />
              <Text style={styles.warningText}>
                False reports may lead to account suspension. Please provide
                accurate details.
              </Text>
            </View>

            <View style={styles.formGroup}>
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <Text style={styles.inputLabel}>TRICYCLE BODY NUMBER</Text>
                {/* 🚀 Show a badge if it's auto-filled from history */}
                {newTripId !== "" && (
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <MaterialIcons name="verified" size={14} color="#10B981" />
                    <Text
                      style={{
                        fontSize: 10,
                        color: "#10B981",
                        fontWeight: "bold",
                        marginLeft: 4,
                      }}
                    >
                      AUTO-LINKED
                    </Text>
                  </View>
                )}
              </View>

              <TextInput
                // 🚀 Change style if it's locked
                style={[
                  styles.input,
                  newTripId !== "" && {
                    backgroundColor: "#E2E8F0",
                    color: "#64748B",
                  },
                ]}
                value={newBodyNumber}
                onChangeText={setNewBodyNumber}
                placeholder="e.g. 0406"
                keyboardType="number-pad"
                placeholderTextColor="#94A3B8"
                editable={newTripId === ""} // 🚀 LOCKS THE FIELD if there is a trip ID
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>VIOLATION TYPE</Text>
              <View style={styles.chipContainer}>
                {["Overcharging", "Refusal", "Detour", "Reckless Driving"].map(
                  (type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.chip,
                        newViolation === type && styles.chipActive,
                      ]}
                      onPress={() => setNewViolation(type)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          newViolation === type && styles.chipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ),
                )}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>INCIDENT DETAILS</Text>
              <TextInput
                style={styles.textArea}
                value={newComments}
                onChangeText={setNewComments}
                placeholder="Describe what happened..."
                placeholderTextColor="#94A3B8"
                multiline={true}
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.evidenceBtn} activeOpacity={0.7}>
              <MaterialIcons
                name="add-a-photo"
                size={20}
                color="#D32F2F"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.evidenceBtnText}>
                Attach Photo Evidence (Optional)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formFooter}>
            <TouchableOpacity
              style={styles.submitButton}
              activeOpacity={0.9}
              onPress={handleSubmitReport}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <MaterialIcons
                    name="send"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // 1. BRAND RED HEADER (Matches History Screen)
  redHeaderBackground: {
    backgroundColor: "#D32F2F", // Brand Crimson Red
    paddingTop: 65,
    paddingHorizontal: 24,
    paddingBottom: 45,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 15,
    color: "#FECACA",
    marginTop: 4,
    textAlign: "center",
  },

  // 2. THE OVERLAPPING ACTION PILL
  actionWrapper: {
    alignItems: "center",
    marginTop: -28, // Pulls the pill up to overlap the border
    zIndex: 10,
  },
  actionPill: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28, // Fully rounded
    alignItems: "center",
    elevation: 8,
    shadowColor: "#0F172A", // Soft slate shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  actionPillText: {
    color: "#D32F2F",
    fontSize: 14,
    fontWeight: "900",
    letterSpacing: 0.5,
    marginLeft: 8,
  },

  // 3. THE LIST
  listContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F8FAFC",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  ticketId: {
    fontSize: 13,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3, marginRight: 6 },
  statusText: { fontSize: 11, fontWeight: "900", letterSpacing: 0.5 },

  violationText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  commentsText: {
    fontSize: 14,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 16,
    lineHeight: 20,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  bodyNumberText: { fontSize: 13, fontWeight: "800", color: "#334155" },
  dateText: { fontSize: 12, color: "#94A3B8", fontWeight: "600" },

  // EMPTY STATE
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 40,
    paddingHorizontal: 32,
  },
  emptyStateIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },

  // --- TICKET DETAILS MODAL ---
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

  // --- NEW REPORT FORM MODAL ---
  fullModalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 55, // Ensure status bar clearance
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  fullModalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  formContent: { flex: 1, padding: 24 },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FFF1F2", // Match your active tabs
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#BE123C", // Deeper red for text
    marginLeft: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  formGroup: { marginBottom: 24 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: "#0F172A",
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#FFF1F2", borderColor: "#D32F2F" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  chipTextActive: { color: "#D32F2F", fontWeight: "800" },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    color: "#0F172A",
    minHeight: 120,
  },
  evidenceBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    borderStyle: "dashed",
  },
  evidenceBtnText: { fontSize: 14, fontWeight: "800", color: "#D32F2F" },
  formFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

export default ReportScreen;
