import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";
import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { MaterialIcons } from "@expo/vector-icons";
import { useCameraPermissions } from "expo-camera";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

import { useTripSetup } from "../hooks/useTripSetup";

// ✨ SETUP FOLDER IMPORTS
import { MapPickerModal } from "../components/setup/MapPickerModal"; // <-- ADDED THIS
import { OCRScannerModal } from "../components/setup/OCRScannerModal";
import { RouteTimeline } from "../components/setup/RouteTimeline";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const StartTripScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  const passedMode = (params.mode as string) || "SPECIAL";
  const passedDistance = params.distance ? Number(params.distance) : null;
  const passedFare = params.fare ? Number(params.fare) : null;
  const destLat = params.destLat ? Number(params.destLat) : null;
  const destLng = params.destLng ? Number(params.destLng) : null;

  const { currentLocation } = useLocationTracking();
  const originLat = currentLocation?.latitude || 15.149;
  const originLng = currentLocation?.longitude || 120.5779;

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
    originLat,
    originLng,
    passedMode,
    passedDistance,
    passedFare,
    destLat,
    destLng,
  );

  // --- MODAL STATES ---
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);
  const [searchTarget, setSearchTarget] = useState<"stopover" | "destination">(
    "destination",
  );
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false); // <-- ADDED THIS

  // --- FORM STATES ---
  const [bodyNumber, setBodyNumber] = useState<string>("");
  const [plateNumber, setPlateNumber] = useState<string>("");

  // --- CAMERA STATES ---
  const [permission, requestPermission] = useCameraPermissions();
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isScanningOCR, setIsScanningOCR] = useState(false);

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

  const simulateOCRScan = () => {
    setIsScanningOCR(true);
    setTimeout(() => {
      setBodyNumber("0406");
      setIsScanningOCR(false);
      setIsCameraVisible(false);
      Alert.alert("Scan Successful", "Body Number 0406 detected and verified.");
    }, 1500);
  };

  const handleConfirmRoute = () => {
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
      },
    });
  };

  const renderSubmitButton = () => {
    if (isCalculating)
      return (
        <View style={[styles.submitButton, { backgroundColor: "#94A3B8" }]}>
          <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitButtonText}>CALCULATING ROUTE...</Text>
        </View>
      );
    if (!finalDest || !calculatedFare)
      return (
        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: "#94A3B8" }]}
          activeOpacity={0.9}
          onPress={() => {
            setSearchTarget("destination");
            setIsSearchModalVisible(true);
          }}
        >
          <MaterialIcons
            name="search"
            size={24}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.submitButtonText}>SELECT DESTINATION FIRST</Text>
        </TouchableOpacity>
      );
    if (!bodyNumber)
      return (
        <View style={[styles.submitButton, { backgroundColor: "#94A3B8" }]}>
          <MaterialIcons
            name="error-outline"
            size={24}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.submitButtonText}>BODY NUMBER REQUIRED</Text>
        </View>
      );

    return (
      <TouchableOpacity
        style={styles.submitButton}
        activeOpacity={0.9}
        onPress={handleConfirmRoute}
      >
        <MaterialIcons
          name={passedMode === "DIRECT" ? "verified" : "alt-route"}
          size={24}
          color="#FFFFFF"
          style={{ marginRight: 8 }}
        />
        <Text style={styles.submitButtonText}>
          CONFIRM {passedMode} (₱{calculatedFare}.00)
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Setup</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>TRIP ROUTE</Text>
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

        <Text style={styles.sectionLabel}>TRICYCLE VERIFICATION</Text>
        <View style={styles.verificationContainer}>
          <TouchableOpacity
            style={styles.cameraBox}
            activeOpacity={0.8}
            onPress={handleOpenScanner}
          >
            <View style={styles.cameraIconWrapper}>
              <MaterialIcons
                name="document-scanner"
                size={32}
                color="#E53935"
              />
            </View>
            <Text style={styles.cameraText}>Scan Painted Body Number</Text>
            <Text style={styles.cameraSubtext}>
              Point camera at the number on the sidecar
            </Text>
          </TouchableOpacity>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>BODY NUMBER (REQUIRED)</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: bodyNumber ? "#10B981" : "#E53935",
                  borderWidth: 1,
                },
              ]}
              placeholder="e.g. 0406"
              keyboardType="number-pad"
              value={bodyNumber}
              onChangeText={setBodyNumber}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>PLATE NUMBER (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC 1234"
              autoCapitalize="characters"
              value={plateNumber}
              onChangeText={setPlateNumber}
            />
          </View>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={styles.bottomFooter}>{renderSubmitButton()}</View>

      {/* 📍 NEW MAP PICKER MODAL */}
      <MapPickerModal
        visible={isMapPickerVisible}
        target={searchTarget}
        initialLat={originLat}
        initialLng={originLng}
        onClose={() => setIsMapPickerVisible(false)}
        onConfirm={(lat: number, lng: number, addressName: string) => {
          // <-- Explicit types fixed your TS errors!
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

      {/* EXISTING CAMERA MODAL */}
      <OCRScannerModal
        visible={isCameraVisible}
        isScanning={isScanningOCR}
        onClose={() => setIsCameraVisible(false)}
        onScan={simulateOCRScan}
      />

      {/* EXISTING GOOGLE PLACES MODAL */}
      <Modal
        visible={isSearchModalVisible}
        animationType="slide"
        onRequestClose={() => setIsSearchModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => setIsSearchModalVisible(false)}
              style={styles.modalCloseButton}
            >
              <MaterialIcons name="close" size={28} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {searchTarget === "stopover"
                ? "Search Stopover"
                : "Search Destination"}
            </Text>
            <View style={{ width: 28 }} />
          </View>
          <View style={styles.modalSearchArea}>
            {/* ✨ NEW CHOOSE ON MAP BUTTON */}
            <TouchableOpacity
              style={styles.chooseOnMapBtn}
              activeOpacity={0.8}
              onPress={() => {
                setIsSearchModalVisible(false);
                setTimeout(() => setIsMapPickerVisible(true), 300);
              }}
            >
              <MaterialIcons
                name="map"
                size={24}
                color="#3B82F6"
                style={{ marginRight: 12 }}
              />
              <View>
                <Text style={styles.chooseOnMapTitle}>Choose on Map</Text>
                <Text style={styles.chooseOnMapSubtext}>
                  Pinpoint your exact location
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color="#CBD5E1"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>

            <GooglePlacesAutocomplete
              placeholder={
                searchTarget === "stopover"
                  ? "Where do you want to stop?"
                  : "Where are you heading?"
              }
              fetchDetails={true}
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
                }
              }}
              query={{
                key: GOOGLE_API_KEY,
                language: "en",
                components: "country:ph",
                location: "15.1444,120.5928",
                radius: "8000",
                strictbounds: true,
              }}
              styles={{
                container: { flex: 1 },
                textInputContainer: {
                  backgroundColor: "#F1F5F9",
                  borderRadius: 12,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginBottom: 12,
                },
                textInput: {
                  height: 48,
                  color: "#0F172A",
                  fontSize: 16,
                  backgroundColor: "transparent",
                },
                predefinedPlacesDescription: { color: "#1faadb" },
                row: {
                  padding: 16,
                  borderBottomWidth: 1,
                  borderBottomColor: "#E2E8F0",
                },
                description: { fontSize: 15, color: "#334155" },
              }}
              textInputProps={{ autoFocus: true }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  // Keeping your existing styles
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#E53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 16,
  },
  backButton: { padding: 4 },
  headerTitle: { color: "#FFFFFF", fontSize: 18, fontWeight: "bold" },
  content: { flex: 1, padding: 20 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#475569",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  verificationContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cameraBox: {
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FCA5A5",
    borderStyle: "dashed",
    marginBottom: 24,
  },
  cameraIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 2,
  },
  cameraText: { color: "#D32F2F", fontSize: 14, fontWeight: "bold" },
  cameraSubtext: {
    color: "#EF4444",
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formGroup: { marginBottom: 16 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94A3B8",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: "#0F172A",
  },
  bottomFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 10,
  },
  submitButton: {
    backgroundColor: "#E53935",
    flexDirection: "row",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Modal Styles
  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 45,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  modalCloseButton: { padding: 4 },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  modalSearchArea: { flex: 1, padding: 16 },

  // ✨ NEW: Choose on Map Button Styles
  chooseOnMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BFDBFE",
  },
  chooseOnMapTitle: { fontSize: 15, fontWeight: "bold", color: "#1E3A8A" },
  chooseOnMapSubtext: { fontSize: 12, color: "#3B82F6", marginTop: 2 },
});

export default StartTripScreen;
