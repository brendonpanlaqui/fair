import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const TripReceiptScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extract params or use Fallbacks for testing the UI
  const totalFare = params.totalFare ? Number(params.totalFare) : 47.0;
  const baseFare = params.baseFare ? Number(params.baseFare) : 35.0;
  const succeedingFare = params.succeedingFare
    ? Number(params.succeedingFare)
    : 12.0;
  const distance = (params.distance as string) || "3.5";
  const duration = (params.duration as string) || "12 mins";
  const date = (params.date as string) || "Oct 24, 2023";
  const time = (params.time as string) || "08:45 AM";
  const discountType = (params.discountType as string) || "Student"; // "Student", "Senior", "PWD", or "Regular"
  const bodyNumber = (params.bodyNumber as string) || "0406";
  const tripId = (params.tripId as string) || "TRP-88172B";

  const handleReportDriver = () => {
    // Route to the Support Center and auto-fill the complaint form
    router.push({
      pathname: "/report",
      params: {
        tripId: tripId,
        bodyNumber: bodyNumber,
        violation: "Overcharging",
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* Dark content because we are using a white background now */}
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      {/* MINIMALIST HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={28} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Complete</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* THE RECEIPT CARD */}
        <View style={styles.receiptCard}>
          {/* Top Section: The Total */}
          <View style={styles.totalSection}>
            <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
            <View style={styles.priceRow}>
              <Text style={styles.currencySymbol}>₱</Text>
              <Text style={styles.totalAmount}>{totalFare.toFixed(2)}</Text>
            </View>

            <View style={styles.verifiedBadge}>
              <MaterialIcons
                name="verified-user"
                size={14}
                color="#059669"
                style={{ marginRight: 6 }}
              />
              <Text style={styles.verifiedBadgeText}>
                Ordinance No. 723 Verified
              </Text>
            </View>
          </View>

          {/* The "Tear" Separator */}
          <View style={styles.tearLineContainer}>
            <View style={styles.tearCutoutLeft} />
            <View style={styles.tearDashLine} />
            <View style={styles.tearCutoutRight} />
          </View>

          {/* Bottom Section: Breakdown & Details */}
          <View style={styles.detailsSection}>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>BASE FARE</Text>
                <Text style={styles.breakdownValue}>
                  ₱{baseFare.toFixed(2)}
                </Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>SUCCEEDING KM</Text>
                <Text style={styles.breakdownValue}>
                  ₱{succeedingFare.toFixed(2)}
                </Text>
              </View>
            </View>

            {/* Discount Alert */}
            {discountType !== "Regular" && (
              <View style={styles.discountAlert}>
                <MaterialIcons name="check-circle" size={18} color="#10B981" />
                <Text style={styles.discountAlertText}>
                  20% {discountType} Discount Applied
                </Text>
              </View>
            )}

            <View style={styles.metaDataList}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Trip ID</Text>
                <Text style={styles.metaValue}>{tripId}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Body Number</Text>
                <Text style={styles.metaValueHighlight}>#{bodyNumber}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Distance</Text>
                <Text style={styles.metaValue}>{distance} km</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Date & Time</Text>
                <Text style={styles.metaValue}>
                  {date} • {time}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* ACTIONS FOOTER */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryBtn}
          activeOpacity={0.9}
          onPress={() => router.replace("/(tabs)")}
        >
          <Text style={styles.primaryBtnText}>Done</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reportBtn}
          activeOpacity={0.8}
          onPress={handleReportDriver}
        >
          <MaterialIcons
            name="gavel"
            size={18}
            color="#D32F2F"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.reportBtnText}>Dispute this Fare</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },

  // MINIMAL HEADER
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 24,
    backgroundColor: "#F8FAFC",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },

  scrollContent: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 10 },

  // RECEIPT CARD
  receiptCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    overflow: "hidden", // Important for the cutouts
  },

  // TOP SECTION
  totalSection: {
    padding: 32,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginBottom: 16,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "900",
    color: "#D32F2F",
    marginTop: 6,
    marginRight: 4,
  },
  totalAmount: {
    fontSize: 56,
    fontWeight: "900",
    color: "#D32F2F",
    letterSpacing: -2,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  verifiedBadgeText: { color: "#059669", fontSize: 12, fontWeight: "bold" },

  // THE TEAR SEPARATOR (Ticket aesthetic)
  tearLineContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    height: 24,
    backgroundColor: "#FFFFFF",
    position: "relative",
  },
  tearCutoutLeft: {
    position: "absolute",
    left: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC", // Matches screen background
  },
  tearCutoutRight: {
    position: "absolute",
    right: -12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#F8FAFC", // Matches screen background
  },
  tearDashLine: {
    flex: 1,
    height: 1,
    marginHorizontal: 16,
    borderColor: "#E2E8F0",
    borderWidth: 1,
    borderStyle: "dashed",
  },

  // BOTTOM SECTION
  detailsSection: {
    padding: 24,
    paddingTop: 16,
    backgroundColor: "#FFFFFF",
  },
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  breakdownItem: {
    flex: 1,
    alignItems: "center",
  },
  verticalDivider: {
    width: 1,
    height: 30,
    backgroundColor: "#E2E8F0",
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
  },

  discountAlert: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ECFDF5",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A7F3D0",
  },
  discountAlertText: {
    marginLeft: 8,
    color: "#059669",
    fontSize: 13,
    fontWeight: "bold",
  },

  metaDataList: {
    gap: 16,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaLabel: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "600",
  },
  metaValue: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0F172A",
  },
  metaValueHighlight: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },

  // FOOTER ACTIONS
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#F8FAFC",
  },
  primaryBtn: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    elevation: 4,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  reportBtn: {
    flexDirection: "row",
    backgroundColor: "#FFF1F2",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFE4E6",
  },
  reportBtnText: {
    color: "#D32F2F",
    fontSize: 15,
    fontWeight: "bold",
  },
});

export default TripReceiptScreen;
