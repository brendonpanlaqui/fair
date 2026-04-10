import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { ActiveTripDashboard } from "../components/active/ActiveTripDashboard";
import { ActiveTripHeader } from "../components/active/ActiveTripHeader";
import { ActiveTripMap } from "../components/active/ActiveTripMap";
import { DeviationModal } from "../components/active/DeviationModal";
import { useActiveTrip } from "../hooks/useActiveTrip";

const ActiveTripScreen = () => {
  const tripData = useActiveTrip();

  // 🚀 1. State Management
  const [isPlottingRoute, setIsPlottingRoute] = useState(true);
  const [tripState, setTripState] = useState<"LOADING" | "DRIVING" | "ARRIVED">(
    "LOADING",
  );
  const [askedFare, setAskedFare] = useState("");

  // 🚀 2. Safely Rendered Arrival UI (100% crash-proof strings)
  const renderArrivalScreen = () => {
    if (tripState !== "ARRIVED") return null;
    return (
      <View style={styles.arrivedOverlay}>
        <View style={styles.arrivedCard}>
          <Text style={styles.arrivedTitle}>{"Destination Reached!"}</Text>

          <View style={styles.officialFareBox}>
            <Text style={styles.arrivedSubtext}>
              {"Official Computed Fare"}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.fareText}>{"₱"}</Text>
              <Text
                style={styles.fareText}
              >{`${tripData.fixedFare.toFixed(2)}`}</Text>
            </View>
          </View>

          <Text style={styles.inputLabel}>
            {"How much did the driver ask for?"}
          </Text>

          <View style={styles.inputContainer}>
            <Text style={styles.currencySymbol}>{"₱"}</Text>
            <TextInput
              style={styles.fareInput}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor="#94A3B8"
              value={String(askedFare)}
              onChangeText={setAskedFare}
              maxLength={4}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.payBtn,
              {
                backgroundColor: askedFare.length === 0 ? "#CBD5E1" : "#D32F2F",
              },
            ]}
            disabled={askedFare.length === 0}
            onPress={() => tripData.handleEndTrip(askedFare)}
          >
            <Text style={styles.payBtnText}>{"Submit & Generate Receipt"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <ActiveTripMap
        mapCenter={tripData.mapCenter}
        currentLocation={tripData.currentLocation}
        destLat={tripData.destLat}
        destLng={tripData.destLng}
        waypoints={tripData.waypoints}
        stopovers={tripData.parsedStopovers}
        onRouteReady={(coords) => {
          setIsPlottingRoute(false);
          setTripState("DRIVING");
          tripData.setRouteCoordinates(coords);
        }}
        // Trigger the arrival screen when the map hook detects proximity
        onDestinationReached={() => setTripState("ARRIVED")}
      />

      {/* 🚀 3. The Loading Overlay */}
      {isPlottingRoute && (
        <View style={styles.plottingOverlay}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.plottingText}>{"Plotting Secure Route..."}</Text>
          <Text style={styles.plottingSubtext}>
            {"Connecting to LGU Matrix"}
          </Text>
        </View>
      )}

      {/* 🚀 4. Hide Header/Dashboard when Arrived so the Modal is clean */}
      {tripState !== "ARRIVED" && (
        <>
          <ActiveTripHeader
            bodyNumber={tripData.bodyNumber}
            fixedFare={tripData.fixedFare}
            onBack={() => tripData.router.back()}
          />
          <ActiveTripDashboard
            estimatedMinutes={tripData.estimatedMinutes}
            lockedDistance={tripData.lockedDistance}
            onSecretTrigger={tripData.handleSecretDeviationTrigger}
            onEndTrip={tripData.handleEndTrip}
          />
        </>
      )}

      {/* 🚀 5. Render Arrival Screen */}
      {renderArrivalScreen()}

      <DeviationModal
        visible={tripData.isDeviationWarningVisible}
        onClose={() => tripData.setIsDeviationWarningVisible(false)}
        onReport={tripData.handleReportDeviation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // --- Plotting Overlay Styles ---
  plottingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50,
  },
  plottingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  plottingSubtext: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#64748B",
  },

  // --- Arrived Overlay Styles ---
  arrivedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
    zIndex: 60,
  },
  arrivedCard: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 24,
  },
  arrivedTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 20,
  },
  officialFareBox: {
    backgroundColor: "#F8FAFC",
    width: "100%",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  arrivedSubtext: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 4,
  },
  fareText: {
    fontSize: 40,
    fontWeight: "900",
    color: "#0F172A",
  },
  inputLabel: {
    alignSelf: "flex-start",
    fontSize: 15,
    fontWeight: "700",
    color: "#334155",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    width: "100%",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "800",
    color: "#94A3B8",
    marginRight: 8,
  },
  fareInput: {
    flex: 1,
    height: 64,
    fontSize: 32,
    fontWeight: "900",
    color: "#D32F2F",
  },
  payBtn: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  payBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },
});

export default ActiveTripScreen;
