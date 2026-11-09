import { api } from "@/src/services/api";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location"; // 🚨 ADDED FOR REVERSE GEOCODING
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";

// Extended interface to capture route, mode, and coords
interface TripHistory {
  trip_id: string;
  status: string;
  timestamp: string;
  actual_fare_charged: string | number;
  computed_fare: string | number;
  total_distance_km: number;
  origin_address?: string;
  origin_name?: string;
  destination_address?: string;
  dest_name?: string;
  trip_mode?: string;
  origin_coords?: { latitude: number; longitude: number };
  dest_coords?: { latitude: number; longitude: number };
}

export default function DriverHistoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [trips, setTrips] = useState<TripHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTrip, setSelectedTrip] = useState<TripHistory | null>(null);
  const [resolvedOrigin, setResolvedOrigin] = useState<string>(""); // 🚨 ADDED STATE FOR ADDRESS

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

  // 🚨 ADDED: Dynamic Address Resolver
  useEffect(() => {
    if (selectedTrip) {
      const originName =
        selectedTrip.origin_name ||
        selectedTrip.origin_address ||
        "Unknown Origin";

      if (
        originName.toLowerCase().includes("current location") ||
        originName.toLowerCase().includes("unknown")
      ) {
        setResolvedOrigin("Loading exact address...");

        if (selectedTrip.origin_coords) {
          Location.reverseGeocodeAsync({
            latitude: selectedTrip.origin_coords.latitude,
            longitude: selectedTrip.origin_coords.longitude,
          })
            .then((res) => {
              if (res && res.length > 0) {
                const place = res[0];
                const addressParts = [
                  place.name,
                  place.street,
                  place.city,
                ].filter(Boolean);
                const uniqueParts = [...new Set(addressParts)];
                setResolvedOrigin(uniqueParts.join(", ") || "Unknown Address");
              } else {
                setResolvedOrigin(originName);
              }
            })
            .catch(() => setResolvedOrigin(originName));
        } else {
          setResolvedOrigin(originName);
        }
      } else {
        setResolvedOrigin(originName);
      }
    }
  }, [selectedTrip]);

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

  // Summary Metrics
  const completedTrips = trips.filter((t) => t.status.includes("Completed"));
  const totalEarnings = completedTrips.reduce(
    (sum, trip) =>
      sum + Number(trip.actual_fare_charged || trip.computed_fare || 0),
    0,
  );

  const renderTripCard = ({ item }: { item: TripHistory }) => {
    const isCompleted = item.status.includes("Completed");
    const isCancelled = item.status === "Cancelled";

    const earned = isCancelled
      ? 0
      : Number(item.actual_fare_charged || item.computed_fare || 0);

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => setSelectedTrip(item)}
      >
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
              <Text style={styles.fareLabel}>Earned:</Text>
              <Text
                style={[
                  styles.fareValue,
                  isCancelled && styles.fareValueCancelled,
                ]}
              >
                ₱{earned.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Derived values for the Modal
  let modalComputed = 0;
  let modalEarned = 0;
  let modalExtra = 0;

  if (selectedTrip) {
    modalComputed = Number(selectedTrip.computed_fare || 0);
    modalEarned =
      selectedTrip.status === "Cancelled"
        ? 0
        : Number(
            selectedTrip.actual_fare_charged || selectedTrip.computed_fare || 0,
          );
    modalExtra = modalEarned - modalComputed;
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip History</Text>
        <View style={{ width: 40 }} />
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

      {/* Detailed Earnings Modal */}
      <Modal
        visible={selectedTrip !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedTrip(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            <View style={styles.dragHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trip Details</Text>
              <TouchableOpacity
                onPress={() => setSelectedTrip(null)}
                style={styles.closeBtn}
              >
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedTrip && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Meta Row */}
                <View style={styles.modalMetaRow}>
                  <View>
                    <Text style={styles.modalTripId}>
                      {selectedTrip.trip_id}
                    </Text>
                    <Text style={styles.modalDate}>
                      {formatDate(selectedTrip.timestamp)}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      selectedTrip.status.includes("Completed")
                        ? styles.statusCompleted
                        : styles.statusCancelled,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        selectedTrip.status.includes("Completed")
                          ? styles.textCompleted
                          : styles.textCancelled,
                      ]}
                    >
                      {selectedTrip.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                {/* Route Section */}
                <View style={styles.routeSection}>
                  <View style={styles.routeRow}>
                    <View style={styles.dotBlue} />
                    <View style={styles.routeTextContainer}>
                      <Text style={styles.routeLabel}>PICK-UP</Text>
                      <Text style={styles.routeValue}>{resolvedOrigin}</Text>
                    </View>
                  </View>
                  <View style={styles.routeLine} />
                  <View style={styles.routeRow}>
                    <View style={styles.dotRed} />
                    <View style={styles.routeTextContainer}>
                      <Text style={styles.routeLabel}>DROP-OFF</Text>
                      <Text style={styles.routeValue}>
                        {selectedTrip.dest_name ||
                          selectedTrip.destination_address ||
                          "Unknown Destination"}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Fare Breakdown */}
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>EARNINGS BREAKDOWN</Text>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Distance Driven</Text>
                    <Text style={styles.breakdownValue}>
                      {selectedTrip.total_distance_km.toFixed(1)} km
                    </Text>
                  </View>

                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>
                      Computed Fare (Ordinance)
                    </Text>
                    <Text style={styles.breakdownValue}>
                      ₱ {modalComputed.toFixed(2)}
                    </Text>
                  </View>

                  {/* 🚨 FIXED: Used ternary operator to avoid rendering `0` */}
                  {modalExtra > 0 ? (
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabelTip}>
                        Extra / Tip Earned
                      </Text>
                      <Text style={styles.breakdownValueTip}>
                        + ₱ {modalExtra.toFixed(2)}
                      </Text>
                    </View>
                  ) : null}

                  <View style={styles.thickDivider} />

                  <View style={styles.breakdownRow}>
                    <Text style={styles.totalLabel}>TOTAL EARNED</Text>
                    <Text
                      style={[
                        styles.totalValue,
                        selectedTrip.status === "Cancelled" &&
                          styles.fareValueCancelled,
                      ]}
                    >
                      ₱ {modalEarned.toFixed(2)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

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
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: "85%",
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
  },
  closeBtn: {
    padding: 4,
  },
  modalMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  modalTripId: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  modalDate: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },

  routeSection: {
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  dotBlue: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    borderWidth: 3,
    borderColor: "#DBEAFE",
    marginTop: 4,
    marginRight: 16,
    zIndex: 2,
  },
  dotRed: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EF4444",
    borderWidth: 3,
    borderColor: "#FEE2E2",
    marginTop: 4,
    marginRight: 16,
    zIndex: 2,
  },
  routeLine: {
    width: 2,
    height: 30,
    backgroundColor: "#E2E8F0",
    marginLeft: 5,
    marginVertical: -4,
    zIndex: 1,
  },
  routeTextContainer: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  routeValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F172A",
  },

  breakdownSection: {
    marginBottom: 24,
  },
  breakdownTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 14,
    color: "#475569",
    fontWeight: "600",
  },
  breakdownValue: {
    fontSize: 15,
    color: "#0F172A",
    fontWeight: "700",
  },
  breakdownLabelTip: {
    fontSize: 14,
    color: "#059669",
    fontWeight: "700",
  },
  breakdownValueTip: {
    fontSize: 15,
    color: "#059669",
    fontWeight: "900",
  },
  thickDivider: {
    height: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D32F2F",
  },

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
