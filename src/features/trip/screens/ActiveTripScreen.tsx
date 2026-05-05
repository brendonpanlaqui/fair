import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
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

// 🚀 IMPORT AUTH CONTEXT
import { useAuth } from "@/src/hooks/AuthContext";

const ActiveTripScreen = () => {
  const router = useRouter();
  const tripData = useActiveTrip();
  const { isDiscountVerified, userType } = useAuth();

  const [isPlottingRoute, setIsPlottingRoute] = useState(true);
  const [tripState, setTripState] = useState<"LOADING" | "DRIVING" | "ARRIVED">(
    "LOADING",
  );
  const [askedFare, setAskedFare] = useState("");
  const [paymentReason, setPaymentReason] = useState<
    "TIP" | "OVERCHARGE" | null
  >(null);

  // 🚀 THE INTERCEPTOR: Protects the user from accidentally killing the trip
  const handleBackPress = () => {
    tripData.handleCancelTrip();
    return true; // Required for Android BackHandler to know we intercepted it
  };

  // 🚀 NATIVE ANDROID SWIPE PROTECTION
  useEffect(() => {
    const onHardwareBackPress = () => {
      if (tripState === "DRIVING" || tripState === "LOADING") {
        handleBackPress();
        return true; // Block native back
      }
      return false; // Let them go back normally if they've already arrived
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      onHardwareBackPress,
    );
    return () => subscription.remove();
  }, [tripState]);

  const renderArrivalScreen = () => {
    if (tripState !== "ARRIVED") return null;

    const enteredFareNum = Number(askedFare);
    const isPayingMore =
      !isNaN(enteredFareNum) && enteredFareNum > tripData.fixedFare;
    const isSubmitDisabled =
      askedFare.length === 0 || (isPayingMore && !paymentReason);

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

          {/* 🚀 TIP VS OVERCHARGE DETECTOR */}
          {isPayingMore && (
            <View style={styles.extraPaymentContainer}>
              <Text style={styles.extraPaymentText}>
                You are paying ₱
                {(enteredFareNum - tripData.fixedFare).toFixed(2)} more than the
                official fare. Why?
              </Text>
              <View style={styles.radioRow}>
                <TouchableOpacity
                  onPress={() => setPaymentReason("TIP")}
                  style={[
                    styles.radioBtn,
                    paymentReason === "TIP" && styles.radioBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioText,
                      paymentReason === "TIP" && styles.radioTextActive,
                    ]}
                  >
                    Voluntary Tip
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setPaymentReason("OVERCHARGE")}
                  style={[
                    styles.radioBtn,
                    paymentReason === "OVERCHARGE" && styles.radioBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.radioText,
                      paymentReason === "OVERCHARGE" && styles.radioTextActive,
                    ]}
                  >
                    Overcharge
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[
              styles.payBtn,
              {
                backgroundColor: isSubmitDisabled ? "#CBD5E1" : "#D32F2F",
              },
            ]}
            disabled={isSubmitDisabled}
            onPress={() =>
              tripData.handleEndTrip(askedFare, paymentReason === "TIP")
            }
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
        onError={(error) => {
          setIsPlottingRoute(false);
          Alert.alert(
            "Route Error",
            "Failed to calculate the route. Please cancel the trip and try again.",
          );
        }}
        onDestinationReached={() => {
          tripData.prepareArrival();
          setTripState("ARRIVED");
        }}
      />

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

      {tripState !== "ARRIVED" && (
        <>
          <ActiveTripHeader
            bodyNumber={tripData.bodyNumber}
            fixedFare={tripData.fixedFare}
            onBack={handleBackPress} // 🚀 Wires the interceptor to the header button
          />
          <ActiveTripDashboard
            estimatedMinutes={tripData.estimatedMinutes}
            lockedDistance={tripData.lockedDistance}
            onSecretTrigger={tripData.handleSecretDeviationTrigger}
            onEndTrip={() => {
              tripData.prepareArrival();
              setTripState("ARRIVED");
            }}
          />
        </>
      )}

      {renderArrivalScreen()}

      <DeviationModal
        visible={tripData.isDeviationWarningVisible}
        onClose={() => tripData.setIsDeviationWarningVisible(false)}
        onReport={tripData.handleReportDeviation}
      />
    </View>
  );
};

// ... (KEEP ALL YOUR EXISTING STYLES)

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
  extraPaymentContainer: {
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  extraPaymentText: {
    fontSize: 13,
    color: "#334155",
    fontWeight: "600",
    marginBottom: 12,
  },
  radioRow: {
    flexDirection: "row",
    gap: 12,
  },
  radioBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  radioBtnActive: {
    borderColor: "#D32F2F",
    backgroundColor: "#FEF2F2",
    borderWidth: 2,
  },
  radioText: { fontSize: 13, fontWeight: "bold", color: "#475569" },
  radioTextActive: { color: "#D32F2F" },
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
