import { Stack } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useActiveTrip } from "../hooks/useActiveTrip";

import { ActiveTripDashboard } from "../components/active/ActiveTripDashboard";
import { ActiveTripHeader } from "../components/active/ActiveTripHeader";
import { ActiveTripMap } from "../components/active/ActiveTripMap";
import { DeviationModal } from "../components/active/DeviationModal";

const ActiveTripScreen = () => {
  const tripData = useActiveTrip();

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
        onRouteReady={tripData.setRouteCoordinates}
      />

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
});

export default ActiveTripScreen;
