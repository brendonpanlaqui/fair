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
  // renders the dots and text for the left side of the card
  const renderRouteNodes = () => {
    return (
      <View style={styles.nodesContainer}>
        {/* ORIGIN */}
        <View style={styles.nodeRow}>
          <View style={styles.iconCol}>
            <View style={styles.originDot} />
            <View style={styles.dottedLine} />
          </View>
          <View style={styles.textCol}>
            <Text style={styles.nodeTextPrimary}>
              {"Current Location (Origin)"}
            </Text>
            <Text style={styles.nodeTextSecondary}>{"to"}</Text>
          </View>
        </View>

        {/* STOPOVERS (For Special Mode) */}
        {mode === "SPECIAL" &&
          stopovers.map((stop) => (
            <View key={stop.id} style={styles.nodeRow}>
              <View style={styles.iconCol}>
                <View style={styles.stopoverDot} />
                <View style={styles.dottedLine} />
              </View>
              <View
                style={[
                  styles.textCol,
                  { flexDirection: "row", alignItems: "center" },
                ]}
              >
                <Text
                  style={[styles.nodeTextPrimary, { flex: 1 }]}
                  numberOfLines={1}
                >
                  {stop.name}
                </Text>
                <TouchableOpacity
                  onPress={() => onRemoveStopover(stop.id)}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons name="close" size={16} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>
          ))}

        {/* ADD STOPOVER BUTTON (For Special Mode) */}
        {mode === "SPECIAL" && (
          <View style={styles.nodeRow}>
            <View style={styles.iconCol}>
              <View style={styles.addStopoverDot} />
              <View style={styles.dottedLine} />
            </View>
            <TouchableOpacity
              style={styles.textCol}
              onPress={() => onOpenSearch("stopover")}
            >
              <Text style={styles.addStopoverText}>{"Add Stopover"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* DESTINATION */}
        <TouchableOpacity
          style={styles.nodeRow}
          activeOpacity={0.7}
          onPress={() => onOpenSearch("destination")}
        >
          <View style={styles.iconCol}>
            <MaterialIcons
              name="location-on"
              size={18}
              color="#D32F2F"
              style={{ marginTop: -2 }}
            />
          </View>
          <View style={styles.textCol}>
            <Text
              style={[
                styles.nodeTextPrimary,
                !finalDest && { color: "#94A3B8" },
              ]}
              numberOfLines={1}
            >
              {finalDest ? finalDest.name : "Tap to set destination"}
            </Text>
            {finalDest && (
              <Text style={styles.nodeTextSecondary}>
                {mode === "DIRECT" ? "(POINT-TO-POINT)" : "(FINAL DESTINATION)"}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* LEFT SIDE: Timeline */}
        <View style={styles.leftSection}>{renderRouteNodes()}</View>

        {/* VERTICAL DIVIDER */}
        <View style={styles.verticalDivider} />

        {/* RIGHT SIDE: Distance */}
        <View style={styles.rightSection}>
          {isCalculating ? (
            <Text style={styles.distanceValue}>{"..."}</Text>
          ) : (
            <Text style={styles.distanceValue}>
              {calculatedDistance
                ? `${calculatedDistance.toFixed(1)} KM`
                : "--"}
            </Text>
          )}
          <Text style={styles.distanceLabel}>{"TOTAL\nDISTANCE"}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "stretch",
  },
  leftSection: {
    flex: 1,
    paddingRight: 12,
    justifyContent: "center",
  },
  rightSection: {
    width: 80,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 12,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 4,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    textAlign: "center",
  },
  distanceLabel: {
    fontSize: 9,
    color: "#94A3B8",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 4,
    letterSpacing: 0.5,
  },

  nodesContainer: {
    flexDirection: "column",
  },
  nodeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconCol: {
    width: 24,
    alignItems: "center",
    marginRight: 8,
  },
  textCol: {
    flex: 1,
    paddingBottom: 16,
    justifyContent: "center",
  },

  originDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 3,
    borderColor: "#0891B2",
    marginTop: 4,
  },
  stopoverDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#F59E0B",
    marginTop: 4,
  },
  addStopoverDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#CBD5E1",
    marginTop: 4,
  },
  dottedLine: {
    width: 1,
    flex: 1,
    borderStyle: "dotted",
    borderWidth: 1,
    borderRadius: 1,
    borderColor: "#CBD5E1",
    marginTop: 4,
    marginBottom: 4,
  },

  nodeTextPrimary: {
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "500",
  },
  nodeTextSecondary: {
    fontSize: 11,
    color: "#64748B",
    marginTop: 2,
    textTransform: "uppercase",
  },
  addStopoverText: {
    fontSize: 14,
    color: "#64748B",
    fontWeight: "600",
    fontStyle: "italic",
  },
});
