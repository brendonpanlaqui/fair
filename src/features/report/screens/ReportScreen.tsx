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
  admin_response?: string; // <-- Added based on Architectural Feedback
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
        return "#64748B";
    }
  };

  // SIMULATE FORM SUBMISSION FOR THESIS DEMO
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

      // Add to top of list
      setReports([newTicket, ...reports]);
      setIsSubmitting(false);
      setIsFormVisible(false);
      setNewComments("");

      // Clear URL params so it doesn't auto-open again
      router.setParams({ tripId: "", bodyNumber: "" });

      Alert.alert(
        "Report Submitted",
        "Your ticket has been forwarded to the Angeles City PTRO.",
      );
    }, 1500);
  };

  // ==========================================
  // UI: LIST CARD
  // ==========================================
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

      {/* BRAND RED HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Support Center</Text>
        <Text style={styles.headerSubtitle}>Track and file complaints</Text>
      </View>

      {/* FAB (Floating Action Button) to manually create a report */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.9}
        onPress={() => {
          setNewTripId("");
          setNewBodyNumber("");
          setIsFormVisible(true);
        }}
      >
        <MaterialIcons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      <FlatList
        data={reports}
        keyExtractor={(item) => item.report_id}
        renderItem={renderTicketCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* ========================================== */}
      {/* 1. TICKET DETAILS MODAL (READ-ONLY) */}
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

              {/* RENDER ADMIN RESPONSE IF IT EXISTS */}
              {selectedReport.admin_response ? (
                <View style={styles.adminBox}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginBottom: 8,
                    }}
                  >
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
      {/* 2. NEW REPORT FORM MODAL */}
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
            {/* UPDATED CLOSE BUTTON: Clears the URL parameters! */}
            <TouchableOpacity
              onPress={() => {
                setIsFormVisible(false);
                router.setParams({ tripId: "", bodyNumber: "" }); // <-- THE FIX
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
              <Text style={styles.inputLabel}>TRICYCLE BODY NUMBER</Text>
              <TextInput
                style={styles.input}
                value={newBodyNumber}
                onChangeText={setNewBodyNumber}
                placeholder="e.g. 0406"
                keyboardType="number-pad"
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
                multiline={true}
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity style={styles.evidenceBtn} activeOpacity={0.7}>
              <MaterialIcons
                name="add-a-photo"
                size={20}
                color="#E53935"
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

  // BRAND RED HEADER
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#E53935",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -0.5,
  },
  headerSubtitle: { fontSize: 13, color: "#FFCDD2", marginTop: 4 },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 10,
  },

  listContent: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#F1F5F9",
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
    fontWeight: "bold",
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
  statusText: { fontSize: 11, fontWeight: "bold", letterSpacing: 0.5 },

  violationText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  commentsText: {
    fontSize: 13,
    color: "#475569",
    fontStyle: "italic",
    marginBottom: 16,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  bodyNumberText: { fontSize: 13, fontWeight: "bold", color: "#334155" },
  dateText: { fontSize: 12, color: "#94A3B8" },

  // --- TICKET DETAILS MODAL ---
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(15, 23, 42, 0.6)",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
  modalTitle: { fontSize: 20, fontWeight: "900", color: "#0F172A" },
  statusBanner: {
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    marginBottom: 20,
  },
  statusBannerText: { fontSize: 12, fontWeight: "900", letterSpacing: 1 },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#94A3B8",
    letterSpacing: 0.5,
  },
  detailValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  detailValueRed: { fontSize: 14, fontWeight: "900", color: "#E53935" },
  commentBox: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  commentBoxText: {
    fontSize: 14,
    color: "#334155",
    marginTop: 8,
    fontStyle: "italic",
    lineHeight: 20,
  },
  adminBox: {
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  adminBoxTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#059669",
    letterSpacing: 0.5,
  },
  adminBoxText: { fontSize: 14, color: "#065F46", lineHeight: 20 },
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
    paddingTop: 45,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  fullModalTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  formContent: { flex: 1, padding: 20 },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#991B1B",
    marginLeft: 12,
    lineHeight: 18,
  },
  formGroup: { marginBottom: 24 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94A3B8",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: "#0F172A",
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#FEF2F2", borderColor: "#E53935" },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#E53935" },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
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
    backgroundColor: "#FEF2F2",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderStyle: "dashed",
  },
  evidenceBtnText: { fontSize: 14, fontWeight: "bold", color: "#E53935" },
  formFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#E53935",
    flexDirection: "row",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default ReportScreen;
