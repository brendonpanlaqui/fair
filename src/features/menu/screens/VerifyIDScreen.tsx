import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const ID_TYPES = [
  { id: "student", label: "Student ID", icon: "school" },
  { id: "senior", label: "Senior Citizen", icon: "elderly" },
  { id: "pwd", label: "PWD ID", icon: "accessible" },
];

export default function VerifyIdScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pickImage = async () => {
    Alert.alert("Upload ID", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              "Permission Needed",
              "We need camera access to scan your ID.",
            );
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0].uri) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0].uri) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    if (!selectedType || !imageUri) {
      Alert.alert("Incomplete", "Please select an ID type and upload a photo.");
      return;
    }

    setIsSubmitting(true);
    // Simulated API Call
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        "Verification Submitted!",
        "Your ID has been sent to the LGU for review. You will be notified once your 20% discount is activated.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Apply for Discount</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. ID TYPE SELECTION */}
        <Text style={styles.sectionTitle}>Select ID Type</Text>
        <Text style={styles.sectionSubtitle}>
          Choose the type of government-issued ID you are uploading.
        </Text>

        <View style={styles.typeContainer}>
          {ID_TYPES.map((type) => {
            const isSelected = selectedType === type.id;
            return (
              <TouchableOpacity
                key={type.id}
                style={[styles.typeCard, isSelected && styles.typeCardActive]}
                activeOpacity={0.7}
                onPress={() => setSelectedType(type.id)}
              >
                <MaterialIcons
                  name={type.icon as any}
                  size={24}
                  color={isSelected ? "#C62828" : "#94A3B8"}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={[
                    styles.typeLabel,
                    isSelected && styles.typeLabelActive,
                  ]}
                >
                  {type.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 2. FARE DISCOUNT VERIFICATION (Based on your Mockup) */}
        <Text style={styles.sectionTitle}>Fare Discount Verification</Text>
        <Text style={styles.sectionSubtitle}>
          Upload a clear photo of your ID to qualify for discounted fares
          (Student, Senior, or PWD).
        </Text>

        <TouchableOpacity
          style={styles.uploadBox}
          activeOpacity={0.8}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <>
              <View style={styles.uploadIconCircle}>
                <MaterialIcons name="camera-alt" size={28} color="#C62828" />
              </View>
              <Text style={styles.uploadTitle}>Upload ID Photo</Text>
              <Text style={styles.uploadSubtitle}>
                Tap to take a photo or select from gallery.
              </Text>
              <Text style={styles.uploadSubtitle}>
                Supports JPG, PNG (Max 5MB)
              </Text>
            </>
          )}
        </TouchableOpacity>

        {imageUri && (
          <TouchableOpacity style={styles.retakeTextBtn} onPress={pickImage}>
            <Text style={styles.retakeText}>Replace Photo</Text>
          </TouchableOpacity>
        )}

        {/* 3. WHY VERIFY CARD (Based on your Mockup) */}
        <View style={styles.whyVerifyCard}>
          <MaterialIcons
            name="verified-user"
            size={20}
            color="#C62828"
            style={{ marginTop: 2 }}
          />
          <View style={styles.whyVerifyTextWrapper}>
            <Text style={styles.whyVerifyTitle}>Why verify?</Text>
            <Text style={styles.whyVerifyText}>
              Verified users get a mandatory 20% LGU discount on standard
              tricycle fares across Angeles City.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* FIXED FOOTER (Based on your Mockup) */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!selectedType || !imageUri) && styles.submitBtnDisabled,
          ]}
          activeOpacity={0.9}
          disabled={!selectedType || !imageUri || isSubmitting}
          onPress={handleSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Submit Verification</Text>
              <MaterialIcons name="chevron-right" size={24} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>

        <Text style={styles.disclaimerText}>
          By tapping "Submit Verification", you agree to our Terms of Service
          and Privacy Policy regarding the secure collection of your ID data.
        </Text>
      </View>
    </View>
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
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 20,
  },

  // Type Selector
  typeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  typeCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 4,
  },
  typeCardActive: {
    backgroundColor: "#FFF1F2",
    borderColor: "#C62828",
    borderWidth: 2,
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748B",
    textAlign: "center",
  },
  typeLabelActive: { color: "#C62828" },

  // Upload Area (Matches mockup exactly)
  uploadBox: {
    backgroundColor: "#FFF5F5", // Very light red
    borderWidth: 1.5,
    borderColor: "#FECACA", // Red dashed line
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 200,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFE4E6", // Slightly darker red circle
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#C62828",
    marginBottom: 8,
  },
  uploadSubtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },

  previewImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    borderRadius: 14,
    resizeMode: "cover",
  },

  retakeTextBtn: { alignSelf: "center", marginBottom: 32, padding: 8 },
  retakeText: { color: "#C62828", fontSize: 14, fontWeight: "bold" },

  // Why Verify Card
  whyVerifyCard: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    marginBottom: 32,
  },
  whyVerifyTextWrapper: { flex: 1, marginLeft: 12 },
  whyVerifyTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 4,
  },
  whyVerifyText: { fontSize: 12, color: "#64748B", lineHeight: 18 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#C62828",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  submitBtnDisabled: { backgroundColor: "#CBD5E1" },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  disclaimerText: {
    fontSize: 10,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 14,
    paddingHorizontal: 16,
  },
});
