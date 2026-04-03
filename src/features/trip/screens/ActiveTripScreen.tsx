import { Stack } from "expo-router";
import React, { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { ActiveTripDashboard } from "../components/active/ActiveTripDashboard";
import { ActiveTripHeader } from "../components/active/ActiveTripHeader";
import { ActiveTripMap } from "../components/active/ActiveTripMap";
import { DeviationModal } from "../components/active/DeviationModal";
import { useActiveTrip } from "../hooks/useActiveTrip";

const ActiveTripScreen = () => {
  const tripData = useActiveTrip();

  // 🚀 1. The Local Loading State
  const [isPlottingRoute, setIsPlottingRoute] = useState(true);

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
          // 🚀 2. Turn off the loading screen, then pass data to your hook
          setIsPlottingRoute(false);
          tripData.setRouteCoordinates(coords);
        }}
      />

      {/* 🚀 3. The Loading Overlay */}
      {isPlottingRoute && (
        <View style={styles.plottingOverlay}>
          <ActivityIndicator size="large" color="#D32F2F" />
          <Text style={styles.plottingText}>Plotting Secure Route...</Text>
          <Text style={styles.plottingSubtext}>Connecting to LGU Matrix</Text>
        </View>
      )}

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

  // 🚀 4. Overlay Styles
  plottingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.85)", // Semi-transparent white
    justifyContent: "center",
    alignItems: "center",
    zIndex: 50, // High enough to cover the map, but under the Header/Dashboard if you want
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
});

export default ActiveTripScreen;
