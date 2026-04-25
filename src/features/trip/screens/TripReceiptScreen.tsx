import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

// 🚀 IMPORT AUTH CONTEXT
import { useAuth } from "@/src/hooks/AuthContext";

const TripReceiptScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // 🚀 GRAB GLOBAL DISCOUNT STATUS
  const { isDiscountVerified, userType } = useAuth();

  // Base parameters
  const baseFare = params.baseFare ? Number(params.baseFare) : 35.0;
  const succeedingFare = params.succeedingFare
    ? Number(params.succeedingFare)
    : 12.0;
  const subtotal = baseFare + succeedingFare;

  // 🚀 AUTOMATIC MATH BASED ON LGU STATUS
  const discountAmount = isDiscountVerified ? Math.floor(subtotal * 0.2) : 0;
  const legalTotalFare = subtotal - discountAmount;

  // Overcharge Detection
  const actualFare = params.actualFare
    ? Number(params.actualFare)
    : legalTotalFare;
  const overchargeAmount = actualFare - legalTotalFare;
  const isUnderpaid = actualFare < legalTotalFare;

  const distance = (params.distance as string) || "3.5";
  const duration = (params.duration as string) || "12 mins";
  const date = (params.date as string) || "Oct 24, 2023";
  const time = (params.time as string) || "08:45 AM";
  const bodyNumber = (params.bodyNumber as string) || "0406";
  const tripId = (params.tripId as string) || "TRP-88172B";

  // MAP PARAMS
  const originLat = params.originLat ? Number(params.originLat) : 15.1444;
  const originLng = params.originLng ? Number(params.originLng) : 120.5928;
  const destLat = params.destLat ? Number(params.destLat) : 15.1384;
  const destLng = params.destLng ? Number(params.destLng) : 120.5898;
  const polylineHash = params.polylineHash as string | null;

  const mapRef = useRef<MapView>(null);

  const fitMapToRoute = () => {
    const coords = parsedRoute ?? [
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng },
    ];
    const lats = coords.map((c) => c.latitude);
    const lngs = coords.map((c) => c.longitude);
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

  const handleReportDriver = () => {
    router.push({
      pathname: "/report",
      params: { tripId, bodyNumber, violation: "Overcharging" },
    });
  };

  const getDrivenRoute = () => {
    if (polylineHash) {
      try {
        const coords = JSON.parse(polylineHash);
        if (Array.isArray(coords) && coords.length >= 2) return coords;
      } catch (e) {
        console.warn("Failed to parse polyline on receipt");
      }
    }
    return [
      { latitude: originLat, longitude: originLng },
      { latitude: destLat, longitude: destLng },
    ];
  };

  const parsedRoute = getDrivenRoute();
  const isEstimatedRoute = !polylineHash || parsedRoute.length < 3;

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* MINIMALIST HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Complete</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.receiptCard}>
          {/* THE RECEIPT MAP HEADER */}
          <View style={styles.receiptMapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              ref={mapRef}
              onMapReady={fitMapToRoute}
              pitchEnabled={false}
              rotateEnabled={false}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{ latitude: originLat, longitude: originLng }}
                title="Pick-up"
                pinColor="#3B82F6"
              />
              <Marker
                coordinate={{ latitude: destLat, longitude: destLng }}
                title="Drop-off"
                pinColor="#D32F2F"
              />

              <Polyline
                coordinates={parsedRoute}
                strokeWidth={isEstimatedRoute ? 3 : 5}
                strokeColor={isEstimatedRoute ? "#94A3B8" : "#D32F2F"}
                lineDashPattern={isEstimatedRoute ? [6, 4] : undefined}
                lineCap="round"
                lineJoin="round"
              />
            </MapView>

            {isEstimatedRoute && (
              <View style={styles.estimatedBadge}>
                <MaterialIcons name="info-outline" size={12} color="#FCD34D" />
                <Text style={styles.estimatedBadgeText}>Estimated route</Text>
              </View>
            )}
          </View>

          {/* Top Section: The Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₱</Text>
              {/* 🚀 DYNAMIC TOTAL DISPLAY */}
              <Text style={styles.totalAmount}>
                {legalTotalFare.toFixed(2)}
              </Text>
            </View>

            <View style={styles.verifiedBadge}>
              <MaterialIcons
                name="verified-user"
                size={14}
                color="#059669"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.verifiedBadgeText}>
                Ordinance No. 723 Verified
              </Text>
            </View>
          </View>

          {/* The "Tear" Separator */}
          <View style={styles.tearLineContainer}>
            <View style={styles.tearCutoutLeft} />
            <View style={styles.tearDashLine} />
            <View style={styles.tearCutoutRight} />
          </View>

          {/* Bottom Section: Breakdown & Details */}
          <View style={styles.detailsSection}>
            {/* OVERCHARGE WARNING BOX */}
            {overchargeAmount > 0 ? (
              <View style={styles.overchargeAlert}>
                <MaterialIcons name="error-outline" size={24} color="#DC2626" />
                <View style={styles.overchargeTextWrapper}>
                  <Text style={styles.overchargeTitle}>
                    {"Overcharge Detected!"}
                  </Text>
                  <Text style={styles.overchargeSubtext}>
                    {`You paid ₱${actualFare.toFixed(2)}. The driver charged ₱${overchargeAmount.toFixed(2)} above the official ordinance.`}
                  </Text>
                </View>
              </View>
            ) : null}

            {/* UNDERPAID  BOX */}
            {isUnderpaid && (
              <View style={styles.underpaidAlert}>
                <MaterialIcons name="info-outline" size={24} color="#2563EB" />
                <View style={styles.underpaidTextWrapper}>
                  <Text style={styles.underpaidTitle}>
                    {"Payment Below Rate"}
                  </Text>
                  <Text style={styles.underpaidSubtext}>
                    {`The official fare is ₱${legalTotalFare.toFixed(2)}, but you paid ₱${actualFare.toFixed(2)}. This has been logged as a non-standard fare.`}
                  </Text>
                </View>
              </View>
            )}
            {/* FARE BREAKDOWN */}
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>BASE FARE</Text>
                <Text style={styles.breakdownValue}>
                  ₱{baseFare.toFixed(2)}
                </Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>SUCCEEDING KM</Text>
                <Text style={styles.breakdownValue}>
                  ₱{succeedingFare.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* 🚀 DYNAMIC DISCOUNT ALERT */}
            {isDiscountVerified && (
              <View style={styles.discountAlert}>
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text style={styles.discountAlertText}>
                  {userType.toUpperCase()} DISCOUNT
                </Text>
                <Text style={styles.discountAmountText}>
                  -₱{discountAmount.toFixed(2)}
                </Text>
              </View>
            )}

            <View style={styles.metaDataList}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Trip ID</Text>
                <Text style={styles.metaValue}>{tripId}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Body Number</Text>
                <Text style={styles.metaValueHighlight}>#{bodyNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Distance</Text>
                <Text style={styles.metaValue}>{distance} km</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>
                  {date} • {time}
                </Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Amount Paid</Text>
                <Text style={styles.metaValue}>₱{actualFare.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ACTIONS FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.9}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportBtn}
          activeOpacity={0.8}
          onPress={handleReportDriver}
        >
          <MaterialIcons
            name="gavel"
            size={18}
            color="#D32F2F"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.reportBtnText}>Dispute this Fare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#F8FAFC",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    overflow: "hidden",
  },
  overchargeAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  overchargeTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  overchargeTitle: {
    color: "#DC2626",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  overchargeSubtext: {
    color: "#991B1B",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  // Blue badge for paying less
  underpaidBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  underpaidBadgeText: { color: "#2563EB", fontSize: 12, fontWeight: "bold" },

  // Blue alert box for the details section
  underpaidAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F9FF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#BAE6FD",
  },
  underpaidTextWrapper: {
    marginLeft: 12,
    flex: 1,
  },
  underpaidTitle: {
    color: "#0369A1",
    fontSize: 14,
    fontWeight: "900",
    marginBottom: 2,
  },
  underpaidSubtext: {
    color: "#075985",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  receiptMapContainer: {
    height: 200,
    width: "100%",
    position: "relative",
    backgroundColor: "#E2E8F0",
  },
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

  totalSection: {
    padding: 32,
    paddingTop: 24,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D32F2F",
    marginTop: 6,
    marginRight: 4,
  },
  totalAmount: {
    fontSize: 56,
    fontWeight: "900",
    color: "#D32F2F",
    letterSpacing: -2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBadgeText: { color: "#059669", fontSize: 12, fontWeight: "bold" },

  tearLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 24,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  tearCutoutLeft: {
    position: "absolute",
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  tearCutoutRight: {
    position: "absolute",
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  tearDashLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 16,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderStyle: "dashed",
  },

  detailsSection: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  breakdownItem: { flex: 1, alignItems: "center" },
  verticalDivider: { width: 1, height: 30, backgroundColor: "#E2E8F0" },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownValue: { fontSize: 16, fontWeight: "900", color: "#0F172A" },

  // 🚀 UPDATED DISCOUNT STYLES
  discountAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  discountAlertText: {
    marginLeft: 8,
    color: "#059669",
    fontSize: 13,
    fontWeight: "900",
    flex: 1,
  },
  discountAmountText: {
    color: "#059669",
    fontSize: 14,
    fontWeight: "900",
  },

  metaDataList: { gap: 16 },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: { fontSize: 13, color: "#64748B", fontWeight: "600" },
  metaValue: { fontSize: 13, fontWeight: "bold", color: "#0F172A" },
  metaValueHighlight: { fontSize: 14, fontWeight: "900", color: "#0F172A" },

  footer: { padding: 24, paddingBottom: 40, backgroundColor: "#F8FAFC" },
  primaryBtn: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  reportBtn: {
    flexDirection: "row",
    backgroundColor: "#FFF1F2",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  reportBtnText: { color: "#D32F2F", fontSize: 15, fontWeight: "bold" },
});

export default TripReceiptScreen;
