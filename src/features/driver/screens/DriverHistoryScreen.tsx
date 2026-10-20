import { api } from "@/src/services/api";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Define the shape of the trip data based on your Django models
interface TripHistory {
  trip_id: string;
  status: string;
  timestamp: string;
  actual_fare_charged: string | number;
  computed_fare: string | number;
  total_distance_km: number;
  destination_address?: string;
  dest_name?: string;
}

export default function DriverHistoryScreen() {
  const [trips, setTrips] = useState<TripHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch history every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const fetchHistory = async () => {
        setIsLoading(true);
        try {
          const response = await api.get("/trips/history/");
          if (isActive) {
            setTrips(response.data);
          }
        } catch (error) {
          console.error("Failed to fetch driver history:", error);
        } finally {
          if (isActive) setIsLoading(false);
        }
      };

      fetchHistory();

      return () => {
        isActive = false;
      };
    }, []),
  );

  // Helper to format ISO strings to readable dates (e.g., "Oct 17, 2026 • 2:30 PM")
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  // Calculate summary metrics for the header
  const completedTrips = trips.filter((t) => t.status.includes("Completed"));
  const totalEarnings = completedTrips.reduce(
    (sum, trip) =>
      sum + Number(trip.actual_fare_charged || trip.computed_fare || 0),
    0,
  );

  const renderTripCard = ({ item }: { item: TripHistory }) => {
    const isCompleted = item.status.includes("Completed");
    const isCancelled = item.status === "Cancelled";

    // Fallback to computed fare if actual isn't set yet
    const fare = Number(
      item.actual_fare_charged || item.computed_fare || 0,
    ).toFixed(2);

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          <View
            style={[
              styles.statusBadge,
              isCompleted
                ? styles.statusCompleted
                : isCancelled
                  ? styles.statusCancelled
                  : styles.statusPending,
            ]}
          >
            <Text
              style={[
                styles.statusText,
                isCompleted
                  ? styles.textCompleted
                  : isCancelled
                    ? styles.textCancelled
                    : styles.textPending,
              ]}
            >
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.destinationRow}>
            <MaterialIcons name="place" size={20} color="#D32F2F" />
            <Text style={styles.destinationText} numberOfLines={1}>
              {item.dest_name ||
                item.destination_address ||
                "Unknown Destination"}
            </Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={16}
                color="#64748B"
              />
              <Text style={styles.metricText}>
                {item.total_distance_km.toFixed(1)} km
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.fareLabel}>Fare:</Text>
              <Text
                style={[
                  styles.fareValue,
                  isCancelled && styles.fareValueCancelled,
                ]}
              >
                ₱{fare}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header Title */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
      </View>

      {/* Summary Widget */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>TOTAL EARNINGS</Text>
          <Text style={styles.summaryValueRed}>
            ₱{totalEarnings.toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>COMPLETED TRIPS</Text>
          <Text style={styles.summaryValueDark}>{completedTrips.length}</Text>
        </View>
      </View>

      {/* History List */}
      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Loading history...</Text>
        </View>
      ) : trips.length === 0 ? (
        <View style={styles.centerContainer}>
          <MaterialCommunityIcons
            name="clipboard-text-off-outline"
            size={64}
            color="#CBD5E1"
          />
          <Text style={styles.emptyTitle}>No Trips Yet</Text>
          <Text style={styles.emptySubtitle}>
            Your completed trips will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.trip_id}
          renderItem={renderTripCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  // Summary Widget
  summaryContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 24,
    borderRadius: 20,
    paddingVertical: 20,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  summaryBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValueRed: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D32F2F",
    letterSpacing: -0.5,
  },
  summaryValueDark: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  // List & Cards
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dateText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusCompleted: { backgroundColor: "#ECFDF5" },
  statusCancelled: { backgroundColor: "#FEF2F2" },
  statusPending: { backgroundColor: "#FFFBEB" },

  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  textCompleted: { color: "#10B981" },
  textCancelled: { color: "#EF4444" },
  textPending: { color: "#F59E0B" },

  cardBody: {
    gap: 12,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  destinationText: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  metricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  metricItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  metricText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  fareLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#94A3B8",
  },
  fareValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#D32F2F",
  },
  fareValueCancelled: {
    color: "#94A3B8",
    textDecorationLine: "line-through",
  },

  // Empty & Loading States
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    marginTop: 40,
  },
  loadingText: {
    marginTop: 16,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 20,
  },
});
