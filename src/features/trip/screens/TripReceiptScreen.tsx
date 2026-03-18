import { MaterialIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
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

  const handleReportDriver = () => {
    // Route to the Support Center and auto-fill the complaint form
    router.push({
      pathname: "/report",
      params: {
        tripId: "TRP-RECEIPT",
        bodyNumber: bodyNumber,
        violation: "Overcharging",
      },
    });
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(tabs)")}
          style={styles.backButton}
        >
          <MaterialIcons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trip Receipt</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.totalSection}>
          <Text style={styles.totalLabel}>TOTAL PAYABLE</Text>
          <Text style={styles.totalAmount}>PHP {totalFare.toFixed(2)}</Text>
          <View style={styles.verifiedBadge}>
            <MaterialIcons
              name="verified"
              size={14}
              color="#10B981"
              style={{ marginRight: 6 }}
            />
            <Text style={styles.verifiedBadgeText}>
              Verified: Angeles City Ord. No. 723
            </Text>
          </View>
        </View>
        <View style={styles.breakdownRow}>
          <View style={styles.breakdownCard}>
            <View style={styles.iconCircleRed}>
              <MaterialIcons name="moped" size={16} color="#E53935" />
            </View>
            <Text style={styles.breakdownLabel}>BASE FARE</Text>
            <Text style={styles.breakdownValue}>PHP {baseFare.toFixed(2)}</Text>
          </View>
          <View style={styles.breakdownCard}>
            <View style={styles.iconCircleRed}>
              <MaterialIcons name="add-road" size={16} color="#E53935" />
            </View>
            <Text style={styles.breakdownLabel}>SUCCEEDING KM</Text>
            <Text style={styles.breakdownValue}>
              PHP {succeedingFare.toFixed(2)}
            </Text>
          </View>
        </View>
        <View style={styles.detailsList}>
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <MaterialIcons name="location-on" size={18} color="#94A3B8" />
              <Text style={styles.detailLabel}>Distance</Text>
            </View>
            <Text style={styles.detailValue}>{distance} km</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <MaterialIcons name="schedule" size={18} color="#94A3B8" />
              <Text style={styles.detailLabel}>Duration</Text>
            </View>
            <Text style={styles.detailValue}>{duration}</Text>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailRowLeft}>
              <MaterialIcons name="calendar-today" size={18} color="#94A3B8" />
              <Text style={styles.detailLabel}>Date</Text>
            </View>
            <Text style={styles.detailValue}>{date}</Text>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <View style={styles.detailRowLeft}>
              <MaterialIcons name="access-time" size={18} color="#94A3B8" />
              <Text style={styles.detailLabel}>Time</Text>
            </View>
            <Text style={styles.detailValue}>{time}</Text>
          </View>
        </View>
        {discountType !== "Regular" && (
          <View style={styles.discountBadge}>
            <View style={styles.discountLeft}>
              <View style={styles.idIconSquare}>
                <MaterialIcons name="badge" size={24} color="#8B5CF6" />
              </View>
              <View>
                <Text style={styles.discountTitle}>
                  {discountType} Discount Applied
                </Text>
                <Text style={styles.discountSubtext}>ID Verified via OCR</Text>
              </View>
            </View>
            <MaterialIcons name="check-circle" size={24} color="#10B981" />
          </View>
        )}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.saveBtn} activeOpacity={0.9}>
          <MaterialIcons
            name="save-alt"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.saveBtnText}>Save as Evidence</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.reportBtn}
          activeOpacity={0.9}
          onPress={handleReportDriver}
        >
          <MaterialIcons
            name="warning"
            size={20}
            color="#9A3412"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.reportBtnText}>Report Driver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    backgroundColor: "#E53935",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#FFFFFF" },

  scrollContent: { padding: 24, paddingBottom: 40 },

  // Total Section
  totalSection: { alignItems: "center", marginBottom: 32 },
  totalLabel: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 1,
    marginBottom: 4,
  },
  totalAmount: {
    fontSize: 48,
    fontWeight: "900",
    color: "#B91C1C",
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedBadgeText: { color: "#059669", fontSize: 12, fontWeight: "bold" },

  // Fare Breakdown Cards
  breakdownRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  breakdownCard: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
  },
  iconCircleRed: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FEE2E2",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  breakdownValue: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  // Trip Details List
  detailsList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailRowLeft: { flexDirection: "row", alignItems: "center" },
  detailLabel: { fontSize: 14, color: "#64748B", marginLeft: 12 },
  detailValue: { fontSize: 14, fontWeight: "bold", color: "#0F172A" },

  // Discount Badge
  discountBadge: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
  },
  discountLeft: { flexDirection: "row", alignItems: "center" },
  idIconSquare: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#EDE9FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  discountTitle: { fontSize: 13, fontWeight: "bold", color: "#0F172A" },
  discountSubtext: { fontSize: 11, color: "#64748B", marginTop: 2 },

  // Footer Actions
  footer: {
    padding: 24,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  saveBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#B91C1C",
    height: 56,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  reportBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF08A",
    height: 56,
    borderRadius: 12,
  },
  reportBtnText: { color: "#9A3412", fontSize: 16, fontWeight: "bold" },
});

export default TripReceiptScreen;
