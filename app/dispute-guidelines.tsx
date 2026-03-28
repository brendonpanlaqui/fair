import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Alert,
    Linking,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function DisputeGuidelinesScreen() {
  const router = useRouter();

  const handleCallPTRO = () => {
    Alert.alert(
      "Contact PTRO",
      "You are about to call the Public Transportation Regulatory Office for an urgent escalation.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Call Now",
          onPress: () =>
            Linking.openURL(
              Platform.OS === "android"
                ? "tel:09931696052"
                : "telprompt:09931696052",
            ),
        },
      ],
    );
  };

  const handleFileReport = () => {
    // We will build this screen next!
    // router.push("/submit-report");
    Alert.alert(
      "Coming Soon",
      "This will open the digital reporting form to send data to the Admin Dashboard.",
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispute Guidelines</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* INTRO BANNER */}
        <View style={styles.introBanner}>
          <MaterialIcons
            name="shield"
            size={28}
            color="#C62828"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.introTitle}>Your Rights as a Commuter</Text>
          <Text style={styles.introText}>
            Under Angeles City Ordinance No. 723, tricycles must strictly follow
            the approved fare matrix. Overcharging and arrogant behavior are
            punishable violations.
          </Text>
        </View>

        {/* STEPS TO REPORT */}
        <Text style={styles.sectionTitle}>How to File a Report</Text>

        <View style={styles.stepCard}>
          <View style={styles.stepNumberCircle}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Note the Body Number</Text>
            <Text style={styles.stepDescription}>
              Always memorize or take a photo of the tricycle's body number
              before arguing about the fare.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumberCircle}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Gather Evidence</Text>
            <Text style={styles.stepDescription}>
              Use the Fair App's calculated fare as your baseline. If the driver
              insists on overcharging, pay the requested amount but ask for
              their name if possible.
            </Text>
          </View>
        </View>

        <View style={styles.stepCard}>
          <View style={styles.stepNumberCircle}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <View style={styles.stepTextContainer}>
            <Text style={styles.stepTitle}>Submit to the Dashboard</Text>
            <Text style={styles.stepDescription}>
              File a digital report using this app. Your report goes directly to
              the LGU Admin Dashboard for official ticketing and tracking.
            </Text>
          </View>
        </View>

        {/* PRIMARY ACTION: IN-APP REPORT */}
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={handleFileReport}
        >
          <MaterialIcons
            name="report-problem"
            size={20}
            color="#FFFFFF"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.primaryButtonText}>File a Digital Report</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>— OR FOR URGENT MATTERS —</Text>

        {/* SECONDARY ACTION: CALL PTRO */}
        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
          onPress={handleCallPTRO}
        >
          <MaterialIcons
            name="call"
            size={20}
            color="#C62828"
            style={{ marginRight: 8 }}
          />
          <Text style={styles.secondaryButtonText}>
            Call PTRO Hotline (0993-169-6052)
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },

  introBanner: {
    backgroundColor: "#FFF1F2",
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  introTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#C62828",
    marginBottom: 8,
  },
  introText: { fontSize: 14, color: "#991B1B", lineHeight: 22 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
    marginLeft: 4,
  },

  stepCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  stepNumberCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
    marginTop: 2,
  },
  stepNumberText: { color: "#FFFFFF", fontSize: 14, fontWeight: "900" },
  stepTextContainer: { flex: 1 },
  stepTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  stepDescription: { fontSize: 13, color: "#64748B", lineHeight: 20 },

  // New Button Layout
  primaryButton: {
    flexDirection: "row",
    backgroundColor: "#C62828",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    elevation: 4,
    shadowColor: "#C62828",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },

  orText: {
    textAlign: "center",
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    marginVertical: 16,
  },

  secondaryButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  secondaryButtonText: { color: "#C62828", fontSize: 15, fontWeight: "bold" },
});
