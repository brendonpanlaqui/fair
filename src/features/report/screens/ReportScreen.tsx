import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";

// again match the Django (ReportHistorySerializer)
interface ReportRecord {
  report_id: string;
  trip: string | null;
  body_number: string;
  violation_type: string;
  passenger_comments: string;
  status: "Pending" | "Investigating" | "Resolved" | "Dismissed";
  filed_at: string;
  admin_response?: string;
}

const ReportScreen = () => {
  const router = useRouter();
  // grab the parameters passed in the URL (e.g., ?tripId=123&bodyNumber=0406)
  const params = useLocalSearchParams();
  const { user } = useAuth(); // the logged-in user

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(
    null,
  );
  // controls whether the "File a Complaint" form pop-up is visible
  const [isFormVisible, setIsFormVisible] = useState(false);

  // used to show loading spinners while waiting for Django
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // holds the data the user types into the form
  const [newTripId, setNewTripId] = useState("");
  const [newBodyNumber, setNewBodyNumber] = useState("");
  const [newViolation, setNewViolation] = useState("Overcharging");
  const [newComments, setNewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchReports = async (isPullToRefresh = false) => {
    // if guest, skip the API call
    if (!user) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (!isPullToRefresh) setIsLoading(true);
      // request the user's report history from Django
      const response = await api.get<ReportRecord[]>("/reports/history/");
      setReports(response.data);
    } catch (err) {
      console.warn("API Error:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchReports(true);
  };

  // it assumes the user wants to report that specific trip, so it opens the form automatically.
  useEffect(() => {
    if (params.tripId && params.bodyNumber && user) {
      setNewTripId(params.tripId as string);
      setNewBodyNumber(params.bodyNumber as string);
      setIsFormVisible(true);
    }
  }, [params, user]);

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
        return "#F59E0B";
      case "Investigating":
        return "#3B82F6";
      case "Resolved":
        return "#10B981";
      case "Dismissed":
        return "#EF4444";
      default:
        return "#64748B";
    }
  };

  const handleSubmitReport = async () => {
    // to provide comments to at least describe the incident
    if (!newComments) {
      Alert.alert("Required", "Please provide details about the incident.");
      return;
    }

    setIsSubmitting(true);
    try {
      // yung payload para sa Django
      const payload = {
        report_id: `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
        user: user?.id,
        trip: newTripId || null,
        manual_body_number: newTripId ? null : newBodyNumber,
        violation_type: newViolation,
        passenger_comments: newComments,
      };

      // sends the report to the backend
      await api.post("/reports/submit/", payload);

      // kung tapos na, close the form, reset the fields, and refresh the report list to show the new ticket
      fetchReports();
      setIsFormVisible(false);
      setNewComments("");
      router.setParams({ tripId: "", bodyNumber: "" });

      Alert.alert(
        "Report Submitted",
        "Your ticket has been forwarded to the Angeles City PTRO.",
      );
    } catch (error) {
      console.warn("Submit Error:", error);
      Alert.alert("Error", "Could not submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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

      {/* HEADER */}
      <View style={styles.redHeaderBackground}>
        <Text style={styles.headerTitle}>Support Center</Text>
        <Text style={styles.headerSubtitle}>Track and file complaints</Text>
      </View>

      {/* (ALWAYS VISIBLE BUT DISABLED FOR GUESTS) */}
      <View style={styles.actionWrapper}>
        <TouchableOpacity
          style={[
            styles.actionPill,
            !user && {
              backgroundColor: "#F8FAFC",
              elevation: 0,
              shadowOpacity: 0,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            },
          ]}
          activeOpacity={0.9}
          disabled={!user} // if guest
          onPress={() => {
            setNewTripId("");
            setNewBodyNumber("");
            setIsFormVisible(true);
          }}
        >
          <MaterialIcons
            name="add-circle"
            size={22}
            color={!user ? "#CBD5E1" : "#D32F2F"} // if guest
          />
          <Text
            style={[
              styles.actionPillText,
              !user && { color: "#94A3B8" }, // if guest
            ]}
          >
            FILE NEW REPORT
          </Text>
        </TouchableOpacity>
      </View>

      {/* (GUEST VS LOGGED IN) */}
      {!user ? (
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrapper}>
            <MaterialIcons name="security" size={48} color="#D32F2F" />
          </View>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestText}>
            To prevent false complaints, filing a report with the Angeles City
            PTRO requires a verified account. Sign in to track and manage your
            support tickets.
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            activeOpacity={0.8}
            onPress={() => router.replace("/")}
          >
            <Text style={styles.guestLoginBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Fetching your reports...</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.report_id}
          renderItem={renderTicketCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#D32F2F"
              colors={["#D32F2F"]}
            />
          }
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
      )}

      {/* opens when a user taps a specific ticket card from the list */}
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
                {/* if linked to specific trip, otherwise manual report*/}
                {selectedReport.trip ? (
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

              {/* only shows when admin provide response */}
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

      {/* REPORT FORM MODAL */}
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
                editable={newTripId === ""} // if linked from the HistoryScreen
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  redHeaderBackground: {
    backgroundColor: "#D32F2F",
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

  guestContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  guestIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  guestTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  guestText: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  guestLoginBtn: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 4,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  guestLoginBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
  },

  actionWrapper: {
    alignItems: "center",
    marginTop: -28,
    zIndex: 10,
  },
  actionPill: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 28,
    alignItems: "center",
    elevation: 8,
    shadowColor: "#0F172A",
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

  fullModalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  fullModalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  formContent: { flex: 1, padding: 24 },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FFF1F2",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#BE123C",
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
