import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";
import ReportDetailModal from "../components/ReportDetailModal";
import ReportFormModal from "../components/ReportFormModal";
import TicketCard from "../components/TicketCard";
import { ReportRecord } from "../reportUtils";

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

  // data sent from History routing
  const [initialTripId, setInitialTripId] = useState("");
  const [initialBodyNumber, setInitialBodyNumber] = useState("");

  const isAnyModalOpen = isFormVisible || selectedReport !== null;

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
      setInitialTripId(params.tripId as string);
      setInitialBodyNumber(params.bodyNumber as string);
      setIsFormVisible(true);
    }
  }, [params, user]);

  const closeForm = () => {
    setIsFormVisible(false);
    setInitialTripId("");
    setInitialBodyNumber("");
    router.setParams({ tripId: "", bodyNumber: "" });
  };

  return (
    <View style={styles.container}>
      <StatusBar style={isAnyModalOpen ? "dark" : "light"} />

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
            setInitialTripId("");
            setInitialBodyNumber("");
            setIsFormVisible(true);
          }}
        >
          <MaterialIcons
            name="add-circle"
            size={22}
            color={!user ? "#CBD5E1" : "#D32F2F"}
          />
          <Text style={[styles.actionPillText, !user && { color: "#94A3B8" }]}>
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
          renderItem={({ item }) => (
            <TicketCard item={item} onPress={() => setSelectedReport(item)} />
          )}
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

      {/* MODALS ABSTRACTION */}
      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />

      <ReportFormModal
        visible={isFormVisible}
        onClose={closeForm}
        onSubmitSuccess={() => {
          fetchReports();
          closeForm();
        }}
        initialTripId={initialTripId}
        initialBodyNumber={initialBodyNumber}
      />
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
  actionWrapper: { alignItems: "center", marginTop: -28, zIndex: 10 },
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
  listContent: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 100 },

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
});

export default ReportScreen;
