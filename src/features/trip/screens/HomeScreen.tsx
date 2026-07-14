import MapHeader from "@/src/features/trip/components/setup/MapHeader";
import { MapPickerModal } from "@/src/features/trip/components/setup/MapPickerModal";
import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";
import { useAuth } from "@/src/hooks/AuthContext";
import { api } from "@/src/services/api";
import { ActiveFareMatrix, calculateDirectFare } from "@/src/utils/fareMatrix";
import { ANGELES_POLYGON, isWithinAngelesCity } from "@/src/utils/geofencing";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, Polygon, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const HomeScreen: React.FC = () => {
  const router = useRouter();
  const { isDiscountVerified, userType, user } = useAuth();

  useFocusEffect(
    useCallback(() => {
      // 2. Interceptor: Do not fire until the auth token/user is fully loaded
      if (!user) {
        console.log("Waiting for AuthContext to initialize...");
        return;
      }

      const checkOngoingTrip = async () => {
        try {
          console.log("Checking backend for ongoing trip...");
          const response = await api.get("/trips/commuter/current/");
          console.log("Recovery Response:", response.data);

          if (response.data.has_active_trip) {
            const trip = response.data;

            if (trip.status === "Active" || trip.status === "Pending") {
              console.log("Trip found! Redirecting to ActiveTripScreen...");
              router.replace({
                pathname: "/active-trip", // Make sure this matches your exact Expo Router filename
                params: {
                  tripId: trip.trip_id,
                  fixedFare: trip.fare,
                  lockedDistance: trip.distance,
                  bodyNumber: trip.body_number,
                  destLat: trip.dest_lat,
                  destLng: trip.dest_lng,
                  matrixId: trip.matrix_id,
                },
              });
            }
          }
        } catch (error: any) {
          // Improved error logging to see exactly what Django is complaining about
          console.warn(
            "Failed to check ongoing trip on startup:",
            error.response?.data || error.message,
          );
        }
      };

      checkOngoingTrip();
    }, [user]), // 3. Add 'user' to the dependency array
  );

  // states for trip computation and mapping
  const [activeMatrix, setActiveMatrix] = useState<ActiveFareMatrix | null>(
    null,
  );

  const [destination, setDestination] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [calculatedFare, setCalculatedFare] = useState<number | null>(null);
  const [lockedOrigin, setLockedOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  const [tripDistance, setTripDistance] = useState<number | null>(null);
  const [tripDuration, setTripDuration] = useState<number | null>(null);

  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"DIRECT" | "SPECIAL">(
    "DIRECT",
  );

  // controls visibility of the manual map pin dropper
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isInitialLocationCentered, setIsInitialLocationCentered] =
    useState(false);

  const mapRef = useRef<MapView>(null);
  const { currentLocation } = useLocationTracking();
  const [destinationName, setDestinationName] = useState<string | null>(null);

  // offline and sync states
  const [isOffline, setIsOffline] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [toastConfig, setToastConfig] = useState({
    message: "",
    type: "error",
  });
  // animation value for the sliding toast notification
  const slideAnim = useRef(new Animated.Value(150)).current;

  // displays an animated success or error toast message
  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToastConfig({ message, type });
    Animated.sequence([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: 150,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastConfig({ message: "", type: "error" }));
  };

  // fetches the active local fare ordinance from the server or local cache
  const fetchMatrix = async () => {
    setIsRetrying(true);
    try {
      const response = await api.get("/fare-matrix/active/");
      setActiveMatrix(response.data);
      setIsOffline(false);
      await AsyncStorage.setItem(
        "@cached_fare_matrix",
        JSON.stringify(response.data),
      );
    } catch (error: any) {
      try {
        const cached = await AsyncStorage.getItem("@cached_fare_matrix");
        if (cached) {
          setActiveMatrix(JSON.parse(cached));
          setIsOffline(true);
        } else {
          setActiveMatrix(null);
          setIsOffline(true);
          if (error.response) {
            showToast(
              error.response.data?.error ||
                "Failed to load active fare matrix.",
              "error",
            );
          }
        }
      } catch (cacheError) {
        setActiveMatrix(null);
        setIsOffline(true);
      }
    } finally {
      setIsRetrying(false);
    }
  };

  // attempts to upload any offline-saved trips to the database when the app loads
  const syncPendingTrips = async () => {
    try {
      const storedPending = await AsyncStorage.getItem("@pending_trips");
      if (storedPending) {
        const pendingTrips = JSON.parse(storedPending);
        if (pendingTrips && pendingTrips.length > 0) {
          const remainingTrips = [];
          let syncedCount = 0;
          for (const tripPayload of pendingTrips) {
            try {
              await api.post("/trips/submit/", tripPayload);
              syncedCount++;
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
          if (syncedCount > 0) {
            showToast(
              `Synced ${syncedCount} offline trip(s) successfully.`,
              "success",
            );
          }
        }
      }
    } catch (error) {
      console.error("Error syncing pending trips:", error);
    }
  };

  // fetch matrix and sync pending trips on component mount
  useEffect(() => {
    fetchMatrix();
    syncPendingTrips();
  }, []);

  // animates the map to the user's location once it's available and the map is ready
  useEffect(() => {
    if (isMapReady && currentLocation && !isInitialLocationCentered) {
      mapRef.current?.animateCamera(
        {
          center: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
          },
          zoom: 16,
        },
        { duration: 1000 },
      );
      setIsInitialLocationCentered(true);
    }
  }, [isMapReady, currentLocation, isInitialLocationCentered]);

  // recalculates the direct fare whenever the distance or matrix changes
  useEffect(() => {
    if (tripDistance && activeMatrix) {
      setCalculatedFare(
        calculateDirectFare(tripDistance, activeMatrix, isDiscountVerified),
      );
    }
  }, [isDiscountVerified, tripDistance, activeMatrix]);

  // handles when a user picks a destination, ensuring it is within city limits
  const handlePlaceSelected = (
    coords: { latitude: number; longitude: number },
    name: string,
  ) => {
    const isLegal = isWithinAngelesCity(coords.latitude, coords.longitude);
    if (!isLegal) {
      Alert.alert("Out of Bounds", "...");
      setDestination(null);
      setDestinationName(null);
      setCalculatedFare(null);
      setLockedOrigin(null);
      return;
    }
    setDestination(coords);
    setDestinationName(name);

    // Lock the origin to the user's current location when a destination is set
    if (currentLocation) {
      setLockedOrigin({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    } else {
      // Fallback if location is somehow still not available
      setLockedOrigin({ latitude: 15.149, longitude: 120.5779 });
      showToast("Could not get current location, using default.", "error");
    }
  };

  // processes the route drawn on the map, blocks trips over 12km, and calculates the final metrics
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

    if (activeMatrix) {
      const legalFare = calculateDirectFare(
        result.distance,
        activeMatrix,
        isDiscountVerified,
      );
      setCalculatedFare(legalFare);
    }

    setTripDistance(result.distance);
    setTripDuration(result.duration);

    setTimeout(() => {
      mapRef.current?.fitToCoordinates(result.coordinates, {
        edgePadding: { top: 140, right: 40, bottom: 250, left: 40 },
        animated: true,
      });
    }, 100);
  };

  // animates the map back to the user's current gps location
  const handleCenterLocation = async () => {
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
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (pos) {
          // This will trigger the hook to update
          return;
        }
      }
      showToast("GPS Signal Weak. Moving to Angeles City center...", "error");
      mapRef.current?.animateToRegion({
        latitude: 15.149,
        longitude: 120.5779,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      });
    }
  };

  // resets the selected destination and clears the drawn route
  const handleClearRoute = () => {
    setDestination(null);
    setDestinationName(null);
    setCalculatedFare(null);
    setTripDistance(null);
    setTripDuration(null);
    setLockedOrigin(null);
    handleCenterLocation();
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" translucent backgroundColor="transparent" />

      {/* map area showing current location and the drawn route to destination */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFillObject}
          initialRegion={{
            latitude: 15.149,
            longitude: 120.5779,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          onMapReady={() => setIsMapReady(true)}
          mapType="standard"
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          {/* Shaded background outside of Angeles City */}
          <Polygon
            coordinates={[
              { latitude: 35, longitude: 110 },
              { latitude: 35, longitude: 140 },
              { latitude: -5, longitude: 140 },
              { latitude: -5, longitude: 110 },
            ]}
            holes={[ANGELES_POLYGON]}
            fillColor="rgba(15, 23, 42, 0.15)"
            strokeWidth={0}
            zIndex={1}
          />
          {/* Red outline for Angeles City boundary */}
          <Polygon
            coordinates={ANGELES_POLYGON}
            strokeColor="rgba(211, 47, 47, 0.8)"
            fillColor="transparent"
            strokeWidth={2}
            zIndex={2}
          />
          {/* only show the user's location marker if it's available */}
          {currentLocation && (
            <Marker coordinate={currentLocation} title="Your Location" />
          )}

          {destination && <Marker coordinate={destination}></Marker>}

          {destination && (
            <MapViewDirections
              origin={lockedOrigin!}
              destination={destination}
              apikey={GOOGLE_API_KEY}
              strokeWidth={6}
              strokeColor="#D32F2F"
              optimizeWaypoints={false}
              onReady={handleRouteReady}
              onError={() =>
                showToast(
                  "Route calculation failed. Try another destination.",
                  "error",
                )
              }
            />
          )}
        </MapView>
      </View>

      {/* search header for destination picking */}
      <MapHeader
        googleApiKey={GOOGLE_API_KEY}
        onPlaceSelected={handlePlaceSelected}
        hasDestination={destination !== null}
        onClear={handleClearRoute}
        onChooseOnMap={() => setIsMapPickerVisible(true)}
      />

      {/* floating button to center map on user */}
      <View style={styles.rightControls}>
        <TouchableOpacity
          style={styles.roundButton}
          activeOpacity={0.8}
          onPress={handleCenterLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* floating card showing estimated travel time and distance */}
      {tripDistance && tripDuration && (
        <View style={styles.tripInfoCard}>
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

          <View style={styles.infoDivider} />

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

      {/* main bottom button to proceed with the trip setup */}
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
          <View
            style={{
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
            }}
          >
            <Text style={styles.primaryButtonText}>
              {calculatedFare
                ? `DIRECT FARE: ₱${calculatedFare}.00`
                : "START NEW TRIP"}
            </Text>
            {calculatedFare && isDiscountVerified && (
              <Text
                style={{
                  color: "#FECACA",
                  fontSize: 10,
                  fontWeight: "bold",
                  marginLeft: 12,
                  marginTop: 2,
                }}
              >
                ✓ {userType.toUpperCase()} DISCOUNT APPLIED
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* bottom sheet modal to select between direct and special ride modes */}
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

            {/* direct ride card - standard point a to b */}
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

            {/* special ride card - for multiple stopovers or chartered trips */}
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

            {/* confirm selection button to move to setup screen */}
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
                    destName: destinationName,
                    fare:
                      selectedMode === "DIRECT" ? calculatedFare : undefined,
                    distance:
                      selectedMode === "DIRECT" ? tripDistance : undefined,
                    duration:
                      selectedMode === "DIRECT" ? tripDuration : undefined,
                    matrixStr: JSON.stringify(activeMatrix),
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

      {/* modal for manual map pinning if the user opts out of autocomplete search */}
      <MapPickerModal
        visible={isMapPickerVisible}
        target="destination"
        initialLat={currentLocation?.latitude || 15.1444}
        initialLng={currentLocation?.longitude || 120.5928}
        onClose={() => setIsMapPickerVisible(false)}
        onConfirm={(lat: number, lng: number, addressName: string) => {
          setIsMapPickerVisible(false);
          handlePlaceSelected({ latitude: lat, longitude: lng }, addressName);
        }}
      />

      {/* custom animated toast notification element */}
      {toastConfig.message ? (
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateY: slideAnim }] },
            toastConfig.type === "success"
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <MaterialIcons
            name={toastConfig.type === "success" ? "check-circle" : "error"}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </Animated.View>
      ) : null}
    </View>
  );
};

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
    height: 60,
    paddingHorizontal: 16,
    backgroundColor: "#D32F2F",
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 8,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  primaryButtonDisabled: {
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 0,
    shadowOpacity: 0,
  },
  primaryButtonTextContainer: {
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    marginLeft: 12,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  primaryButtonTextDisabled: {
    color: "#94A3B8",
  },
  primaryButtonSubtext: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 0.5,
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
  toastContainer: {
    position: "absolute",
    bottom: 20,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 9999,
  },
  toastError: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  toastSuccess: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
});

export default HomeScreen;
