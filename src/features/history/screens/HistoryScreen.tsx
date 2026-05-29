import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Print from "expo-print";
import { useRouter } from "expo-router";
import * as Sharing from "expo-sharing";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.x:8000/api";

// matches what my Django backend (TripHistorySerializer) sends.
interface TripRecord {
  trip_id: string;
  body_number: string;
  matrix_id: number;
  trip_mode: "DIRECT" | "SPECIAL";
  total_distance_km: number;
  computed_fare: number;
  actual_fare_charged: number;
  discount_applied: number;
  is_tip: boolean;
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
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets(); // 🚀 dynamically gets the notch height

  const [filter, setFilter] = useState<"All" | "Completed" | "Cancelled">(
    "All",
  );
  const [selectedTrip, setSelectedTrip] = useState<TripRecord | null>(null);
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOffline, setIsOffline] = useState(false);

  const mapRef = useRef<MapView>(null);

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

  const syncPendingTrips = async () => {
    try {
      const storedPending = await AsyncStorage.getItem("@pending_trips");
      if (storedPending) {
        const pendingTrips = JSON.parse(storedPending);
        if (pendingTrips && pendingTrips.length > 0) {
          const remainingTrips = [];
          for (const tripPayload of pendingTrips) {
            try {
              await api.post("/trips/submit/", tripPayload);
            } catch (error: any) {
              const isNetworkError =
                !error.response ||
                (error.message &&
                  error.message.toLowerCase().includes("network")) ||
                (error.response && error.response.status >= 500);
              if (isNetworkError) {
                remainingTrips.push(tripPayload);
              }
            }
          }
          if (remainingTrips.length !== pendingTrips.length) {
            await AsyncStorage.setItem(
              "@pending_trips",
              JSON.stringify(remainingTrips),
            );
          }
        }
      }
    } catch (error) {
      console.error("Error syncing pending trips in history:", error);
    }
  };

  const fetchTripHistory = async (isPullToRefresh = false) => {
    if (!user) {
      setIsLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      if (!isPullToRefresh) setIsLoading(true);

      await syncPendingTrips();

      setError(null);
      const response = await api.get<TripRecord[]>("/trips/history/");
      setTrips(response.data);
      setIsOffline(false);

      await AsyncStorage.setItem(
        "@cached_history",
        JSON.stringify(response.data),
      );
    } catch (err) {
      console.warn("API Error:", err);

      const cached = await AsyncStorage.getItem("@cached_history");
      if (cached) {
        setTrips(JSON.parse(cached));
        setIsOffline(true);
      } else {
        setError(
          "Could not connect to the LGU server. Please check your connection.",
        );
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTripHistory();
  }, [user]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchTripHistory(true);
  };

  const filteredData = trips.filter(
    (trip) => filter === "All" || trip.status === filter,
  );

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today, ${date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleExportPDF = async () => {
    if (!selectedTrip) return;

    try {
      const computedFare = Number(selectedTrip.computed_fare) || 0;
      const discountApplied = Number(selectedTrip.discount_applied) || 0;
      const actualFareCharged = Number(selectedTrip.actual_fare_charged) || 0;

      const distanceFare = (computedFare - 35).toFixed(2);
      const excessDistance = (
        selectedTrip.total_distance_km - 1 > 0
          ? selectedTrip.total_distance_km - 1
          : 0
      ).toFixed(1);

      const expectedFare = computedFare - discountApplied;
      const actualPaid = actualFareCharged || expectedFare;
      const extraPaid = actualPaid - expectedFare;

      const htmlContent = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no" />
            <style>
              body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #0F172A; }
              .header { text-align: center; border-bottom: 2px solid #D32F2F; padding-bottom: 20px; margin-bottom: 30px; }
              .title { font-size: 28px; font-weight: 900; color: #D32F2F; margin: 0; letter-spacing: -1px; }
              .subtitle { font-size: 14px; color: #64748B; margin-top: 5px; font-weight: 600; }
              .section { margin-bottom: 30px; }
              .section-title { color: #94A3B8; font-size: 12px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px; }
              .row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
              .label { font-weight: 600; color: #475569; }
              .value { font-weight: 700; text-align: right; max-width: 60%; }
              .thick-divider { border-bottom: 2px solid #E2E8F0; margin: 15px 0; }
              .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 20px; }
              .total-label { font-size: 18px; font-weight: 900; color: #0F172A; }
              .total-value { font-size: 24px; font-weight: 900; color: #D32F2F; }
              .discount { color: #10B981; }
              .warning { color: #F59E0B; }
              .tip { color: #3B82F6; }
              .footer { text-align: center; margin-top: 50px; font-size: 12px; color: #94A3B8; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1 class="title">FAIR APP E-RECEIPT</h1>
              <p class="subtitle">Official Digital Receipt</p>
            </div>
            <div class="section">
              <div class="section-title">Trip Details</div>
              <div class="row"><span class="label">Trip ID</span> <span class="value">${selectedTrip.trip_id}</span></div>
              <div class="row"><span class="label">Date & Time</span> <span class="value">${formatDate(selectedTrip.timestamp)}</span></div>
              <div class="row"><span class="label">Tricycle Body #</span> <span class="value">${selectedTrip.body_number}</span></div>
              <div class="row"><span class="label">Ride Mode</span> <span class="value">${selectedTrip.trip_mode}</span></div>
              <div class="row"><span class="label">Status</span> <span class="value">${selectedTrip.status}</span></div>
            </div>
            <div class="section">
              <div class="section-title">Route Information</div>
              <div class="row"><span class="label">Pick-up</span> <span class="value">${selectedTrip.origin_name}</span></div>
              <div class="row"><span class="label">Drop-off</span> <span class="value">${selectedTrip.destination_name}</span></div>
              <div class="row"><span class="label">Total Distance</span> <span class="value">${selectedTrip.total_distance_km.toFixed(1)} km</span></div>
            </div>
            <div class="section">
              <div class="section-title">Fare Breakdown</div>
              <div class="row"><span class="label">Base Fare (1st km)</span> <span class="value">PHP 35.00</span></div>
              <div class="row"><span class="label">Distance Fare (${excessDistance} km)</span> <span class="value">PHP ${distanceFare}</span></div>
              <div class="thick-divider"></div>
              <div class="row"><span class="label">Original Computed Fare</span> <span class="value">PHP ${computedFare.toFixed(2)}</span></div>
              ${discountApplied > 0 ? `<div class="row discount"><span class="label discount">Legal Discount (20%)</span> <span class="value discount">- PHP ${discountApplied.toFixed(2)}</span></div>` : ""}
              ${
                extraPaid > 0
                  ? `<div class="row ${selectedTrip.is_tip ? "tip" : "warning"}"><span class="label ${selectedTrip.is_tip ? "tip" : "warning"}">${selectedTrip.is_tip ? "Voluntary Tip" : "Overcharge"}</span> <span class="value ${selectedTrip.is_tip ? "tip" : "warning"}">+ PHP ${extraPaid.toFixed(2)}</span></div>`
                  : ""
              }
              <div class="thick-divider"></div>
              <div class="total-row"><span class="total-label">ACTUAL AMOUNT PAID</span> <span class="total-value">PHP ${actualPaid.toFixed(2)}</span></div>
            </div>
            <div class="footer">
              <p>Thank you for commuting safely with Fair App.</p>
              <p>Angeles City Public Transportation Regulatory Office</p>
            </div>
          </body>
        </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          UTI: ".pdf",
          mimeType: "application/pdf",
          dialogTitle: "Save Receipt",
        });
      } else {
        Alert.alert("Error", "File sharing is not supported on this device.");
      }
    } catch (error) {
      console.warn("PDF Error:", error);
      Alert.alert("Error", "Failed to generate the receipt.");
    }
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
          ₱
          {(
            Number(item.actual_fare_charged) ||
            Number(item.computed_fare) - Number(item.discount_applied)
          ).toFixed(2)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSummaryCard = () => {
    if (filteredData.length === 0) return null;

    const completedTrips = filteredData.filter((t) => t.status === "Completed");
    const totalSpent = completedTrips.reduce((sum, trip) => {
      const actual = Number(trip.actual_fare_charged) || 0;
      const computed = Number(trip.computed_fare) || 0;
      const discount = Number(trip.discount_applied) || 0;
      return sum + (actual || computed - discount);
    }, 0);
    const totalDistance = completedTrips.reduce(
      (sum, trip) => sum + trip.total_distance_km,
      0,
    );

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{completedTrips.length}</Text>
          <Text style={styles.summaryLabel}>Completed Rides</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>₱{totalSpent.toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Total Spent</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalDistance.toFixed(1)} km</Text>
          <Text style={styles.summaryLabel}>Distance</Text>
        </View>
      </View>
    );
  };

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

  let expectedFare = 0;
  let actualPaid = 0;
  let extraPaid = 0;
  let computedFareDisplay = 0;
  let discountDisplay = 0;

  if (selectedTrip) {
    computedFareDisplay = Number(selectedTrip.computed_fare) || 0;
    discountDisplay = Number(selectedTrip.discount_applied) || 0;
    const actual = Number(selectedTrip.actual_fare_charged) || 0;

    expectedFare = computedFareDisplay - discountDisplay;
    actualPaid = actual || expectedFare;
    extraPaid = actualPaid - expectedFare;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden={selectedTrip !== null} />

      {/* HEADER */}
      <View style={styles.redHeaderBackground}>
        <Text style={styles.headerTitle}>Ride History</Text>
        <Text style={styles.headerSubtitle}>
          Digital receipts and audit trail
        </Text>
      </View>

      {/* FILTER TABS */}
      <View style={styles.filterWrapper}>
        {["All", "Completed", "Cancelled"].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab as any)}
            activeOpacity={0.8}
            disabled={!user}
          >
            <Text
              style={[
                styles.filterText,
                filter === tab && styles.filterTextActive,
                !user && { color: "#CBD5E1" },
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* GUEST UI OR LIST */}
      {!user ? (
        <View style={styles.guestContainer}>
          <View style={styles.guestIconWrapper}>
            <MaterialIcons
              name="history-toggle-off"
              size={36}
              color="#D32F2F"
            />
          </View>
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestText}>
            Create an account or sign in to save your ride history, view digital
            receipts, and track your expenses.
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
        <>
          {isOffline && (
            <View style={styles.offlineBanner}>
              <MaterialIcons name="cloud-off" size={14} color="#B45309" />
              <Text style={styles.offlineBannerText}>
                You are offline. Showing cached history.
              </Text>
            </View>
          )}
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.trip_id}
            renderItem={renderTripCard}
            ListHeaderComponent={renderSummaryCard}
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
                <Text style={styles.emptyText}>
                  {trips.length === 0
                    ? "No rides found."
                    : `No ${filter.toLowerCase()} rides found.`}
                </Text>
              </View>
            }
          />
        </>
      )}

      {/* RECEIPT MODAL */}
      <Modal
        visible={selectedTrip !== null}
        animationType="slide"
        transparent={true}
        statusBarTranslucent={true}
        onRequestClose={() => setSelectedTrip(null)}
      >
        {selectedTrip && (
          <View style={styles.modalContainer}>
            {/* THE MAP */}
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

                <Polyline
                  coordinates={modalPolylineCoords}
                  strokeWidth={isEstimatedRoute ? 3 : 5}
                  strokeColor={isEstimatedRoute ? "#94A3B8" : "#D32F2F"}
                  lineDashPattern={isEstimatedRoute ? [6, 4] : undefined}
                  lineCap="round"
                  lineJoin="round"
                />
              </MapView>

              {isEstimatedRoute && (
                <View
                  style={[
                    styles.estimatedBadge,
                    { top: Math.max(insets.top + 10, 20) }, // 🚀 SAFELY PUSHED DOWN
                  ]}
                >
                  <MaterialIcons
                    name="info-outline"
                    size={12}
                    color="#FCD34D"
                  />
                  <Text style={styles.estimatedBadgeText}>Estimated route</Text>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={[
                  styles.mapBackButton,
                  { top: Math.max(insets.top + 50, 60) }, // 🚀 SAFELY PUSHED DOWN
                ]}
                onPress={() => setSelectedTrip(null)}
              >
                <MaterialIcons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            {/* RECEIPT (SCROLLABLE BOTTOM SHEET) */}
            <View style={styles.receiptSection}>
              <View style={styles.receiptDragHandle} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                style={styles.receiptScrollView}
                contentContainerStyle={styles.receiptScrollContent}
              >
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptTripId}>
                    {selectedTrip.trip_id}
                  </Text>
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

                <View style={styles.routeAddressesBlock}>
                  <View style={styles.addressRow}>
                    <View style={styles.addressDotBlue} />
                    <View style={styles.addressTextWrapper}>
                      <Text style={styles.addressLabel}>PICK-UP</Text>
                      <Text style={styles.addressValue} numberOfLines={1}>
                        {selectedTrip.origin_name}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.addressConnector} />
                  <View style={styles.addressRow}>
                    <View style={styles.addressDotRed} />
                    <View style={styles.addressTextWrapper}>
                      <Text style={styles.addressLabel}>DROP-OFF</Text>
                      <Text style={styles.addressValue} numberOfLines={1}>
                        {selectedTrip.destination_name}
                      </Text>
                    </View>
                  </View>
                </View>

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
                      ₱ {(computedFareDisplay - 35).toFixed(2)}
                    </Text>
                  </View>

                  <View style={styles.receiptThickDivider} />

                  <View style={styles.fareRow}>
                    <Text style={styles.fareLabel}>Original Computed Fare</Text>
                    <Text style={styles.fareValue}>
                      ₱ {computedFareDisplay.toFixed(2)}
                    </Text>
                  </View>

                  {discountDisplay > 0 && (
                    <View style={styles.fareRow}>
                      <Text style={styles.fareLabelDiscount}>
                        Legal Discount (20%)
                      </Text>
                      <Text style={styles.fareValueDiscount}>
                        - ₱ {discountDisplay.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  {extraPaid > 0 && (
                    <View style={styles.fareRow}>
                      <Text
                        style={
                          selectedTrip.is_tip
                            ? styles.fareLabelTip
                            : styles.fareLabelWarning
                        }
                      >
                        {selectedTrip.is_tip ? "Voluntary Tip" : "Overcharge"}
                      </Text>
                      <Text
                        style={
                          selectedTrip.is_tip
                            ? styles.fareValueTip
                            : styles.fareValueWarning
                        }
                      >
                        + ₱ {extraPaid.toFixed(2)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.receiptThickDivider} />

                  <View style={styles.fareRow}>
                    <Text style={styles.totalLabel}>ACTUAL AMOUNT PAID</Text>
                    <Text style={styles.totalValue}>
                      ₱ {actualPaid.toFixed(2)}
                    </Text>
                  </View>
                </View>

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
              </ScrollView>
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

  offlineBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: "center",
    gap: 6,
  },
  offlineBannerText: { color: "#B45309", fontSize: 12, fontWeight: "600" },

  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    borderRadius: 16,
    paddingVertical: 16,
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryValue: { fontSize: 16, fontWeight: "900", color: "#0F172A" },
  summaryLabel: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 4,
    fontWeight: "700",
  },
  summaryDivider: { width: 1, height: "100%", backgroundColor: "#E2E8F0" },

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

  estimatedBadge: {
    position: "absolute",
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
    paddingTop: 16, // Instead of full padding, padding just for the drag handle
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
    marginBottom: 16,
  },
  receiptScrollView: {
    flex: 1,
    width: "100%",
  },
  receiptScrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40, // Keeps the buttons off the very bottom of screen
    paddingTop: 8,
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

  routeAddressesBlock: {
    marginBottom: 24,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  addressDotBlue: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#3B82F6",
    marginRight: 16,
  },
  addressDotRed: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#D32F2F",
    marginRight: 16,
  },
  addressConnector: {
    width: 2,
    height: 20,
    backgroundColor: "#CBD5E1",
    marginLeft: 4,
    marginVertical: 4,
  },
  addressTextWrapper: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  addressValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#0F172A",
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
  fareLabelWarning: { fontSize: 14, color: "#F59E0B", fontWeight: "700" },
  fareValueWarning: { fontSize: 14, fontWeight: "800", color: "#F59E0B" },
  fareLabelTip: { fontSize: 14, color: "#3B82F6", fontWeight: "700" },
  fareValueTip: { fontSize: 14, fontWeight: "800", color: "#3B82F6" },

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
