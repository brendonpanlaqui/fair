import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  PanResponder,
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
import { api } from "@/src/services/api"; // 🚀 Imported your API service
import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { useCameraPermissions } from "expo-camera";
import { useTripSetup } from "../hooks/useTripSetup";

import TextRecognition from "@react-native-ml-kit/text-recognition";
import { MapPickerModal } from "../components/setup/MapPickerModal";
import { OCRScannerModal } from "../components/setup/OCRScannerModal";
import { RouteTimeline } from "../components/setup/RouteTimeline";

const generateSessionToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const StartTripScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const { isDiscountVerified, userType } = useAuth();

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

  const [scanMethod, setScanMethod] = useState<"MANUAL" | "OCR">("MANUAL");

  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false); // 🚀 Added verifying state

  // UX IMPROVEMENT 1: Auto-open modal if no destination is set
  useEffect(() => {
    if (!destLat || !destLng) {
      setSearchTarget("destination");
      setIsSearchModalVisible(true);
    }
  }, []);

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

  const handleOpenScanner = async () => {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert(
          "Permission Required",
          "Fair needs camera access to scan tricycle body numbers.",
        );
        return;
      }
    }
    setIsCameraVisible(true);
  };

  const handleProcessOCR = async (imageUri: string) => {
    if (imageUri === "DEV_MOCK_SCAN_TRIGGER") {
      setBodyNumber("2-2500");
      setScanMethod("OCR");
      setIsCameraVisible(false);
      setIsScanningOCR(false);
      return;
    }

    try {
      const result = await TextRecognition.recognize(imageUri);
      const fullText = result.text;

      if (fullText && fullText.length > 0) {
        const bodyNumRegex = /\b(?:\d{1,2}-)?\d{3,4}\b/g;
        const matches = fullText.match(bodyNumRegex);

        if (matches) {
          const ignoreList = ["2021", "2022", "2023", "2024", "2025", "2026"];
          const validNumbers = matches.filter(
            (num: string) => !ignoreList.includes(num),
          );

          if (validNumbers.length > 0) {
            const bestMatch = validNumbers.sort(
              (a: string, b: string) => b.length - a.length,
            )[0];

            setBodyNumber(bestMatch);
            setScanMethod("OCR");
            setIsCameraVisible(false);
          } else {
            setIsCameraVisible(false);
            Alert.alert(
              "Scan Failed",
              "Could not isolate the body number from the text. Please try again or you may enter it manually.",
            );
          }
        } else {
          setIsCameraVisible(false);
          Alert.alert(
            "Scan Failed",
            "No valid body number format detected. Please try again or you may enter it manually.",
          );
        }
      } else {
        setIsCameraVisible(false);
        Alert.alert(
          "Scan Failed",
          "No text detected. Please ensure the painted number is clear.",
        );
      }
    } catch (error) {
      setIsCameraVisible(false);
      Alert.alert("Error", "Failed to run on-device ML Kit.");
      console.error(error);
    } finally {
      setIsScanningOCR(false);
    }
  };

  // 🚀 UPDATED: Now pings Django before navigating
  const handleConfirmRoute = async () => {
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
      // 🚀 PING DJANGO: Check if the tricycle exists and is active
      const response = await api.get(`/tricycles/check/${bodyNumber}/`);
      const tricycleStatus = response.data.status;

      if (tricycleStatus === "Active") {
        // It's a verified, active driver. Start immediately!
        proceedToTrip();
      } else {
        // It exists in the DB, but is Suspended or already marked Unverified
        Alert.alert(
          "⚠️ Safety Warning",
          `This tricycle is currently marked as ${tricycleStatus.toUpperCase()} by the PTRO. Riding may be unsafe. Do you still want to proceed?`,
          [
            { text: "Cancel Ride", style: "cancel" },
            {
              text: "Proceed Anyway",
              style: "destructive",
              onPress: proceedToTrip,
            },
          ],
        );
      }
    } catch (error: any) {
      // 🚀 404 NOT FOUND: This means it's completely unregistered (Colorum)
      if (error.response?.status === 404) {
        Alert.alert(
          "⚠️ Unregistered Tricycle",
          "This tricycle body number is not registered with the city. Riding may be unsafe. Do you still want to proceed?",
          [
            { text: "Cancel Ride", style: "cancel" },
            {
              text: "Proceed Anyway",
              style: "destructive",
              onPress: proceedToTrip,
            },
          ],
        );
      } else if (!error.response) {
        Alert.alert(
          "📡 Connection Failed",
          "We cannot reach the PTRO database. Please ensure you have an active internet connection, or the LGU server may be temporarily offline.",
          [{ text: "OK", style: "default" }],
        );
      } else {
        Alert.alert(
          "Error",
          "An error occurred while communicating with the server. Please try again.",
          [{ text: "OK", style: "default" }],
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

      {/* HEADER */}
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

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { marginTop: 8, marginBottom: 16 }]}>
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
            setIsSearchModalVisible(true);
          }}
          onRemoveStopover={removeStopover}
        />

        <Text style={styles.sectionTitle}>{"Tricycle Details"}</Text>

        <View style={styles.detailsCard}>
          {bodyNumber.length > 0 && scanMethod === "OCR" ? (
            <View style={styles.successScannerBox}>
              <View style={styles.successIconWrapper}>
                <MaterialIcons name="check-circle" size={40} color="#10B981" />
              </View>
              <Text style={styles.successBoxTitle}>Body Number Detected</Text>
              <Text style={styles.successBoxSubtext}>
                OCR successfully read the tricycle ID
              </Text>
              <TouchableOpacity
                style={styles.retakeButton}
                activeOpacity={0.8}
                onPress={handleOpenScanner}
              >
                <MaterialIcons
                  name="refresh"
                  size={16}
                  color="#64748B"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.retakeButtonText}>Retake Photo</Text>
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
                {"Scan Painted Body Number"}
              </Text>
              <Text style={styles.scannerBoxSubtext}>
                {"Point camera at the number on the sidecar."}
              </Text>
            </TouchableOpacity>
          )}

          {/* FLOATING LABEL INPUTS */}
          <View
            style={[
              styles.floatingInputWrapper,
              bodyNumber.length > 0 ? styles.floatingInputSuccess : null,
            ]}
          >
            <View style={styles.floatingLabelContainer}>
              <Text style={styles.floatingLabelText}>
                {"Body Number "}
                <Text style={styles.floatingLabelSubtext}>{"(Required)"}</Text>
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
                if (scanMethod === "OCR") {
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
                <Text style={styles.floatingLabelSubtext}>{"(Optional)"}</Text>
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

      {/* PREMIUM SPLIT-LAYOUT BOTTOM BUTTON */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={[
            styles.verifyButton,
            // 🚀 Now considers isVerifying for the disabled state
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

      {/* MODALS */}
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

      <OCRScannerModal
        visible={isCameraVisible}
        isScanning={isScanningOCR}
        onClose={() => setIsCameraVisible(false)}
        onScanStart={() => setIsScanningOCR(true)}
        onScan={handleProcessOCR}
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
