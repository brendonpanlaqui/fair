import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  bodyNumber: string;
  fixedFare: number;
  onBack: () => void;
}

export const ActiveTripHeader = ({ bodyNumber, fixedFare, onBack }: Props) => {
  // --- NEW: Native SOS Handler ---
  const handleSOS = () => {
    // We use a native Alert to prevent accidental dials
    Alert.alert(
      "EMERGENCY SOS",
      "Which hotline do you need to call?",
      [
        {
          text: "Angeles City Police (122)",
          onPress: () =>
            Linking.openURL(
              Platform.OS === "android" ? "tel:122" : "telprompt:122",
            ),
        },
        {
          text: "National Emergency (911)",
          onPress: () =>
            Linking.openURL(
              Platform.OS === "android" ? "tel:911" : "telprompt:911",
            ),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ],
      { cancelable: true },
    );
  };

  return (
    <View style={styles.topOverlay}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={onBack}>
          <MaterialIcons name="arrow-back-ios" size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Body #{bodyNumber}</Text>

        {/* NEW: Attached the handleSOS function */}
        <TouchableOpacity
          style={styles.sosButton}
          activeOpacity={0.7}
          onPress={handleSOS}
        >
          <MaterialIcons name="security" size={14} color="#DC2626" />
          <Text style={styles.sosText}>SOS</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.fareCard}>
        <Text style={styles.fareLabel}>CURRENT FARE</Text>
        <View style={styles.fareValueContainer}>
          <Text style={styles.fareCurrency}>PHP</Text>
          <Text style={styles.fareValue}>{fixedFare}.00</Text>
        </View>
        <View style={styles.verifiedBadge}>
          <MaterialIcons
            name="verified"
            size={12}
            color="#10B981"
            style={{ marginRight: 4 }}
          />
          <Text style={styles.verifiedText}>Verified Rate</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 45,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  sosText: {
    color: "#DC2626",
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 4,
    letterSpacing: 0.5,
  },
  fareCard: {
    backgroundColor: "#B91C1C",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    elevation: 8,
  },
  fareLabel: {
    color: "#FECACA",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  fareValueContainer: {
    flexDirection: "row",
    alignItems: "baseline",
    marginBottom: 8,
  },
  fareCurrency: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 6,
  },
  fareValue: {
    color: "#FFFFFF",
    fontSize: 42,
    fontWeight: "900",
    letterSpacing: -1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#7F1D1D",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: { color: "#FFFFFF", fontSize: 10, fontWeight: "600" },
});
