import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

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
}

const MOCK_HISTORY: TripRecord[] = [
  {
    trip_id: "TRP-99281A",
    body_number: "0406",
    matrix_id: 1,
    trip_mode: "DIRECT",
    total_distance_km: 2.4,
    computed_fare: 50.0,
    discount_applied: 0.0,
    status: "Completed",
    timestamp: "2026-03-14T08:30:00Z",
    origin_name: "SM City Clark",
    destination_name: "Holy Angel University",
    origin_coords: { latitude: 15.1749, longitude: 120.5791 },
    dest_coords: { latitude: 15.1365, longitude: 120.5901 },
  },
  {
    trip_id: "TRP-88172B",
    body_number: "0888",
    matrix_id: 1,
    trip_mode: "SPECIAL",
    total_distance_km: 4.1,
    computed_fare: 80.0,
    discount_applied: 16.0,
    status: "Completed",
    timestamp: "2026-03-12T17:15:00Z",
    origin_name: "Nepo Mall",
    destination_name: "City Savings Bank",
    origin_coords: { latitude: 15.1384, longitude: 120.5898 },
    dest_coords: { latitude: 15.1444, longitude: 120.5928 },
  },
];

const HistoryScreen = () => {
  const router = useRouter();
  const [filter, setFilter] = useState<"All" | "Completed" | "Cancelled">(
    "All",
  );
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);

  const filteredData = MOCK_HISTORY.filter(
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
                  : { color: "#B91C1C" },
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
          <MaterialIcons name="location-on" size={14} color="#E53935" />
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

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* BRAND RED HEADER */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>
          Digital receipts and audit trail
        </Text>
      </View>

      {/* BRANDED FILTERS */}
      <View style={styles.filterContainer}>
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

      <FlatList
        data={filteredData}
        keyExtractor={(item) => item.trip_id}
        renderItem={renderTripCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={selectedTrip !== null}
        animationType="slide"
        transparent={false}
      >
        {selectedTrip && (
          <View style={styles.modalContainer}>
            <View style={styles.mapSection}>
              <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                initialRegion={{
                  latitude:
                    (selectedTrip.origin_coords.latitude +
                      selectedTrip.dest_coords.latitude) /
                    2,
                  longitude:
                    (selectedTrip.origin_coords.longitude +
                      selectedTrip.dest_coords.longitude) /
                    2,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }}
                pitchEnabled={false}
                rotateEnabled={false}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker coordinate={selectedTrip.origin_coords}>
                  <View style={styles.originMarker} />
                </Marker>
                <Marker coordinate={selectedTrip.dest_coords}>
                  <View style={styles.destinationMarker}>
                    <View style={styles.destinationMarkerCore} />
                  </View>
                </Marker>
                <MapViewDirections
                  origin={selectedTrip.origin_coords}
                  destination={selectedTrip.dest_coords}
                  apikey={GOOGLE_API_KEY}
                  strokeWidth={4}
                  strokeColor="#E53935"
                />
              </MapView>

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
                    color="#E53935"
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

                {/* BRAND RED PDF EXPORT BUTTON */}
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

  filterContainer: { flexDirection: "row", padding: 16, gap: 8 },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#E2E8F0",
  },
  filterTabActive: { backgroundColor: "#E53935" }, // BRAND RED TAB
  filterText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  filterTextActive: { color: "#FFFFFF" },

  listContent: { paddingHorizontal: 16, paddingBottom: 100 },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
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
    marginBottom: 16,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  modeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeDirect: { backgroundColor: "#E0F2FE" },
  badgeSpecial: { backgroundColor: "#FEE2E2" },
  modeText: { fontSize: 10, fontWeight: "900", letterSpacing: 0.5 },
  bodyNumberText: { fontSize: 15, fontWeight: "900", color: "#0F172A" },
  statusText: { fontSize: 12, fontWeight: "bold", color: "#10B981" },

  cardBody: {
    backgroundColor: "#F8FAFC",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  routeContainer: { flexDirection: "row", alignItems: "center" },
  routeText: {
    flex: 1,
    fontSize: 13,
    color: "#334155",
    marginLeft: 8,
    fontWeight: "500",
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
    fontWeight: "600",
    marginBottom: 2,
  },
  distanceText: { fontSize: 11, color: "#94A3B8", fontWeight: "500" },
  priceText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },

  // --- MODAL STYLES ---
  modalContainer: { flex: 1, backgroundColor: "#F8FAFC" },
  mapSection: { height: "35%", width: "100%", position: "relative" },
  mapBackButton: {
    position: "absolute",
    top: 50,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },

  originMarker: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 4,
    borderColor: "#3B82F6",
  },
  destinationMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#E53935",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },
  destinationMarkerCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },

  receiptSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    marginTop: -24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
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
    letterSpacing: 0.5,
  },
  receiptDate: { fontSize: 13, color: "#64748B", fontWeight: "600" },

  driverMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  receiptBodyNum: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  receiptMode: {
    fontSize: 12,
    color: "#E53935",
    fontWeight: "bold",
    letterSpacing: 0.5,
    marginTop: 2,
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
    fontWeight: "bold",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 16,
  },
  fareRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  fareLabel: { fontSize: 14, color: "#475569" },
  fareValue: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  fareLabelDiscount: { fontSize: 14, color: "#10B981", fontWeight: "600" },
  fareValueDiscount: { fontSize: 14, fontWeight: "bold", color: "#10B981" },

  receiptThickDivider: {
    width: "100%",
    height: 2,
    backgroundColor: "#E2E8F0",
    marginVertical: 12,
  },
  totalLabel: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  totalValue: {
    fontSize: 24,
    fontWeight: "900",
    color: "#E53935",
    letterSpacing: -0.5,
  },

  receiptActions: { flexDirection: "row", gap: 12, marginTop: 20 },
  reportBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },

  // BRAND RED PDF BUTTON
  pdfBtn: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#E53935",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#E53935",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  pdfBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
});

export default HistoryScreen;
