import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
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

const FAQS = [
  {
    id: "1",
    question: "How is the tricycle fare calculated?",
    answer:
      "Fares are calculated using your phone's GPS based on Angeles City LGU Ordinance No. 723. The base fare is ₱35.00 for the first kilometer, plus ₱15.00 for every succeeding kilometer.",
  },
  {
    id: "2",
    question: "How do I apply my Student or Senior discount?",
    answer:
      "Go to the Menu and tap 'Apply for Discount' to upload your valid Student, Senior Citizen, or PWD ID. Once approved, the 20% LGU discount is automatically applied to all your trips.",
  },
  {
    id: "3",
    question: "Does the app need internet to work?",
    answer:
      "The app requires an internet connection to log in and sync the latest fare matrices. However, core GPS distance tracking can function even in low-signal areas.",
  },
];

export default function HelpSupportScreen() {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleFAQ = (id: string) =>
    setExpandedId(expandedId === id ? null : id);

  // --- GOVERNMENT CONTACT ---
  const handleCallPTRO = () => {
    Alert.alert(
      "Contact PTRO",
      "Call the Public Transportation Regulatory Office to report a driver violation.",
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

  // --- APP DEV CONTACT ---
  const handleEmailSupport = () =>
    Linking.openURL(
      "mailto:support@fairapp.ph?subject=Fair App Support Request",
    );
  const handleCallSupport = () => {
    Alert.alert(
      "Technical Support",
      "Call our team for app bugs or account issues. (For driver disputes, call the PTRO above).",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Call", onPress: () => Linking.openURL("tel:09123456789") },
      ],
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
        <Text style={styles.headerTitle}>Help & Support</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ========================================== */}
        {/* SECTION 1: DISPUTE GUIDELINES (MERGED)     */}
        {/* ========================================== */}
        <Text style={styles.sectionTitle}>COMMUTER RIGHTS & DISPUTES</Text>

        <View style={styles.guidelinesContainer}>
          <View style={styles.introBanner}>
            <MaterialIcons
              name="shield"
              size={24}
              color="#C62828"
              style={{ marginBottom: 8 }}
            />
            <Text style={styles.introText}>
              Under{" "}
              <Text style={{ fontWeight: "bold" }}>Ordinance No. 723</Text>,
              overcharging is punishable. Here is how to handle a dispute:
            </Text>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Note the Body Number</Text>
              <Text style={styles.stepDescription}>
                Memorize or photograph the tricycle's body number before
                arguing.
              </Text>
            </View>
          </View>

          <View style={styles.stepCard}>
            <View style={styles.stepNumberCircle}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepTextContainer}>
              <Text style={styles.stepTitle}>Use the Report Tab</Text>
              <Text style={styles.stepDescription}>
                Submit a digital ticket through the 'Report' tab for the LGU to
                investigate.
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.ptroButton}
            activeOpacity={0.7}
            onPress={handleCallPTRO}
          >
            <MaterialIcons
              name="call"
              size={18}
              color="#C62828"
              style={{ marginRight: 8 }}
            />
            <Text style={styles.ptroButtonText}>Urgent? Call PTRO Hotline</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================== */}
        {/* SECTION 2: APP TECHNICAL SUPPORT           */}
        {/* ========================================== */}
        <Text style={styles.sectionTitle}>APP TECHNICAL SUPPORT</Text>
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.7}
            onPress={handleCallSupport}
          >
            <View
              style={[styles.contactIconBg, { backgroundColor: "#F1F5F9" }]}
            >
              <MaterialIcons name="headset-mic" size={24} color="#0F172A" />
            </View>
            <Text style={styles.contactTitle}>Call Devs</Text>
            <Text style={styles.contactSubtitle}>App bugs only</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            activeOpacity={0.7}
            onPress={handleEmailSupport}
          >
            <View
              style={[styles.contactIconBg, { backgroundColor: "#F0F9FF" }]}
            >
              <MaterialIcons name="email" size={24} color="#0284C7" />
            </View>
            <Text style={styles.contactTitle}>Email</Text>
            <Text style={styles.contactSubtitle}>Account issues</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================== */}
        {/* SECTION 3: FAQS                            */}
        {/* ========================================== */}
        <Text style={styles.sectionTitle}>FREQUENTLY ASKED QUESTIONS</Text>
        <View style={styles.faqContainer}>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedId === faq.id;
            return (
              <View
                key={faq.id}
                style={[
                  styles.faqItem,
                  index === FAQS.length - 1 && styles.noBorder,
                ]}
              >
                <TouchableOpacity
                  style={styles.faqHeader}
                  activeOpacity={0.7}
                  onPress={() => toggleFAQ(faq.id)}
                >
                  <Text
                    style={[
                      styles.faqQuestion,
                      isExpanded && styles.faqQuestionActive,
                    ]}
                  >
                    {faq.question}
                  </Text>
                  <MaterialIcons
                    name={
                      isExpanded ? "keyboard-arrow-up" : "keyboard-arrow-down"
                    }
                    size={24}
                    color={isExpanded ? "#C62828" : "#94A3B8"}
                  />
                </TouchableOpacity>
                {isExpanded && (
                  <View style={styles.faqBody}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* ========================================== */}
        {/* SECTION 4: APP FEEDBACK                    */}
        {/* ========================================== */}
        <Text style={[styles.sectionTitle, { marginTop: 32 }]}>FEEDBACK</Text>
        <TouchableOpacity
          style={styles.feedbackCard}
          activeOpacity={0.7}
          onPress={() => router.push("/give-feedback")}
        >
          <View style={styles.feedbackIconBg}>
            <MaterialIcons name="rate-review" size={24} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.feedbackTitle}>Rate the App</Text>
            <Text style={styles.feedbackSubtitle}>
              Found a bug or have a suggestion? Let us know.
            </Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color="#CBD5E1" />
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },

  // Guidelines Section
  guidelinesContainer: { marginBottom: 32 },
  introBanner: {
    backgroundColor: "#FFF1F2",
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FECACA",
  },
  introText: { fontSize: 13, color: "#991B1B", lineHeight: 20 },
  stepCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  stepNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  stepNumberText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  stepTextContainer: { flex: 1, justifyContent: "center" },
  stepTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  stepDescription: { fontSize: 12, color: "#64748B", lineHeight: 16 },
  ptroButton: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FECACA",
    marginTop: 8,
  },
  ptroButtonText: { color: "#C62828", fontSize: 14, fontWeight: "bold" },

  // Contact Cards
  contactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  contactCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  contactIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  contactTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  contactSubtitle: { fontSize: 11, color: "#64748B" },

  // FAQ Section
  faqContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  faqItem: { borderBottomWidth: 1, borderBottomColor: "#F1F5F9" },
  noBorder: { borderBottomWidth: 0 },
  faqHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 13,
    fontWeight: "bold",
    color: "#0F172A",
    marginRight: 16,
  },
  faqQuestionActive: { color: "#C62828" },
  faqBody: { paddingHorizontal: 16, paddingBottom: 16 },
  faqAnswer: { fontSize: 13, color: "#64748B", lineHeight: 20 },

  // Feedback Card
  feedbackCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  feedbackIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  feedbackTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  feedbackSubtitle: { fontSize: 12, color: "#64748B", paddingRight: 16 },
});
