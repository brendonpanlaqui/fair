import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
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

import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";
import { useAuth } from "@/src/hooks/AuthContext";
import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { useCameraPermissions } from "expo-camera";
import { useTripSetup } from "../hooks/useTripSetup";

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

  const passedMode = (params.mode as string) || "SPECIAL";
  const passedDistance = params.distance ? Number(params.distance) : null;
  const passedFare = params.fare ? Number(params.fare) : null;
  const destLat = params.destLat ? Number(params.destLat) : null;
  const destLng = params.destLng ? Number(params.destLng) : null;
  const destName = (params.destName as string) || null;

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
    destName,
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
        destName: finalDest?.name || "Unknown Destination",
        originName: "Current Location",
        matrixId: 1,
      },
    });
  };

  const renderSubmitButton = () => {
    if (isCalculating) {
      return (
        <View style={[styles.submitButton, { backgroundColor: "#94A3B8" }]}>
          <ActivityIndicator color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.submitButtonText}>CALCULATING ROUTE...</Text>
        </View>
      );
    }
    if (!finalDest || !calculatedFare) {
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
    }
    if (!bodyNumber) {
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
    }

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
        <View style={{ flexDirection: "column", alignItems: "center" }}>
          <Text style={styles.submitButtonText}>
            CONFIRM {passedMode} (₱{calculatedFare}.00)
          </Text>
          {isDiscountVerified && (
            <Text
              style={{
                color: "#FECACA",
                fontSize: 10,
                fontWeight: "bold",
                marginTop: -2,
              }}
            >
              {userType.toUpperCase()} 20% DISCOUNT APPLIED
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Setup</Text>
        <View style={{ width: 24 }} />
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
                size={28}
                color="#D32F2F"
              />
            </View>
            <Text style={styles.cameraText}>Scan Painted Body Number</Text>
            <Text style={styles.cameraSubtext}>
              Point camera at the number on the sidecar
            </Text>
          </TouchableOpacity>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>BODY NUMBER (REQUIRED)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[
                  styles.input,
                  bodyNumber.length > 0 ? styles.inputSuccess : null,
                ]}
                placeholder="e.g. 0406"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                value={bodyNumber}
                onChangeText={setBodyNumber}
              />
              {bodyNumber.length > 0 ? (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color="#10B981"
                  style={styles.inputIconRight}
                />
              ) : null}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>PLATE NUMBER (OPTIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. ABC 1234"
              placeholderTextColor="#94A3B8"
              autoCapitalize="characters"
              value={plateNumber}
              onChangeText={setPlateNumber}
            />
          </View>
        </View>
        <View style={{ height: 140 }} />
      </ScrollView>

      <View style={styles.bottomFooter}>{renderSubmitButton()}</View>

      <MapPickerModal
        visible={isMapPickerVisible}
        target={searchTarget}
        initialLat={currentLocation?.latitude || originLat}
        initialLng={currentLocation?.longitude || originLng}
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
        onScan={simulateOCRScan}
      />

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
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {searchTarget === "stopover"
                ? "Search Stopover"
                : "Search Destination"}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <View style={styles.modalSearchArea}>
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
              GooglePlacesDetailsQuery={{
                fields: "geometry,name",
              }}
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
              renderRow={(rowData) => {
                const title = rowData.structured_formatting.main_text;
                const subtitle = rowData.structured_formatting.secondary_text;
                return (
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
                        {title}
                      </Text>
                      <Text style={styles.rowSubtitle} numberOfLines={1}>
                        {subtitle || "Angeles City, Pampanga"}
                      </Text>
                    </View>
                  </View>
                );
              }}
              // @ts-ignore
              ListHeaderComponent={() => (
                <TouchableOpacity
                  style={styles.chooseOnMapBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    setIsSearchModalVisible(false);
                    setTimeout(() => setIsMapPickerVisible(true), 300);
                  }}
                >
                  <View style={styles.chooseOnMapIconBg}>
                    <MaterialIcons name="place" size={20} color="#D32F2F" />
                  </View>
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
              )}
              styles={{
                container: { flex: 1 },
                textInputContainer: {
                  backgroundColor: "#F8FAFC",
                  borderRadius: 16,
                  paddingHorizontal: 12,
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  flexDirection: "row",
                  alignItems: "center",
                },
                textInput: {
                  height: 52,
                  color: "#0F172A",
                  fontSize: 16,
                  backgroundColor: "transparent",
                  margin: 0,
                  padding: 0,
                },
                row: { padding: 0 },
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
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: { padding: 4, marginLeft: -4 },
  headerTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  content: { flex: 1, padding: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 12,
    marginLeft: 4,
    marginTop: 8,
  },
  verificationContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F8FAFC",
  },
  cameraBox: {
    backgroundColor: "#FFF1F2",
    borderRadius: 16,
    paddingVertical: 24,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FECACA",
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
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cameraText: { color: "#D32F2F", fontSize: 15, fontWeight: "900" },
  cameraSubtext: {
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  formGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 8,
    letterSpacing: 1,
  },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
  },
  inputSuccess: { borderColor: "#10B981", backgroundColor: "#FFFFFF" },
  inputIconRight: { position: "absolute", right: 16 },
  bottomFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingTop: 16,
    paddingHorizontal: 20,
    paddingBottom: 36,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    elevation: 16,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  submitButton: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    borderRadius: 16,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  modalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalCloseButton: { padding: 4, marginLeft: -4 },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  modalSearchArea: { flex: 1, padding: 20 },
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
  chooseOnMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 8,
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
    color: "#D32F2F",
    marginBottom: 2,
  },
  chooseOnMapSubtext: { fontSize: 13, color: "#64748B", fontWeight: "500" },
});

export default StartTripScreen;
