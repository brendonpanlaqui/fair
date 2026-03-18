import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  estimatedMinutes: number;
  lockedDistance: number;
  onSecretTrigger: () => void;
  onEndTrip: () => void;
}

export const ActiveTripDashboard = ({
  estimatedMinutes,
  lockedDistance,
  onSecretTrigger,
  onEndTrip,
}: Props) => (
  <View style={styles.bottomSheet}>
    <View style={styles.dragHandle} />

    <View style={styles.statusRow}>
      <TouchableOpacity
        style={styles.onRouteBadge}
        activeOpacity={1}
        onPress={onSecretTrigger}
      >
        <MaterialIcons
          name="check-circle"
          size={14}
          color="#16A34A"
          style={{ marginRight: 4 }}
        />
        <Text style={styles.onRouteText}>ON ROUTE</Text>
      </TouchableOpacity>
      <Text style={styles.updatedText}>Updated just now</Text>
    </View>

    <View style={styles.metricsGrid}>
      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <MaterialIcons name="schedule" size={16} color="#64748B" />
          <Text style={styles.metricLabel}>EST. ARRIVAL</Text>
        </View>
        <View style={styles.metricValueRow}>
          <Text style={styles.metricValue}>{estimatedMinutes}</Text>
          <Text style={styles.metricUnit}>min</Text>
        </View>
      </View>

      <View style={styles.metricCard}>
        <View style={styles.metricHeader}>
          <MaterialIcons name="place" size={16} color="#64748B" />
          <Text style={styles.metricLabel}>DISTANCE</Text>
        </View>
        <View style={styles.metricValueRow}>
          <Text style={styles.metricValue}>{lockedDistance.toFixed(1)}</Text>
          <Text style={styles.metricUnit}>km</Text>
        </View>
      </View>
    </View>

    <TouchableOpacity
      style={styles.slideButtonContainer}
      activeOpacity={0.9}
      onPress={onEndTrip}
    >
      <View style={styles.slideButtonTrack}>
        <View style={styles.slideButtonThumb}>
          <MaterialIcons name="stop" size={24} color="#DC2626" />
        </View>
        <Text style={styles.slideButtonText}>Slide to End Trip</Text>
        <MaterialIcons
          name="keyboard-arrow-right"
          size={24}
          color="#FFFFFF"
          style={{ opacity: 0.5, marginRight: 16 }}
        />
      </View>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 16,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  onRouteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  onRouteText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  updatedText: { color: "#94A3B8", fontSize: 12 },
  metricsGrid: { flexDirection: "row", gap: 12, marginBottom: 24 },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
  },
  metricHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  metricLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "bold",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  metricValueRow: { flexDirection: "row", alignItems: "baseline" },
  metricValue: { color: "#0F172A", fontSize: 24, fontWeight: "900" },
  metricUnit: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  slideButtonContainer: {
    height: 60,
    borderRadius: 30,
    backgroundColor: "#DC2626",
    overflow: "hidden",
    elevation: 4,
  },
  slideButtonTrack: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 4,
  },
  slideButtonThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  slideButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 16,
  },
});
