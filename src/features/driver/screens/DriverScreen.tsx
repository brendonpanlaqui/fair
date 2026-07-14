import { useDriverLocationStream } from "@/src/features/driver/hooks/useDriverLocationStream";
import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";
import { useAuth } from "@/src/hooks/AuthContext";
import { useDriverNotifications } from "@/src/hooks/useDriverNotifications";
import { api } from "@/src/services/api";
import { calculateTraceDistanceKm } from "@/src/utils/geofencing";
import {
  FontAwesome5,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import QRCode from "react-native-qrcode-svg";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

export default function DriverDashboard() {
  const { logout, user } = useAuth();

  const [isOnline, setIsOnline] = useState(true);
  const { currentLocation, drivenTrace } = useLocationTracking(true);
  useDriverLocationStream(isOnline);

  const mapRef = useRef<MapView>(null);
  const [isMapCentered, setIsMapCentered] = useState(false);

  const [activeTrip, setActiveTrip] = useState<any>(null);
  const [isLoadingTrip, setIsLoadingTrip] = useState(true);

  // --- NEW: Dynamic trip data states ---
  const [totalTripDistance, setTotalTripDistance] = useState(0);
  const [remainingDistance, setRemainingDistance] = useState(0);
  const [remainingTime, setRemainingTime] = useState(0);

  // Extract this so we can trigger it from the notification hook!
  const fetchCurrentTrip = useCallback(async () => {
    setIsLoadingTrip(true);
    try {
      const response = await api.get("/trips/driver/current/");
      if (response.data.has_active_trip) {
        setActiveTrip(response.data);
      } else {
        setActiveTrip(null);
      }
    } catch (error) {
      console.warn("Failed to fetch current trip status", error);
    } finally {
      setIsLoadingTrip(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchCurrentTrip();
    }, [fetchCurrentTrip]),
  );

  useEffect(() => {
    if (activeTrip) {
      setIsMapCentered(false);
      const initialDistance = activeTrip.distance || 0;
      setTotalTripDistance(initialDistance);
      setRemainingDistance(initialDistance);
      setRemainingTime(Math.max(1, Math.ceil(initialDistance * 3)));
    }
  }, [activeTrip]);

  // This effect will update the values as the driver moves
  useEffect(() => {
    if (activeTrip && drivenTrace.length > 1) {
      const distanceTraveled = calculateTraceDistanceKm(drivenTrace);
      const newRemainingDistance = Math.max(
        0,
        totalTripDistance - distanceTraveled,
      );
      setRemainingDistance(newRemainingDistance);
      setRemainingTime(Math.max(1, Math.ceil(newRemainingDistance * 3)));
    }
  }, [drivenTrace, totalTripDistance, activeTrip]);

  useEffect(() => {
    if (currentLocation && mapRef.current && !isMapCentered) {
      mapRef.current.animateToRegion(
        {
          ...currentLocation,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        },
        1000,
      );
      setIsMapCentered(true);
    }
  }, [currentLocation, isMapCentered]);

  useDriverNotifications({ onTripApproved: fetchCurrentTrip });

  const handleEndTrip = async (forceDropoff = false) => {
    if (!activeTrip) return;
    if (!currentLocation) {
      Alert.alert(
        "Location Error",
        "Waiting for GPS signal. Cannot verify location.",
      );
      return;
    }

    try {
      await api.post(`/trips/${activeTrip.trip_id}/complete/`, {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
        force_dropoff: forceDropoff, // Pass the override flag
      });

      Alert.alert("Trip Completed", "The passenger has been dropped off.");
      setActiveTrip(null);
    } catch (error: any) {
      // Catch the soft-geofence warning
      if (error.response?.data?.requires_confirmation) {
        Alert.alert("Far from Destination", error.response.data.error, [
          { text: "Cancel", style: "cancel" },
          {
            text: "Drop Off Anyway",
            style: "destructive",
            onPress: () => handleEndTrip(true), // Call again with force = true
          },
        ]);
      } else if (error.response && error.response.status === 400) {
        Alert.alert(
          "Cannot Drop Off",
          error.response.data.error || "An error occurred.",
        );
      } else {
        Alert.alert("Error", "Could not complete trip. Check your connection.");
      }
    }
  };

  const tricycleBodyNumber = user?.active_tricycle_body_number || "NO-TRICYCLE";

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar style="dark" translucent backgroundColor="transparent" />

      {/* HEADER: Avatar Left, Logo Center, Status Right */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.avatarPlaceholder} activeOpacity={0.8}>
          <Text style={styles.avatarText}>
            {user?.first_name ? user.first_name.charAt(0).toUpperCase() : ""}
          </Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.logoText}>fair</Text>
        </View>

        <TouchableOpacity
          style={styles.headerRightContainer}
          onPress={() => !activeTrip && setIsOnline(!isOnline)}
          disabled={!!activeTrip}
        >
          <Text
            style={[
              styles.headerStatusText,
              !isOnline && styles.headerStatusOffline,
            ]}
          >
            {isOnline ? "ONLINE" : "OFFLINE"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* MAIN CONTENT AREA */}
      <View style={styles.content}>
        {isLoadingTrip ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D32F2F" />
            <Text style={styles.loadingText}>Syncing Trip Data...</Text>
          </View>
        ) : activeTrip ? (
          /* =========================================
             ACTIVE TRIP UI (Matches Mockup) 
             ========================================= */
          <View style={styles.activeTripContainer}>
            {/* Map Area */}
            <View style={styles.mapArea}>
              <MapView
                ref={mapRef}
                style={StyleSheet.absoluteFill}
                initialRegion={
                  currentLocation
                    ? {
                        latitude: currentLocation.latitude,
                        longitude: currentLocation.longitude,
                        latitudeDelta: 0.02,
                        longitudeDelta: 0.02,
                      }
                    : undefined
                }
                showsMyLocationButton={false}
              >
                {currentLocation && (
                  <Marker
                    coordinate={currentLocation}
                    title="Your Location"
                    anchor={{ x: 0.5, y: 0.5 }}
                  >
                    <FontAwesome5 name="motorcycle" size={24} color="#D32F2F" />
                  </Marker>
                )}
                {currentLocation &&
                  activeTrip.destination_lat &&
                  activeTrip.destination_lng && (
                    <MapViewDirections
                      origin={currentLocation}
                      destination={{
                        latitude: activeTrip.destination_lat,
                        longitude: activeTrip.destination_lng,
                      }}
                      apikey={GOOGLE_API_KEY}
                      strokeWidth={5}
                      strokeColor="#D32F2F"
                    />
                  )}
                {activeTrip.destination_lat && activeTrip.destination_lng && (
                  <Marker
                    coordinate={{
                      latitude: activeTrip.destination_lat,
                      longitude: activeTrip.destination_lng,
                    }}
                    title="Destination"
                    pinColor="#0F172A"
                  />
                )}
              </MapView>
            </View>

            {/* Bottom Sheet Card */}
            <View style={styles.bottomSheet}>
              {/* Top Banner Pill */}
              <View style={styles.bannerWrapper}>
                <View style={styles.statusBanner}>
                  <MaterialIcons
                    name="two-wheeler"
                    size={16}
                    color="#D32F2F"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.statusText}>PASSENGER ONBOARD</Text>
                </View>
              </View>

              {/* Info Card */}
              <View style={styles.infoCard}>
                {/* Passenger Row */}
                <View style={styles.passengerRow}>
                  <View style={styles.avatarDark}>
                    <Text style={styles.avatarDarkText}>
                      {activeTrip.commuter_name?.charAt(0) || "P"}
                    </Text>
                  </View>
                  <View style={styles.passengerDetails}>
                    <Text style={styles.passengerName}>
                      {activeTrip.commuter_name || "Commuter"}
                    </Text>
                    <View style={styles.verifiedRow}>
                      <MaterialCommunityIcons
                        name="decagram-outline"
                        size={14}
                        color="#D32F2F"
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.passengerSubtext}>
                        Verified Passenger
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Metrics Row (3 Columns) */}
                <View style={styles.metricsRow}>
                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>GUARANTEED FARE</Text>
                    <Text style={styles.metricValueRed}>
                      ₱{activeTrip.fare?.toFixed(2) || "0.00"}
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>EST. ARRIVAL</Text>
                    <Text style={styles.metricValueDark}>
                      {remainingTime}
                      <Text style={styles.metricUnit}> min</Text>
                    </Text>
                  </View>

                  <View style={styles.verticalDivider} />

                  <View style={styles.metricBox}>
                    <Text style={styles.metricLabel}>REMAINING</Text>
                    <Text style={styles.metricValueDark}>
                      {remainingDistance.toFixed(1)}
                      <Text style={styles.metricUnit}> km</Text>
                    </Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.9}
                onPress={() => handleEndTrip()}
              >
                <MaterialCommunityIcons
                  name="flag-minus"
                  size={24}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.primaryButtonText}>DROP OFF</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* =========================================
             IDLE UI (QR Code) 
             ========================================= */
          <View style={styles.idleContainer}>
            <View style={styles.qrCard}>
              {tricycleBodyNumber !== "NO-TRICYCLE" ? (
                <>
                  <Text style={styles.scanInstruction}>
                    Commuters can scan to connect
                  </Text>
                  <View
                    style={[styles.qrWrapper, !isOnline && { opacity: 0.15 }]}
                  >
                    <QRCode
                      value={tricycleBodyNumber}
                      size={width * 0.55}
                      color="#0F172A"
                      backgroundColor="transparent"
                    />
                  </View>
                  <Text style={styles.bodyNumberLabel}>
                    TRICYCLE BODY NUMBER
                  </Text>
                  <Text style={styles.bodyNumberValue}>
                    #{tricycleBodyNumber}
                  </Text>
                </>
              ) : (
                <View style={{ alignItems: "center", paddingVertical: 40 }}>
                  <MaterialIcons
                    name="error-outline"
                    size={64}
                    color="#EF4444"
                    style={{ marginBottom: 16 }}
                  />
                  <Text
                    style={[
                      styles.bodyNumberLabel,
                      { textAlign: "center", color: "#EF4444" },
                    ]}
                  >
                    NO TRICYCLE ASSIGNED
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* FOOTER LOGOUT (Only when Idle) */}
      {!activeTrip && !isLoadingTrip && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.8}
            onPress={logout}
          >
            <MaterialIcons
              name="logout"
              size={20}
              color="#64748B"
              style={{ marginRight: 8, transform: [{ rotate: "180deg" }] }}
            />
            <Text style={styles.logoutButtonText}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // --- HEADER ---
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    position: "relative",
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarText: { fontSize: 16, color: "#FFFFFF", fontWeight: "800" },
  headerTitleContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
    paddingTop: 12,
    paddingBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    color: "#D32F2F",
    letterSpacing: -1,
  },
  headerRightContainer: {
    zIndex: 2,
    padding: 8,
  },
  headerStatusText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#D32F2F",
    letterSpacing: 1,
  },
  headerStatusOffline: {
    color: "#94A3B8",
  },

  content: { flex: 1 },

  // --- LOADING ---
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: {
    marginTop: 16,
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },

  // --- IDLE STATE ---
  idleContainer: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  qrCard: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    elevation: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    borderWidth: 1,
    borderColor: "#F8FAFC",
  },
  scanInstruction: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 24,
  },
  qrWrapper: {
    width: width * 0.6,
    height: width * 0.6,
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  bodyNumberLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 1.5,
  },
  bodyNumberValue: {
    fontSize: 52,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -2,
    marginTop: 4,
  },

  // --- ACTIVE TRIP STATE ---
  activeTripContainer: { flex: 1 },
  mapArea: {
    flex: 1,
    backgroundColor: "#F1F5F9", // Placeholder for actual map
    justifyContent: "center",
    alignItems: "center",
  },
  mapPlaceholderText: {
    marginTop: 12,
    color: "#94A3B8",
    fontWeight: "700",
    fontSize: 16,
  },

  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    elevation: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    marginTop: -32,
  },
  bannerWrapper: {
    alignItems: "center",
    marginBottom: 24,
    marginTop: -8,
  },
  statusBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF1F2",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  statusText: {
    color: "#D32F2F",
    fontSize: 12,
    fontWeight: "900",
    letterSpacing: 1,
  },

  infoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarDark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  avatarDarkText: { color: "#FFFFFF", fontSize: 22, fontWeight: "bold" },
  passengerDetails: { flex: 1 },
  passengerName: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  verifiedRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  passengerSubtext: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },

  actionButtonsRow: {
    flexDirection: "row",
    gap: 8,
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  divider: { height: 1, backgroundColor: "#E2E8F0", marginVertical: 20 },

  metricsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metricBox: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  metricValueRed: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D32F2F",
    letterSpacing: -0.5,
  },
  metricValueDark: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 14,
    fontWeight: "500",
    color: "#64748B",
  },

  primaryButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 24,
    height: 60,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 1,
  },

  // --- FOOTER ---
  footer: { paddingHorizontal: 24, paddingBottom: 40 },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logoutButtonText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
