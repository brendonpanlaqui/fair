import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Stopover } from "../../hooks/useTripSetup";

interface Props {
  mode: string;
  finalDest: { name: string } | null;
  stopovers: Stopover[];
  isCalculating: boolean;
  calculatedDistance: number | null;
  onOpenSearch: (target: "destination" | "stopover") => void;
  onRemoveStopover: (id: string) => void;
}

export const RouteTimeline = ({
  mode,
  finalDest,
  stopovers,
  isCalculating,
  calculatedDistance,
  onOpenSearch,
  onRemoveStopover,
}: Props) => {
  const destSubtext = isCalculating
    ? "Calculating..."
    : finalDest && calculatedDistance
      ? `${calculatedDistance.toFixed(1)} km Total Distance`
      : "REQUIRED FOR FARE";

  if (mode === "DIRECT") {
    return (
      <View style={styles.routeBuilderContainer}>
        <View style={styles.timelineLineDirect} />
        <View style={styles.timelineRow}>
          <View style={styles.iconContainerBlue}>
            <MaterialIcons name="my-location" size={16} color="#3B82F6" />
          </View>
          <View style={styles.timelineTextContainer}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.locationSubtext}>ORIGIN</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.timelineRow, { marginBottom: 0 }]}
          activeOpacity={0.7}
          onPress={() => onOpenSearch("destination")}
        >
          <View style={styles.iconContainerGreen}>
            <MaterialIcons name="check-circle" size={16} color="#10B981" />
          </View>
          <View style={styles.timelineTextContainer}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.locationTitle}>
                {finalDest ? finalDest.name : "Tap to set destination..."}
              </Text>
              {finalDest && (
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>POINT-TO-POINT</Text>
                </View>
              )}
            </View>
            <Text
              style={[
                styles.locationSubtext,
                !finalDest && { color: "#E53935", fontWeight: "bold" },
              ]}
            >
              {destSubtext}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.routeBuilderContainer}>
      <View style={styles.timelineLine} />
      <View style={styles.timelineRow}>
        <View style={styles.iconContainerBlue}>
          <MaterialIcons name="my-location" size={16} color="#3B82F6" />
        </View>
        <View style={styles.timelineTextContainer}>
          <Text style={styles.locationTitle}>Current Location</Text>
          <Text style={styles.locationSubtext}>ORIGIN</Text>
        </View>
      </View>

      {stopovers.map((stop) => (
        <View key={stop.id} style={styles.timelineRow}>
          <View style={styles.iconContainerRedLight}>
            <MaterialIcons name="schedule" size={16} color="#E53935" />
          </View>
          <View style={styles.timelineTextContainer}>
            <Text style={styles.locationTitle}>{stop.name}</Text>
            <Text style={styles.locationSubtext}>{stop.subtext}</Text>
          </View>
          <TouchableOpacity
            onPress={() => onRemoveStopover(stop.id)}
            style={styles.removeButton}
          >
            <MaterialIcons name="close" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      ))}

      <View style={styles.timelineRow}>
        <View style={styles.iconPlaceholder} />
        <TouchableOpacity
          style={styles.addStopoverBtn}
          activeOpacity={0.7}
          onPress={() => onOpenSearch("stopover")}
        >
          <MaterialIcons
            name="add-circle-outline"
            size={16}
            color="#475569"
            style={{ marginRight: 6 }}
          />
          <Text style={styles.addStopoverText}>Add Stopover</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.timelineRow, { marginBottom: 0 }]}
        activeOpacity={0.7}
        onPress={() => onOpenSearch("destination")}
      >
        <View style={styles.iconContainerRed}>
          <MaterialIcons name="location-on" size={16} color="#E53935" />
        </View>
        <View style={styles.timelineTextContainer}>
          <Text style={styles.locationTitle}>
            {finalDest ? finalDest.name : "Tap to set destination..."}
          </Text>
          <Text
            style={[
              styles.locationSubtext,
              !finalDest && { color: "#E53935", fontWeight: "bold" },
            ]}
          >
            {destSubtext}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  routeBuilderContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
    position: "relative",
  },
  timelineLine: {
    position: "absolute",
    left: 33,
    top: 40,
    bottom: 40,
    width: 2,
    backgroundColor: "#E2E8F0",
    zIndex: 0,
  },
  timelineLineDirect: {
    position: "absolute",
    left: 33,
    top: 40,
    height: 40,
    width: 2,
    backgroundColor: "#E2E8F0",
    zIndex: 0,
  },
  timelineRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    zIndex: 1,
  },
  iconContainerBlue: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  iconContainerRedLight: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  iconContainerRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FEF2F2",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  iconContainerGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#ECFDF5",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  iconPlaceholder: { width: 28, height: 28, marginRight: 0 },
  timelineTextContainer: { flex: 1, marginLeft: 16 },
  locationTitle: { fontSize: 15, fontWeight: "bold", color: "#0F172A" },
  locationSubtext: {
    fontSize: 11,
    color: "#94A3B8",
    marginTop: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontWeight: "600",
  },
  lockedBadge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  lockedBadgeText: {
    color: "#059669",
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  removeButton: { padding: 4 },
  addStopoverBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginLeft: 16,
  },
  addStopoverText: { fontSize: 13, color: "#475569", fontWeight: "600" },
});
