// src/features/report/screens/ReportScreen.tsx
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native"; // 🚨 IMPORT THIS
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
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
import TicketCard from "../components/TicketCard";
import { ReportRecord } from "../reportUtils";

const ReportScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user, logout } = useAuth();
  const isGuest = !user || user.is_guest || user.first_name === "Guest";

  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [selectedReport, setSelectedReport] = useState<ReportRecord | null>(
    null,
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAnyModalOpen = selectedReport !== null;

  const fetchReports = async (isPullToRefresh = false) => {
    if (isGuest) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (!isPullToRefresh) setIsLoading(true);
      setError(null);
      const response = await api.get<ReportRecord[]>("/reports/history/");
      setReports(response.data);
    } catch (err) {
      console.warn("API Error:", err);
      setError(
        "Could not connect to the LGU server. Please check your connection.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // 🚨 PASTE THIS MISSING FUNCTION RIGHT HERE
  const onRefresh = () => {
    setIsRefreshing(true);
    fetchReports(true);
  };

  // 🚨 Refresh reports every time this screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchReports();
    }, [user]),
  );

  // 🚨 Automatically route to the new screen if opened from History
  useEffect(() => {
    if (params.tripId && params.bodyNumber && user) {
      router.push({
        pathname: "/file-report",
        params: { tripId: params.tripId, bodyNumber: params.bodyNumber },
      });
      // Clear params to prevent looping
      router.setParams({ tripId: "", bodyNumber: "" });
    }
  }, [params, user]);

  return (
    <View style={styles.container}>
      <StatusBar style={isAnyModalOpen ? "dark" : "light"} />

      {/* HEADER */}
      <View style={styles.redHeaderBackground}>
        <Text style={styles.headerTitle}>Support Center</Text>
        <Text style={styles.headerSubtitle}>Track and file complaints</Text>
      </View>

      {/* FILE NEW REPORT BUTTON */}
      <View style={styles.actionWrapper}>
        <TouchableOpacity
          style={[
            styles.actionPill,
            isGuest && {
              backgroundColor: "#F8FAFC",
              elevation: 0,
              shadowOpacity: 0,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            },
          ]}
          activeOpacity={0.9}
          disabled={isGuest}
          onPress={() => router.push("/file-report")} // 🚨 ROUTE TO NEW SCREEN
        >
          <MaterialIcons
            name="add-circle"
            size={22}
            color={isGuest ? "#CBD5E1" : "#D32F2F"}
          />
          <Text
            style={[styles.actionPillText, isGuest && { color: "#94A3B8" }]}
          >
            FILE NEW REPORT
          </Text>
        </TouchableOpacity>
      </View>

      {/* GUEST VS LOGGED IN STATES */}
      {isGuest ? (
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrapper}>
            <MaterialIcons name="security" size={36} color="#D32F2F" />
          </View>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestText}>
            Create an account or sign in to submit verified reports, monitor
            ticket status, and manage your concerns.
          </Text>
          <TouchableOpacity
            style={styles.guestLoginBtn}
            activeOpacity={0.8}
            onPress={async () => {
              if (logout) await logout();
              router.replace("/auth");
            }}
          >
            <Text style={styles.guestLoginBtnText}>Sign In / Register</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Fetching your reports...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="cloud-off" size={48} color="#CBD5E1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchReports()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
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

      <ReportDetailModal
        report={selectedReport}
        onClose={() => setSelectedReport(null)}
      />
    </View>
  );
};

// ... keep all the same styles from your original ReportScreen.tsx below ...
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
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: -1,
    textAlign: "center",
  },
  headerSubtitle: {
    fontSize: 14,
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
    paddingTop: 40,
  },
  guestIconWrapper: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  guestText: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  guestLoginBtn: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 20,
    height: 40,
    justifyContent: "center",
    borderRadius: 14,
    elevation: 4,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  guestLoginBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
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
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 32,
  },
  retryButton: {
    marginTop: 24,
    backgroundColor: "#FFF1F2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  retryButtonText: { color: "#D32F2F", fontWeight: "bold", fontSize: 14 },

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
