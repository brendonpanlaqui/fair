import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const CATEGORIES = ["Suggestion", "Bug Report", "App Design", "Other"];

export default function GiveFeedbackScreen() {
  const router = useRouter();

  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState("Suggestion");
  const [feedbackText, setFeedbackText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = () => {
    if (rating === 0) {
      Alert.alert("Almost there!", "Please provide a star rating.");
      return;
    }
    if (feedbackText.trim().length < 5) {
      Alert.alert(
        "Too short",
        "Please tell us a little more in the text area.",
      );
      return;
    }

    setIsSubmitting(true);

    // Simulate network request
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Thank You!",
        "Your feedback helps us make the Fair app better for everyone in Angeles City.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Give Feedback</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* GUARDRAIL BANNER */}
        <View style={styles.infoBanner}>
          <MaterialIcons
            name="info"
            size={24}
            color="#D97706"
            style={{ marginTop: 2 }}
          />
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>Reporting a Driver?</Text>
            <Text style={styles.bannerText}>
              This form is for app feedback only. To report overcharging, please
              use the PTRO hotline in the Dispute Guidelines.
            </Text>
          </View>
        </View>

        {/* STAR RATING */}
        <Text style={styles.sectionTitle}>How is your experience?</Text>
        <View style={styles.starsContainer}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity
              key={star}
              activeOpacity={0.7}
              onPress={() => setRating(star)}
              style={styles.starBtn}
            >
              <MaterialIcons
                name={star <= rating ? "star" : "star-border"}
                size={40}
                color={star <= rating ? "#F59E0B" : "#CBD5E1"} // Amber when selected
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* CATEGORY CHIPS */}
        <Text style={styles.sectionTitle}>What is this regarding?</Text>
        <View style={styles.chipsContainer}>
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.chip, isSelected && styles.chipActive]}
                activeOpacity={0.7}
                onPress={() => setCategory(cat)}
              >
                <Text
                  style={[styles.chipText, isSelected && styles.chipTextActive]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* TEXT AREA */}
        <Text style={styles.sectionTitle}>Tell us more</Text>
        <View style={styles.textAreaContainer}>
          <TextInput
            style={styles.textArea}
            placeholder="What do you love? What can we improve?"
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            value={feedbackText}
            onChangeText={setFeedbackText}
          />
        </View>
      </ScrollView>

      {/* FIXED BOTTOM SUBMIT BUTTON */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (rating === 0 || feedbackText.trim().length === 0) &&
              styles.submitBtnDisabled,
          ]}
          activeOpacity={0.8}
          disabled={
            isSubmitting || rating === 0 || feedbackText.trim().length === 0
          }
          onPress={handleSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Feedback</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  scrollContent: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 100 },

  // Info Banner
  infoBanner: {
    flexDirection: "row",
    backgroundColor: "#FFFBEB",
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#FEF3C7",
  },
  bannerTextContainer: { flex: 1, marginLeft: 12 },
  bannerTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#92400E",
    marginBottom: 4,
  },
  bannerText: { fontSize: 13, color: "#B45309", lineHeight: 20 },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 16,
  },

  // Star Rating
  starsContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    gap: 8,
  },
  starBtn: { padding: 4 },

  // Chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 32,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: {
    backgroundColor: "#FFF1F2",
    borderColor: "#C62828",
  },
  chipText: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#C62828" },

  // Text Area
  textAreaContainer: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    padding: 16,
    minHeight: 150,
  },
  textArea: {
    flex: 1,
    fontSize: 15,
    color: "#0F172A",
    lineHeight: 22,
  },

  // Footer
  footer: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitBtn: {
    backgroundColor: "#C62828",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: "#CBD5E1" },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
