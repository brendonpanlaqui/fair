import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";
import { useAuth } from "@/src/hooks/AuthContext";
import { api } from "@/src/services/api";
import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { useCameraPermissions } from "expo-camera";
import { useTripSetup } from "../hooks/useTripSetup";

import { MapPickerModal } from "../components/setup/MapPickerModal";
import QRScannerModal from "../components/setup/QRScannerModal";
import { RouteTimeline } from "../components/setup/RouteTimeline";

// generates a unique session token for google places autocomplete to reduce billing costs
const generateSessionToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const StartTripScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { isDiscountVerified, userType } = useAuth();

  // retrieve matrix and passed parameters from the previous screen
  const activeMatrix = params.matrixStr
    ? JSON.parse(params.matrixStr as string)
    : null;

  const passedMode = (params.mode as string) || "SPECIAL";
  const passedDistance = params.distance ? Number(params.distance) : null;
  const passedFare = params.fare ? Number(params.fare) : null;
  const destLat = params.destLat ? Number(params.destLat) : null;
  const destLng = params.destLng ? Number(params.destLng) : null;
  const destName = (params.destName as string) || null;

  const { currentLocation } = useLocationTracking();

  // lock the starting location so it doesn't change if the user moves while setting up the trip
  const [frozenOrigin, setFrozenOrigin] = useState<{
    lat: number;
    lng: number;
  } | null>(
    params.originLat && params.originLng
      ? { lat: Number(params.originLat), lng: Number(params.originLng) }
      : null,
  );

  useEffect(() => {
    if (currentLocation && !frozenOrigin) {
      setFrozenOrigin({
        lat: currentLocation.latitude,
        lng: currentLocation.longitude,
      });
    }
  }, [currentLocation, frozenOrigin]);

  const safeOriginLat = frozenOrigin?.lat || 15.149;
  const safeOriginLng = frozenOrigin?.lng || 120.5779;

  // custom hook that manages the complex logic of distance routing, stopovers, and fare computation
  const {
    finalDest,
    setFinalDest,
    stopovers,
    setStopovers,
    calculatedDistance,
    calculatedFare,
    isCalculating,
    removeStopover,
  } = useTripSetup(
    safeOriginLat,
    safeOriginLng,
    passedMode,
    passedDistance,
    passedFare,
    destLat,
    destLng,
    destName,
    activeMatrix,
    isDiscountVerified,
  );

  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"stopover" | "destination">(
    "destination",
  );
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);
  const [sessionToken, setSessionToken] = useState(generateSessionToken());

  const [bodyNumber, setBodyNumber] = useState<string>("");
  const [plateNumber, setPlateNumber] = useState<string>("");

  const [scanMethod, setScanMethod] = useState<"MANUAL" | "QR">("MANUAL");

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);

  // state to disable buttons while pinging the server
  const [isVerifying, setIsVerifying] = useState(false);

  // --- NEW STATES FOR APPROVAL HANDSHAKE ---
  const [isWaitingForDriver, setIsWaitingForDriver] = useState(false);
  const [pendingTripId, setPendingTripId] = useState<string | null>(null);

  // --- NEW: Handler for cancelling a PENDING trip ---
  const handleCancelPendingTrip = async () => {
    if (!pendingTripId) return;
    try {
      await api.post(`/trips/${pendingTripId}/cancel/`);
    } catch (error) {
      console.error("Failed to cancel trip on backend:", error);
      // Optional: Alert the user if the backend call fails, though it's an edge case.
      // Alert.alert("Error", "Failed to notify the driver of cancellation.");
    } finally {
      // Stop polling and close the modal regardless of API success
      setIsWaitingForDriver(false);
      setPendingTripId(null);
    }
  };

  // --- SHORT-POLLING LOOP ---
  // This checks Django every 3 seconds while the Waiting Modal is open
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isWaitingForDriver && pendingTripId) {
      interval = setInterval(async () => {
        try {
          // Replace with your actual Django endpoint that checks trip status
          const response = await api.get(`/trips/${pendingTripId}/status/`);

          if (response.data.status === "Active") {
            // THE DRIVER SAID YES!
            clearInterval(interval);
            setIsWaitingForDriver(false);

            // Now we actually move to the Active Trip screen
            router.push({
              pathname: "/active-trip",
              params: {
                tripId: pendingTripId,
                mode: passedMode,
                fixedFare: calculatedFare,
                lockedDistance: calculatedDistance,
                bodyNumber: bodyNumber,
                destLat: finalDest?.lat,
                destLng: finalDest?.lng,
                stopovers: JSON.stringify(stopovers),
                destName: finalDest?.name || "Unknown Destination",
                originName: "Current Location",
                matrixId: 1,
              },
            });
          } else if (
            response.data.status === "Declined" ||
            response.data.status === "Cancelled"
          ) {
            // THE DRIVER SAID NO
            clearInterval(interval);
            setIsWaitingForDriver(false);
            Alert.alert(
              "Trip Declined",
              "The driver declined the trip request. Please find another tricycle.",
            );
          }
        } catch (error) {
          console.log("Polling error:", error);
        }
      }, 3000); // Poll every 3 seconds
    }

    return () => clearInterval(interval);
  }, [isWaitingForDriver, pendingTripId]);

  // automatically open the destination search modal if it's not set
  useEffect(() => {
    if (!destLat || !destLng) {
      setSearchTarget("destination");
      setIsSearchModalVisible(true);
    }
  }, []);

  // handles the swipe down gesture to dismiss the search modal
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return gestureState.dy > 20 && Math.abs(gestureState.dx) < 30;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        return gestureState.dy > 30 && gestureState.vy > 0.3;
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 40) {
          setIsSearchModalVisible(false);
        }
      },
    }),
  ).current;

  // asks for camera permission before opening the QR scanner
  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission Required",
          "Fair needs camera access to scan the driver's QR code.",
        );
        return;
      }
    }
    setIsCameraVisible(true);
  };

  // instantly sets the body number when the QR code is successfully scanned
  const handleQRScanned = (scannedBodyNumber: string) => {
    setBodyNumber(scannedBodyNumber);
    setScanMethod("QR");
    setIsCameraVisible(false);
  };

  // validates inputs, checks the tricycle status in the backend, and starts the trip
  const handleConfirmRoute = async () => {
    if (!frozenOrigin) {
      Alert.alert(
        "Locating...",
        "Please wait a moment while we get your exact starting location.",
      );
      return;
    }

    if (!isWithinAngelesCity(safeOriginLat, safeOriginLng)) {
      Alert.alert(
        "Out of Bounds",
        "Your starting location is outside Angeles City. Ordinance No. 723 only covers trips within Angeles City limits.",
      );
      return;
    }

    if (!finalDest || !calculatedFare) {
      Alert.alert(
        "Destination Required",
        "Please select a destination to compute the fare.",
      );
      return;
    }
    if (!bodyNumber) {
      Alert.alert(
        "Body Number Required",
        "Please enter the tricycle body number to continue.",
      );
      return;
    }

    const proceedToTrip = () => {
      router.push({
        pathname: "/active-trip",
        params: {
          mode: passedMode,
          fixedFare: calculatedFare,
          lockedDistance: calculatedDistance,
          bodyNumber: bodyNumber,
          destLat: finalDest?.lat,
          destLng: finalDest?.lng,
          stopovers: JSON.stringify(stopovers),
          destName: finalDest?.name || "Unknown Destination",
          originName: "Current Location",
          matrixId: 1,
        },
      });
    };

    setIsVerifying(true);

    try {
      // send the full trip details to Django to create a 'Pending' trip
      // Django should send the FCM to the driver inside this endpoint!
      const payload = {
        body_number: bodyNumber,
        destination_lat: finalDest?.lat,
        destination_lng: finalDest?.lng,
        fare: calculatedFare,
        distance: calculatedDistance,
      };

      const response = await api.post("/trips/request/", payload);

      // grab the new Trip ID from Django
      const newTripId = response.data.trip_id;

      // open the Waiting Modal and start the polling loop!
      setPendingTripId(newTripId);
      setIsWaitingForDriver(true);
    } catch (error: any) {
      // Look directly at what Django sent back
      const serverErrorMessage = error.response?.data?.error;

      if (error.response?.status === 404) {
        if (serverErrorMessage === "Driver is not available or offline.") {
          Alert.alert(
            "Driver Offline",
            "This tricycle is registered, but the driver is currently offline or their profile is not properly linked in the system.",
          );
        } else {
          Alert.alert(
            "⚠️ Unregistered Tricycle",
            "This tricycle body number is not registered.",
          );
        }
      } else {
        Alert.alert(
          "Error",
          serverErrorMessage || "Could not request trip. Please try again.",
        );
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* header section */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{"Trip Setup"}</Text>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
        >
          <Text
            style={[styles.sectionTitle, { marginTop: 8, marginBottom: 16 }]}
          >
            {"Your Route"}
          </Text>

          <RouteTimeline
            mode={passedMode}
            finalDest={finalDest}
            stopovers={stopovers}
            isCalculating={isCalculating}
            calculatedDistance={calculatedDistance}
            onOpenSearch={(target) => {
              setSearchTarget(target);
              setSessionToken(generateSessionToken()); // reset token on open to prevent stale sessions
              setIsSearchModalVisible(true);
            }}
            onRemoveStopover={removeStopover}
          />

          {/* tricycle details section */}
          <Text style={styles.sectionTitle}>{"Tricycle Details"}</Text>

          <View style={styles.detailsCard}>
            {bodyNumber.length > 0 && scanMethod === "QR" ? (
              <View style={styles.successScannerBox}>
                <View style={styles.successIconWrapper}>
                  <MaterialIcons
                    name="check-circle"
                    size={40}
                    color="#10B981"
                  />
                </View>
                <Text style={styles.successBoxTitle}>Driver Linked</Text>
                <Text style={styles.successBoxSubtext}>
                  Successfully scanned driver's QR code
                </Text>
                <TouchableOpacity
                  style={styles.retakeButton}
                  activeOpacity={0.8}
                  onPress={handleOpenScanner}
                >
                  <MaterialIcons
                    name="qr-code-scanner"
                    size={16}
                    color="#64748B"
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.retakeButtonText}>Scan Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.giantScannerBox}
                activeOpacity={0.8}
                onPress={handleOpenScanner}
              >
                <MaterialIcons
                  name="qr-code-scanner"
                  size={64}
                  color="#D32F2F"
                  style={{ marginBottom: 12 }}
                />
                <Text style={styles.scannerBoxTitle}>
                  {"Scan Driver's QR Code"}
                </Text>
                <Text style={styles.scannerBoxSubtext}>
                  {"Point camera at the driver's Fair app."}
                </Text>
              </TouchableOpacity>
            )}

            {/* floating label inputs for manual entry */}
            <View
              style={[
                styles.floatingInputWrapper,
                bodyNumber.length > 0 ? styles.floatingInputSuccess : null,
              ]}
            >
              <View style={styles.floatingLabelContainer}>
                <Text style={styles.floatingLabelText}>
                  {"Body Number "}
                  <Text style={styles.floatingLabelSubtext}>
                    {"(Required)"}
                  </Text>
                </Text>
              </View>
              <TextInput
                style={styles.floatingInput}
                placeholder="e.g., 0406"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={bodyNumber}
                onChangeText={(text) => {
                  setBodyNumber(text);
                  if (scanMethod === "QR") {
                    setScanMethod("MANUAL");
                  }
                }}
              />
              {bodyNumber.length > 0 && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color="#10B981"
                  style={{ position: "absolute", right: 16 }}
                />
              )}
            </View>

            <View style={[styles.floatingInputWrapper, { marginBottom: 0 }]}>
              <View style={styles.floatingLabelContainer}>
                <Text style={styles.floatingLabelText}>
                  {"Plate Number "}
                  <Text style={styles.floatingLabelSubtext}>
                    {"(Optional)"}
                  </Text>
                </Text>
              </View>
              <TextInput
                style={styles.floatingInput}
                placeholder="e.g., ABC 1234"
                placeholderTextColor="#94A3B8"
                autoCapitalize="characters"
                value={plateNumber}
                onChangeText={setPlateNumber}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      {/* split-layout bottom confirm button */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            (!finalDest || !bodyNumber || isCalculating || isVerifying) &&
              styles.verifyButtonDisabled,
          ]}
          activeOpacity={0.9}
          onPress={handleConfirmRoute}
          disabled={!finalDest || !bodyNumber || isCalculating || isVerifying}
        >
          {isCalculating || isVerifying ? (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <ActivityIndicator color="#64748B" style={{ marginRight: 12 }} />
              <Text style={styles.verifyButtonTextDisabled}>
                {isVerifying ? "VERIFYING TRICYCLE..." : "CALCULATING FARE..."}
              </Text>
            </View>
          ) : !finalDest ? (
            <Text style={styles.verifyButtonTextDisabled}>
              {"SELECT DESTINATION FIRST"}
            </Text>
          ) : !bodyNumber ? (
            <Text style={styles.verifyButtonTextDisabled}>
              {"ENTER BODY NUMBER"}
            </Text>
          ) : (
            <View style={styles.activeButtonRow}>
              <View style={styles.buttonTextColumn}>
                <Text style={styles.verifyButtonText}>{"VERIFY & START"}</Text>
                {isDiscountVerified ? (
                  <Text style={styles.verifyButtonSubtext}>
                    {`✓ ${userType.toUpperCase()} 20% OFF`}
                  </Text>
                ) : (
                  <Text style={styles.verifyButtonSubtext}>
                    {"STANDARD LGU FARE"}
                  </Text>
                )}
              </View>
              <Text style={styles.verifyButtonPrice}>
                {`₱${calculatedFare}.00`}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* modals for map picker, qr scanning, and place search */}
      <MapPickerModal
        visible={isMapPickerVisible}
        target={searchTarget}
        initialLat={currentLocation?.latitude || safeOriginLat}
        initialLng={currentLocation?.longitude || safeOriginLng}
        onClose={() => setIsMapPickerVisible(false)}
        onConfirm={(lat: number, lng: number, addressName: string) => {
          if (searchTarget === "stopover") {
            setStopovers((prev) => [
              ...prev,
              {
                id: Math.random().toString(),
                name: addressName,
                subtext: "Pinned Location",
                latitude: lat,
                longitude: lng,
              },
            ]);
          } else {
            setFinalDest({ lat, lng, name: addressName });
          }
          setIsMapPickerVisible(false);
        }}
      />

      <QRScannerModal
        visible={isCameraVisible}
        onClose={() => setIsCameraVisible(false)}
        onSuccess={handleQRScanned}
      />

      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View style={styles.searchModalOverlay}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={() => setIsSearchModalVisible(false)}
          />

          <View style={styles.searchModalContent} {...panResponder.panHandlers}>
            <View style={styles.sheetDragHandle} />
            <View style={styles.searchModalHeader}>
              <Text style={styles.searchModalTitle}>
                {searchTarget === "stopover"
                  ? "Search Stopover"
                  : "Search Destination"}
              </Text>
              <TouchableOpacity
                onPress={() => setIsSearchModalVisible(false)}
                style={styles.searchModalCloseButton}
              >
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, position: "relative", marginTop: 12 }}>
              <GooglePlacesAutocomplete
                placeholder={
                  searchTarget === "stopover"
                    ? "Where do you want to stop?"
                    : "Where are you heading?"
                }
                fetchDetails={true}
                enablePoweredByContainer={false}
                debounce={800}
                minLength={2}
                GooglePlacesDetailsQuery={{ fields: "geometry,name" }}
                onPress={(data, details = null) => {
                  if (details) {
                    const lat = details.geometry.location.lat;
                    const lng = details.geometry.location.lng;
                    const fullAddress = data.description.toLowerCase();
                    const isActuallyAngeles =
                      fullAddress.includes("angeles city") ||
                      fullAddress.includes("angeles,");

                    if (!isActuallyAngeles) {
                      Alert.alert(
                        "Cross-Border Trip",
                        "Ordinance No. 723 only covers fares inside Angeles City. Tricycles must return empty from other municipalities, so cross-border fares (e.g. to Magalang or Mabalacat) must be negotiated directly with the driver.",
                      );
                      return; // block sila from picking places outside AC
                    }
                    if (!isWithinAngelesCity(lat, lng)) {
                      Alert.alert(
                        "Out of Bounds",
                        "Locations must be within Angeles City limits.",
                      );
                      return;
                    }
                    if (searchTarget === "stopover") {
                      setStopovers((prev) => [
                        ...prev,
                        {
                          id: Math.random().toString(),
                          name: data.structured_formatting.main_text,
                          subtext: "Stopover (Driver Waits)",
                          latitude: lat,
                          longitude: lng,
                        },
                      ]);
                    } else {
                      setFinalDest({
                        lat,
                        lng,
                        name: data.structured_formatting.main_text,
                      });
                    }
                    setIsSearchModalVisible(false);
                    setSessionToken(generateSessionToken());
                  }
                }}
                query={{
                  key: GOOGLE_API_KEY,
                  language: "en",
                  components: "country:ph",
                  location: "15.1444,120.5928",
                  radius: "8000",
                  strictbounds: true,
                  sessiontoken: sessionToken,
                }}
                renderRow={(rowData) => (
                  <View style={styles.customRow}>
                    <View style={styles.rowIconContainer}>
                      <MaterialIcons
                        name="location-on"
                        size={20}
                        color="#94A3B8"
                      />
                    </View>
                    <View style={styles.rowTextContainer}>
                      <Text style={styles.rowTitle} numberOfLines={1}>
                        {rowData.structured_formatting.main_text}
                      </Text>
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {rowData.structured_formatting.secondary_text ||
                          "Angeles City, Pampanga"}
                      </Text>
                    </View>
                  </View>
                )}
                styles={{
                  container: { flex: 0 },
                  textInputContainer: {
                    backgroundColor: "#F8FAFC",
                    borderRadius: 16,
                    paddingHorizontal: 12,
                    borderWidth: 1,
                    borderColor: "#E2E8F0",
                    flexDirection: "row",
                    alignItems: "center",
                    height: 56,
                  },
                  textInput: {
                    height: 52,
                    color: "#0F172A",
                    fontSize: 16,
                    backgroundColor: "transparent",
                    margin: 0,
                    padding: 0,
                  },
                  listView: {
                    position: "absolute",
                    top: 64,
                    left: 0,
                    right: 0,
                    backgroundColor: "#FFFFFF",
                    borderRadius: 16,
                    elevation: 10,
                    shadowColor: "#0F172A",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.15,
                    shadowRadius: 12,
                    zIndex: 9999,
                  },
                  separator: { height: 1, backgroundColor: "#F1F5F9" },
                }}
                textInputProps={{
                  autoFocus: true,
                  placeholderTextColor: "#94A3B8",
                }}
                renderLeftButton={() => (
                  <MaterialIcons
                    name="search"
                    size={22}
                    color="#94A3B8"
                    style={{ marginRight: 8 }}
                  />
                )}
              />

              <TouchableOpacity
                style={styles.standaloneChooseOnMapBtn}
                onPress={() => {
                  setIsSearchModalVisible(false);
                  setTimeout(() => setIsMapPickerVisible(true), 300);
                }}
              >
                <View style={styles.chooseOnMapIconBg}>
                  <MaterialIcons name="place" size={20} color="#D32F2F" />
                </View>
                <View>
                  <Text style={styles.chooseOnMapTitle}>{"Choose on Map"}</Text>
                  <Text style={styles.chooseOnMapSubtext}>
                    {"Pinpoint your exact location"}
                  </Text>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color="#CBD5E1"
                  style={{ marginLeft: "auto" }}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* WAITING FOR DRIVER APPROVAL MODAL */}
      <Modal
        visible={isWaitingForDriver}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setIsWaitingForDriver(false)}
      >
        <View style={styles.searchModalOverlay}>
          <View
            style={[
              styles.searchModalContent,
              { height: "auto", paddingBottom: 40 },
            ]}
          >
            <View style={{ alignItems: "center", marginTop: 20 }}>
              <View style={styles.radarCircle}>
                <ActivityIndicator size="large" color="#D32F2F" />
              </View>

              <Text style={styles.searchModalTitle}>Request Sent!</Text>
              <Text
                style={[
                  styles.scannerBoxSubtext,
                  { textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
                ]}
              >
                Waiting for the driver of Tricycle #{bodyNumber} to approve the
                trip on their device.
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.standaloneChooseOnMapBtn,
                { marginTop: 40, justifyContent: "center" },
              ]}
              onPress={handleCancelPendingTrip}
            >
              <Text
                style={[
                  styles.chooseOnMapTitle,
                  { color: "#D32F2F", marginBottom: 0 },
                ]}
              >
                Cancel Request
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    zIndex: 10,
  },
  radarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#FECACA",
    borderStyle: "dashed",
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: { color: "#0F172A", fontSize: 18, fontWeight: "900" },
  content: { flex: 1, padding: 20 },

  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 24,
    marginBottom: 12,
  },

  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    marginBottom: 24,
  },

  giantScannerBox: {
    backgroundColor: "#FFF1F2",
    borderWidth: 2,
    borderColor: "#FECACA",
    borderStyle: "dashed",
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  scannerBoxTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 4,
  },
  scannerBoxSubtext: { fontSize: 13, color: "#64748B" },

  successScannerBox: {
    backgroundColor: "#ECFDF5",
    borderWidth: 2,
    borderColor: "#A7F3D0",
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  successIconWrapper: {
    backgroundColor: "#FFFFFF",
    borderRadius: 40,
    padding: 4,
    elevation: 2,
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: 12,
  },
  successBoxTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#065F46",
    marginBottom: 4,
  },
  successBoxSubtext: {
    fontSize: 13,
    color: "#059669",
    marginBottom: 16,
  },
  retakeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  retakeButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },

  floatingInputWrapper: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    marginBottom: 20,
    position: "relative",
    height: 60,
    justifyContent: "center",
  },
  floatingInputSuccess: {
    borderColor: "#10B981",
    borderWidth: 2,
  },
  floatingLabelContainer: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    zIndex: 1,
  },
  floatingLabelText: { fontSize: 12, fontWeight: "600", color: "#475569" },
  floatingLabelSubtext: { color: "#94A3B8", fontWeight: "400" },
  floatingInput: {
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#0F172A",
    height: "100%",
  },

  bottomFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FAFAFA",
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 36,
  },
  verifyButton: {
    backgroundColor: "#D32F2F",
    borderRadius: 16,
    height: 64,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    elevation: 4,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  verifyButtonDisabled: {
    backgroundColor: "#E2E8F0",
    elevation: 0,
    shadowOpacity: 0,
  },
  activeButtonRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonTextColumn: { flexDirection: "column", alignItems: "flex-start" },
  verifyButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  verifyButtonTextDisabled: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  verifyButtonSubtext: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  verifyButtonPrice: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.5,
  },

  searchModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  searchModalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    padding: 24,
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#CBD5E1",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 8,
  },
  searchModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  searchModalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  searchModalCloseButton: {
    backgroundColor: "#F1F5F9",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  rowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowTextContainer: { flex: 1, justifyContent: "center" },
  rowTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  rowSubtitle: { fontSize: 13, color: "#64748B", fontWeight: "500" },

  standaloneChooseOnMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  chooseOnMapIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  chooseOnMapTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  chooseOnMapSubtext: { fontSize: 13, color: "#64748B", fontWeight: "500" },
});

export default StartTripScreen;
