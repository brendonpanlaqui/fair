import { MaterialIcons } from "@expo/vector-icons";
import { Stack } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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

// import auth context to verify user discounts
import { useAuth } from "@/src/hooks/AuthContext";

const ActiveTripScreen = () => {
  const tripData = useActiveTrip();
  const { isDiscountVerified, userType } = useAuth();

  // states to manage the trip lifecycle and ui overlays
  // isPlottingRoute is a local UI state for the initial map route calculation.
  const [isPlottingRoute, setIsPlottingRoute] = useState(true);
  const [askedFare, setAskedFare] = useState("");

  // the interceptor warns the user before killing the trip
  const handleBackPress = () => {
    tripData.handleCancelTrip();
    return true; // required for android backhandler to know we intercepted it
  };

  // renders the final screen where the user enters what they actually paid
  const renderArrivalScreen = () => {
    const enteredFareNum = Number(askedFare);
    const isSubmitDisabled = askedFare.length === 0;

    return (
      <KeyboardAvoidingView
        style={styles.arrivedOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.arrivedCard}>
          <Text style={styles.arrivedTitle}>{"Destination Reached!"}</Text>

          {/* displays the expected fare based on the ordinance */}
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

            {isDiscountVerified && (
              <View style={styles.discountBadge}>
                <MaterialIcons
                  name="check-circle"
                  size={14}
                  color="#10B981"
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.discountBadgeText}>
                  {userType.toUpperCase()} 20% DISCOUNT APPLIED
                </Text>
              </View>
            )}
          </View>

          {/* prompt adjusted if the user drops off early */}
          <Text style={styles.inputLabel}>
            {tripData.isEarlyDropoff
              ? `It looks like you dropped off early. Based on the LGU matrix for this actual distance, the prorated fare is ₱${tripData.fixedFare.toFixed(2)} (Original: ₱${tripData.originalFare.toFixed(2)}). How much did you actually pay the driver?`
              : "How much did you actually pay the driver?"}
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
                backgroundColor: isSubmitDisabled ? "#CBD5E1" : "#D32F2F",
              },
            ]}
            disabled={isSubmitDisabled}
            onPress={() => tripData.handleEndTrip(askedFare)}
          >
            <Text style={styles.payBtnText}>{"Submit & Generate Receipt"}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* map component handling the real-time tracking and route drawing */}
      <ActiveTripMap
        mapCenter={tripData.mapCenter}
        currentLocation={tripData.currentLocation}
        destLat={tripData.destLat}
        destLng={tripData.destLng}
        waypoints={tripData.waypoints}
        stopovers={tripData.parsedStopovers}
        onRouteReady={(coords) => {
          setIsPlottingRoute(false);
          tripData.setRouteCoordinates(coords);
        }}
        onError={(error) => {
          setIsPlottingRoute(false);
          Alert.alert(
            "Route Error",
            "Failed to calculate the route. Please cancel the trip and try again.",
          );
        }}
        onDestinationReached={() => {
          tripData.prepareArrival();
        }}
      />

      {/* loading overlay while google maps resolves the route polyline */}
      {isPlottingRoute && (
        <View style={styles.plottingOverlay}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.plottingText}>
            {"Getting your route ready..."}
          </Text>
          <Text style={styles.plottingSubtext}>
            {"Making sure it’s safe and efficient"}
          </Text>
        </View>
      )}

      {/* The UI now directly depends on the backend-driven state from the hook */}
      {!tripData.isDriverFinished && !isPlottingRoute && (
        <>
          {/* top header with tricycle body number and current fare */}
          <ActiveTripHeader
            bodyNumber={tripData.bodyNumber}
            fixedFare={tripData.fixedFare}
            onBack={handleBackPress} // wires the interceptor to the header button
          />

          {tripData.isNearDestination && (
            <View style={styles.forceEndBanner}>
              <MaterialIcons name="location-on" size={20} color="#D32F2F" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.forceEndTitle}>
                  Arrived at destination?
                </Text>
                <Text style={styles.forceEndSub}>
                  End the trip if the driver forgot.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.forceEndBtn}
                onPress={tripData.handleCommuterForceEnd}
              >
                <Text style={styles.forceEndBtnText}>END TRIP</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* bottom dashboard showing time, distance, and action buttons */}
          <ActiveTripDashboard
            estimatedMinutes={tripData.estimatedMinutes}
            lockedDistance={tripData.lockedDistance}
            onSecretTrigger={tripData.handleSecretDeviationTrigger}
          />
        </>
      )}

      {/* The arrival screen is shown only when the driver has ended the trip */}
      {tripData.isDriverFinished && renderArrivalScreen()}

      {/* warning modal if the driver deviates too far from the calculated route */}
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
  forceEndBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF2F2",
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
    zIndex: 10,
  },
  forceEndTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#991B1B",
  },
  forceEndSub: {
    fontSize: 12,
    fontWeight: "500",
    color: "#B91C1C",
    marginTop: 2,
  },
  forceEndBtn: {
    backgroundColor: "#DC2626",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  forceEndBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "900",
  },
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
  discountBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  discountBadgeText: {
    color: "#059669",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 0.5,
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
