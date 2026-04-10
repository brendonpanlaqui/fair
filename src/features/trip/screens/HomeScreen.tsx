import MapHeader from "@/src/features/trip/components/setup/MapHeader";
import { MapPickerModal } from "@/src/features/trip/components/setup/MapPickerModal"; // 🚀 Imported the modal
import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";
import { calculateDirectFare } from "@/src/utils/fareMatrix";
import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
  Alert,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const HomeScreen: React.FC = () => {
  const router = useRouter();

  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);

  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [tripDuration, setTripDuration] = useState<number | null>(null);

  // Bottom Sheet States
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"DIRECT" | "SPECIAL">(
    "DIRECT",
  );

  // 🚀 NEW: State for Map Picker Modal
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);

  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationTracking();

  const mapCenter = currentLocation
    ? {
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      }
    : { latitude: 15.149, longitude: 120.5779 };

  const handlePlaceSelected = (
    coords: { latitude: number; longitude: number },
    name: string,
  ) => {
    const isLegal = isWithinAngelesCity(coords.latitude, coords.longitude);

    if (!isLegal) {
      Alert.alert(
        "Out of Bounds",
        `${name} is outside the allowed franchise area for Angeles City tricycles.`,
      );
      setDestination(null);
      setCalculatedFare(null);
      return;
    }

    setDestination(coords);
  };

  const handleRouteReady = (result: any) => {
    const MAX_TRICYCLE_DISTANCE_KM = 12;

    if (result.distance > MAX_TRICYCLE_DISTANCE_KM) {
      Alert.alert(
        "Route Too Long",
        "This destination exceeds the 12km service limit for local tricycles.",
      );
      setDestination(null);
      setCalculatedFare(null);
      setTripDistance(null);
      setTripDuration(null);
      return;
    }

    const legalFare = calculateDirectFare(result.distance);
    setCalculatedFare(legalFare);
    setTripDistance(result.distance);
    setTripDuration(result.duration);

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 140, right: 40, bottom: 250, left: 40 },
        animated: true,
      });
    }, 100);
  };

  const handleCenterLocation = () => {
    if (currentLocation && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          zoom: 16,
        },
        { duration: 800 },
      );
    } else {
      Alert.alert("Location Unavailable", "Still searching for GPS signal...");
    }
  };

  const handleClearRoute = () => {
    // 1. Clear all route data
    setDestination(null);
    setCalculatedFare(null);
    setTripDistance(null);
    setTripDuration(null);

    // 2. Smoothly fly the camera back to the user's physical location
    handleCenterLocation();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* 1. MAP AREA */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          region={
            destination
              ? undefined
              : {
                  ...mapCenter,
                  latitudeDelta: 0.015,
                  longitudeDelta: 0.015,
                }
          }
          mapType="standard"
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          <Marker coordinate={mapCenter} flat={true}></Marker>

          {destination && <Marker coordinate={destination}></Marker>}

          {destination && (
            <MapViewDirections
              origin={mapCenter}
              destination={destination}
              apikey={GOOGLE_API_KEY}
              strokeWidth={6}
              strokeColor="#D32F2F"
              optimizeWaypoints={true}
              onReady={handleRouteReady}
              onError={(errorMessage) =>
                console.error("Directions Error: ", errorMessage)
              }
            />
          )}
        </MapView>
      </View>

      {/* 2. HEADER */}
      <MapHeader
        googleApiKey={GOOGLE_API_KEY}
        onPlaceSelected={handlePlaceSelected}
        hasDestination={destination !== null}
        onClear={handleClearRoute}
        // 🚀 NEW: Hooked up the Choose on Map button
        onChooseOnMap={() => setIsMapPickerVisible(true)}
      />

      {/* 3. RIGHT CONTROLS */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          style={styles.roundButton}
          activeOpacity={0.8}
          onPress={handleCenterLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* 4. FLOATING TRIP INFO */}
      {tripDistance && tripDuration && (
        <View style={styles.tripInfoCard}>
          {/* Time Block */}
          <View style={styles.infoBlock}>
            <View style={styles.infoIconWrapper}>
              <MaterialCommunityIcons
                name="clock-fast"
                size={20}
                color="#D32F2F"
              />
            </View>
            <View>
              <Text style={styles.infoValue}>
                {Math.ceil(tripDuration)}{" "}
                <Text style={styles.infoUnit}>min</Text>
              </Text>
              <Text style={styles.infoLabel}>EST. TIME</Text>
            </View>
          </View>

          {/* Subtle Divider */}
          <View style={styles.infoDivider} />

          {/* Distance Block */}
          <View style={styles.infoBlock}>
            <View style={styles.infoIconWrapper}>
              <MaterialCommunityIcons
                name="map-marker-distance"
                size={20}
                color="#D32F2F"
              />
            </View>
            <View>
              <Text style={styles.infoValue}>
                {tripDistance.toFixed(1)}{" "}
                <Text style={styles.infoUnit}>km</Text>
              </Text>
              <Text style={styles.infoLabel}>DISTANCE</Text>
            </View>
          </View>
        </View>
      )}

      {/* 5. MAIN ACTION BUTTON */}
      <View style={styles.bottomButtonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.9}
          onPress={() => {
            setSelectedMode("DIRECT");
            setIsSheetVisible(true);
          }}
        >
          <MaterialCommunityIcons
            name="navigation-outline"
            size={26}
            color="#FFFFFF"
          />
          <Text style={styles.primaryButtonText}>
            {calculatedFare
              ? `DIRECT FARE: ₱${calculatedFare}.00`
              : "START NEW TRIP"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 6. TRIP SELECTION BOTTOM SHEET (MODAL) */}
      <Modal
        visible={isSheetVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSheetVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={() => setIsSheetVisible(false)}
            activeOpacity={1}
          />

          <View style={styles.bottomSheet}>
            <View style={styles.sheetDragHandle} />
            <Text style={styles.sheetTitle}>Select your Trip Type</Text>

            {/* DIRECT CARD */}
            <TouchableOpacity
              style={[
                styles.tripCard,
                selectedMode === "DIRECT" && styles.tripCardActive,
              ]}
              activeOpacity={0.9}
              onPress={() => setSelectedMode("DIRECT")}
            >
              <View
                style={[
                  styles.cardIconContainer,
                  selectedMode === "DIRECT"
                    ? styles.iconActiveBg
                    : styles.iconInactiveBg,
                ]}
              >
                <MaterialIcons
                  name="navigation"
                  size={24}
                  color={selectedMode === "DIRECT" ? "#FFFFFF" : "#64748B"}
                  style={{ transform: [{ rotate: "45deg" }] }}
                />
              </View>

              <View style={styles.cardTextContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>DIRECT</Text>
                  <View style={styles.badgeRed}>
                    <Text style={styles.badgeRedText}>LOCKED FARE</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtext}>
                  Straight to your destination, no stopovers
                </Text>
              </View>

              <Text
                style={[
                  styles.cardPrice,
                  !calculatedFare && {
                    color: "#94A3B8",
                    fontSize: 13,
                    fontWeight: "bold",
                  },
                ]}
              >
                {calculatedFare ? `₱ ${calculatedFare}.00` : "--"}
              </Text>
            </TouchableOpacity>

            {/* SPECIAL CARD */}
            <TouchableOpacity
              style={[
                styles.tripCard,
                selectedMode === "SPECIAL" && styles.tripCardActive,
              ]}
              activeOpacity={0.9}
              onPress={() => setSelectedMode("SPECIAL")}
            >
              <View
                style={[
                  styles.cardIconContainer,
                  selectedMode === "SPECIAL"
                    ? styles.iconActiveBg
                    : styles.iconInactiveBg,
                ]}
              >
                <MaterialIcons
                  name="alt-route"
                  size={24}
                  color={selectedMode === "SPECIAL" ? "#FFFFFF" : "#64748B"}
                />
              </View>

              <View style={styles.cardTextContent}>
                <View style={styles.cardHeaderRow}>
                  <Text style={styles.cardTitle}>SPECIAL</Text>
                  <View style={styles.badgeGray}>
                    <Text style={styles.badgeGrayText}>MULTI-STOP</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtext}>
                  Fixed fare based on total distance
                </Text>
              </View>

              <Text
                style={[
                  styles.cardPrice,
                  { color: "#94A3B8", fontSize: 13, fontWeight: "bold" },
                ]}
              >
                Set route next
              </Text>
            </TouchableOpacity>

            {/* CONFIRM BUTTON */}
            <TouchableOpacity
              style={styles.confirmSheetButton}
              activeOpacity={0.9}
              onPress={() => {
                setIsSheetVisible(false);
                router.push({
                  pathname: "/start-trip",
                  params: {
                    mode: selectedMode,
                    destLat: destination?.latitude,
                    destLng: destination?.longitude,
                    fare:
                      selectedMode === "DIRECT" ? calculatedFare : undefined,
                    distance:
                      selectedMode === "DIRECT" ? tripDistance : undefined,
                    duration:
                      selectedMode === "DIRECT" ? tripDuration : undefined,
                  },
                });
              }}
            >
              <Text style={styles.confirmSheetButtonText}>
                CONFIRM {selectedMode} RIDE
              </Text>
            </TouchableOpacity>
            <Text style={styles.legalMicrocopy}>
              Fare computed based on Angeles City Ordinance No. 723.
            </Text>
          </View>
        </View>
      </Modal>

      {/* 🚀 7. RENDER THE MAP PICKER MODAL */}
      <MapPickerModal
        visible={isMapPickerVisible}
        target="destination"
        initialLat={currentLocation?.latitude || 15.1444}
        initialLng={currentLocation?.longitude || 120.5928}
        onClose={() => setIsMapPickerVisible(false)}
        onConfirm={(lat: number, lng: number, addressName: string) => {
          setIsMapPickerVisible(false);
          // Pass the chosen location back into your existing route handler!
          handlePlaceSelected({ latitude: lat, longitude: lng }, addressName);
        }}
      />
    </View>
  );
};

// ==========================================
// STYLES
// ==========================================
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  mapArea: { flex: 1, position: "relative" },
  rightControls: {
    position: "absolute",
    right: 16,
    bottom: 100,
    zIndex: 10,
  },
  roundButton: {
    width: 48,
    height: 48,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 12,
  },
  bottomButtonsContainer: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    gap: 12,
    zIndex: 10,
  },
  primaryButton: {
    height: 64,
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 12,
  },
  legalMicrocopy: {
    textAlign: "center",
    fontSize: 10,
    color: "#94A3B8",
    marginTop: 12,
    letterSpacing: 0.5,
  },
  tripInfoCard: {
    position: "absolute",
    bottom: 100,
    left: 16,
    right: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    elevation: 12,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    zIndex: 10,
  },
  infoBlock: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  infoIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  infoUnit: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.5,
    marginTop: 2,
  },
  infoDivider: {
    width: 1,
    height: 36,
    backgroundColor: "#F1F5F9",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },
  tripCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    marginBottom: 12,
  },
  tripCardActive: {
    borderColor: "#D32F2F",
    backgroundColor: "#FEF2F2",
    borderWidth: 1.5,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  iconActiveBg: { backgroundColor: "#D32F2F" },
  iconInactiveBg: { backgroundColor: "#F1F5F9" },
  cardTextContent: { flex: 1 },
  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginRight: 8,
  },
  cardSubtext: { fontSize: 13, color: "#64748B" },
  badgeRed: {
    backgroundColor: "#D32F2F",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRedText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  badgeGray: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeGrayText: {
    color: "#475569",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  cardPrice: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  confirmSheetButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  confirmSheetButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 1,
  },
});

export default HomeScreen;
