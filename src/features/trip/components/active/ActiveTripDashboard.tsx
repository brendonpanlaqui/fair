import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  estimatedMinutes: number;
  lockedDistance: number;
  onSecretTrigger: () => void;
}

export const ActiveTripDashboard = ({
  estimatedMinutes,
  lockedDistance,
  onSecretTrigger,
}: Props) => {
  return (
    <View style={styles.bottomSheet}>
      {/* Subtle decorative notch, not an aggressive drag handle */}
      <View style={styles.notch} />

      <View style={styles.statusRow}>
        <TouchableOpacity
          style={styles.onRouteBadge}
          activeOpacity={0.9}
          onPress={onSecretTrigger}
        >
          <MaterialIcons
            name="near-me"
            size={14}
            color="#10B981"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.onRouteText}>{"ON ROUTE"}</Text>
        </TouchableOpacity>

        {/* "Live" GPS Indicator */}
        <View style={styles.gpsContainer}>
          <View style={styles.liveDot} />
          <Text style={styles.updatedText}>{"GPS Active"}</Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="schedule" size={16} color="#94A3B8" />
            <Text style={styles.metricLabel}>{"EST. ARRIVAL"}</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text style={styles.metricValue}>{`${estimatedMinutes}`}</Text>
            <Text style={styles.metricUnit}>{"min"}</Text>
          </View>
        </View>

        <View style={styles.metricCard}>
          <View style={styles.metricHeader}>
            <MaterialIcons name="moving" size={16} color="#94A3B8" />
            <Text style={styles.metricLabel}>{"DISTANCE"}</Text>
          </View>
          <View style={styles.metricValueRow}>
            <Text
              style={styles.metricValue}
            >{`${lockedDistance.toFixed(1)}`}</Text>
            <Text style={styles.metricUnit}>{"km"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.infoBox}>
        <MaterialIcons name="info-outline" size={20} color="#475569" />
        <Text style={styles.infoText}>
          Your driver will end the trip upon arrival. If they forget, you can
          safely end the ride yourself once you reach the destination.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === "ios" ? 40 : 24,
    elevation: 24,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
  },
  notch: {
    width: 40,
    height: 4,
    backgroundColor: "#F1F5F9",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  onRouteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  onRouteText: {
    color: "#059669",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  gpsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    marginRight: 6,
  },
  updatedText: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  metricsGrid: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  metricHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  metricLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "900",
    marginLeft: 6,
    letterSpacing: 1,
  },
  metricValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  metricValue: {
    color: "#0F172A",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
  },
  metricUnit: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "800",
    marginLeft: 4,
  },
  endTripButton: {
    // This style is no longer used
  },
  endTripText: {
    // This style is no longer used
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
});
