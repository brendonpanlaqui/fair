import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { api } from "../../../services/api";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.x:8000/api";

interface TripRecord {
  trip_id: string;
  body_number: string;
  matrix_id: number;
  trip_mode: "DIRECT" | "SPECIAL";
  total_distance_km: number;
  computed_fare: number;
  discount_applied: number;
  status: "Completed" | "Cancelled";
  timestamp: string;
  origin_name: string;
  destination_name: string;
  origin_coords: { latitude: number; longitude: number };
  dest_coords: { latitude: number; longitude: number };
  polyline_hash: string | null;
}

const HistoryScreen = () => {
  const router = useRouter();

  const [filter, setFilter] = useState<"All" | "Completed" | "Cancelled">(
    "All",
  );
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ mapRef typed correctly — same fix as TripReceiptScreen
  const mapRef = useRef<MapView>(null);

  // ✅ Fit map to the selected trip's route once the map is ready
  const fitMapToRoute = () => {
    if (!selectedTrip) return;

    const coords = getDrivenRoute(selectedTrip.polyline_hash) ?? [
      selectedTrip.origin_coords,
      selectedTrip.dest_coords,
    ];

    const lats = coords.map((c: { latitude: number }) => c.latitude);
    const lngs = coords.map((c: { longitude: number }) => c.longitude);
    const latDelta = Math.max(Math.max(...lats) - Math.min(...lats), 0.004);
    const lngDelta = Math.max(Math.max(...lngs) - Math.min(...lngs), 0.004);
    const centerLat = (Math.max(...lats) + Math.min(...lats)) / 2;
    const centerLng = (Math.max(...lngs) + Math.min(...lngs)) / 2;

    mapRef.current?.animateToRegion(
      {
        latitude: centerLat,
        longitude: centerLng,
        latitudeDelta: latDelta * 1.4,
        longitudeDelta: lngDelta * 1.4,
      },
      0,
    );
  };

  // ✅ Require at least 2 points — same logic as TripReceiptScreen
  const getDrivenRoute = (hash?: string | null) => {
    if (!hash) return null;
    try {
      const coords = JSON.parse(hash);
      if (Array.isArray(coords) && coords.length >= 2) return coords;
    } catch (e) {
      console.warn("Failed to parse polyline breadcrumbs:", e);
    }
    return null;
  };

  const fetchTripHistory = async (isPullToRefresh = false) => {
    try {
      if (!isPullToRefresh) setIsLoading(true);
      setError(null);
      const response = await api.get<TripRecord[]>("/trips/history/");
      setTrips(response.data);
    } catch (err) {
      console.warn("API Error:", err);
      setError(
        "Could not connect to the server. Please check your connection.",
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTripHistory();
  }, []);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTripHistory(true);
  };

  const filteredData = trips.filter(
    (trip) => filter === "All" || trip.status === filter,
  );

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportPDF = () => {
    Alert.alert(
      "Generating PDF",
      `Official E-Receipt for Trip ${selectedTrip?.trip_id} has been saved to your device downloads.`,
      [{ text: "OK" }],
    );
  };

  const renderTripCard = ({ item }: { item: TripRecord }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() => setSelectedTrip(item)}
    >
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.modeBadge,
              item.trip_mode === "DIRECT"
                ? styles.badgeDirect
                : styles.badgeSpecial,
            ]}
          >
            <Text
              style={[
                styles.modeText,
                item.trip_mode === "DIRECT"
                  ? { color: "#0369A1" }
                  : { color: "#D32F2F" },
              ]}
            >
              {item.trip_mode}
            </Text>
          </View>
          <Text style={styles.bodyNumberText}>Body #{item.body_number}</Text>
        </View>
        <Text
          style={[
            styles.statusText,
            item.status === "Cancelled" && { color: "#94A3B8" },
          ]}
        >
          {item.status}
        </Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.routeContainer}>
          <MaterialIcons name="trip-origin" size={14} color="#3B82F6" />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.origin_name}
          </Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.routeContainer}>
          <MaterialIcons name="location-on" size={14} color="#D32F2F" />
          <Text style={styles.routeText} numberOfLines={1}>
            {item.destination_name}
          </Text>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View>
          <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          <Text style={styles.distanceText}>
            {item.total_distance_km.toFixed(1)} km Total
          </Text>
        </View>
        <Text
          style={[
            styles.priceText,
            item.status === "Cancelled" && {
              textDecorationLine: "line-through",
              color: "#94A3B8",
            },
          ]}
        >
          ₱{(item.computed_fare - item.discount_applied).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Derived values for the modal map — computed once selectedTrip is set
  const modalRoute = selectedTrip
    ? getDrivenRoute(selectedTrip.polyline_hash)
    : null;

  const isEstimatedRoute =
    !selectedTrip?.polyline_hash || !modalRoute || modalRoute.length < 3;

  const modalPolylineCoords =
    modalRoute ??
    (selectedTrip
      ? [selectedTrip.origin_coords, selectedTrip.dest_coords]
      : []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.redHeaderBackground}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>
          Digital receipts and audit trail
        </Text>
      </View>

      <View style={styles.filterWrapper}>
        {["All", "Completed", "Cancelled"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab as any)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.filterTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.loadingText}>Fetching your rides...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="wifi-off" size={48} color="#CBD5E1" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchTripHistory()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => item.trip_id}
          renderItem={renderTripCard}
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
          ListEmptyComponent={
            <View style={styles.centerContainer}>
              <MaterialIcons name="history" size={48} color="#E2E8F0" />
              <Text style={styles.emptyText}>No rides found.</Text>
            </View>
          }
        />
      )}

      <Modal
        visible={selectedTrip !== null}
        animationType="slide"
        transparent={false}
      >
        {selectedTrip && (
          <View style={styles.modalContainer}>
            <View style={styles.mapSection}>
              <MapView
                key={selectedTrip.trip_id}
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                onMapReady={fitMapToRoute}
                pitchEnabled={false}
                rotateEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                {/* ✅ Default markers — anchor at tip, no offset issues */}
                <Marker
                  coordinate={selectedTrip.origin_coords}
                  title="Pick-up"
                  pinColor="#3B82F6"
                />
                <Marker
                  coordinate={selectedTrip.dest_coords}
                  title="Drop-off"
                  pinColor="#D32F2F"
                />

                {/* ✅ Solid red if real trace, dashed gray if estimated */}
                <Polyline
                  coordinates={modalPolylineCoords}
                  strokeWidth={isEstimatedRoute ? 3 : 5}
                  strokeColor={isEstimatedRoute ? "#94A3B8" : "#D32F2F"}
                  lineDashPattern={isEstimatedRoute ? [6, 4] : undefined}
                  lineCap="round"
                  lineJoin="round"
                />
              </MapView>

              {/* ✅ Badge is OUTSIDE MapView to avoid addViewAt crash */}
              {isEstimatedRoute && (
                <View style={styles.estimatedBadge}>
                  <MaterialIcons
                    name="info-outline"
                    size={12}
                    color="#FCD34D"
                  />
                  <Text style={styles.estimatedBadgeText}>Estimated route</Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.mapBackButton}
                onPress={() => setSelectedTrip(null)}
              >
                <MaterialIcons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.receiptSection}>
              <View style={styles.receiptDragHandle} />

              <View style={styles.receiptHeader}>
                <Text style={styles.receiptTripId}>{selectedTrip.trip_id}</Text>
                <Text style={styles.receiptDate}>
                  {formatDate(selectedTrip.timestamp)}
                </Text>
              </View>

              <View style={styles.driverMetaRow}>
                <View style={styles.driverAvatar}>
                  <MaterialIcons
                    name="sports-motorsports"
                    size={24}
                    color="#D32F2F"
                  />
                </View>
                <View>
                  <Text style={styles.receiptBodyNum}>
                    Body #{selectedTrip.body_number}
                  </Text>
                  <Text style={styles.receiptMode}>
                    {selectedTrip.trip_mode} RIDE • {selectedTrip.status}
                  </Text>
                </View>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.fareBreakdownBox}>
                <Text style={styles.breakdownTitle}>FARE BREAKDOWN</Text>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>Base Fare (1st km)</Text>
                  <Text style={styles.fareValue}>₱ 35.00</Text>
                </View>

                <View style={styles.fareRow}>
                  <Text style={styles.fareLabel}>
                    Distance (
                    {(selectedTrip.total_distance_km - 1 > 0
                      ? selectedTrip.total_distance_km - 1
                      : 0
                    ).toFixed(1)}{" "}
                    km)
                  </Text>
                  <Text style={styles.fareValue}>
                    ₱ {(selectedTrip.computed_fare - 35).toFixed(2)}
                  </Text>
                </View>

                {selectedTrip.discount_applied > 0 && (
                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabelDiscount}>
                      Legal Discount (20%)
                    </Text>
                    <Text style={styles.fareValueDiscount}>
                      - ₱ {selectedTrip.discount_applied.toFixed(2)}
                    </Text>
                  </View>
                )}

                <View style={styles.receiptThickDivider} />

                <View style={styles.fareRow}>
                  <Text style={styles.totalLabel}>TOTAL PAID</Text>
                  <Text style={styles.totalValue}>
                    ₱{" "}
                    {(
                      selectedTrip.computed_fare - selectedTrip.discount_applied
                    ).toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={{ flex: 1 }} />

              <View style={styles.receiptActions}>
                <TouchableOpacity
                  style={styles.reportBtn}
                  onPress={() => {
                    setSelectedTrip(null);
                    router.push({
                      pathname: "/report",
                      params: {
                        tripId: selectedTrip.trip_id,
                        bodyNumber: selectedTrip.body_number,
                      },
                    });
                  }}
                >
                  <MaterialIcons name="gavel" size={20} color="#D32F2F" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.pdfBtn}
                  activeOpacity={0.9}
                  onPress={handleExportPDF}
                >
                  <MaterialIcons
                    name="picture-as-pdf"
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.pdfBtnText}>EXPORT RECEIPT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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

  filterWrapper: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: -28,
    borderRadius: 20,
    padding: 6,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  filterTabActive: { backgroundColor: "#FFF1F2" },
  filterText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  filterTextActive: { color: "#D32F2F", fontWeight: "800" },

  listContent: { paddingTop: 24, paddingHorizontal: 16, paddingBottom: 100 },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
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
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#94A3B8",
    fontWeight: "bold",
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
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeDirect: { backgroundColor: "#E0F2FE" },
  badgeSpecial: { backgroundColor: "#FFF1F2" },
  modeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  bodyNumberText: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  statusText: { fontSize: 12, fontWeight: "bold", color: "#10B981" },

  cardBody: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  routeContainer: { flexDirection: "row", alignItems: "center" },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    marginLeft: 8,
    fontWeight: "600",
  },
  routeLine: {
    width: 2,
    height: 12,
    backgroundColor: "#CBD5E1",
    marginLeft: 6,
    marginVertical: 4,
  },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  dateText: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "700",
    marginBottom: 2,
  },
  distanceText: { fontSize: 11, color: "#94A3B8", fontWeight: "600" },
  priceText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },

  mapSection: {
    height: "35%",
    width: "100%",
    position: "relative",
  },

  // ✅ Estimated route badge — positioned over map, outside MapView
  estimatedBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15,23,42,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  estimatedBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
  },

  mapBackButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  receiptSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -24,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    elevation: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  receiptDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },

  receiptHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "baseline",
    marginBottom: 24,
  },
  receiptTripId: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  receiptDate: { fontSize: 13, color: "#64748B", fontWeight: "700" },

  driverMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  receiptBodyNum: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  receiptMode: {
    fontSize: 11,
    color: "#D32F2F",
    fontWeight: "900",
    letterSpacing: 0.5,
    marginTop: 4,
  },

  receiptDivider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E2E8F0",
    marginBottom: 24,
    borderStyle: "dashed",
  },

  fareBreakdownBox: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fareLabel: { fontSize: 14, color: "#475569", fontWeight: "500" },
  fareValue: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  fareLabelDiscount: { fontSize: 14, color: "#10B981", fontWeight: "700" },
  fareValueDiscount: { fontSize: 14, fontWeight: "800", color: "#10B981" },

  receiptThickDivider: {
    width: "100%",
    height: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D32F2F",
    letterSpacing: -1,
  },

  receiptActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
    paddingBottom: 20,
  },
  reportBtn: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  pdfBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#D32F2F",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  pdfBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});

export default HistoryScreen;
