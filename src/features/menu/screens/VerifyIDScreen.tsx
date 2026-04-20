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
import { api } from "../../../services/api";

// match what the Django backend expects.
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

  // opens camera or photo library based on their choice
  const pickImage = async () => {
    Alert.alert("Upload ID", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          // camera permission
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted) {
            Alert.alert(
              "Permission Needed",
              "We need camera access to scan your ID.",
            );
            return;
          }
          // open camera, save bandwith by making quality 0.8
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          // if they took a photo and didn't cancel, save the URI to state to show a preview and upload later
          if (!result.canceled && result.assets[0].uri) {
            setImageUri(result.assets[0].uri);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          // media library permission
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

  // once user taps submit
  const handleSubmit = async () => {
    // ensure they actually picked an ID type and uploaded a photo.
    if (!selectedType || !imageUri) {
      Alert.alert("Incomplete", "Please select an ID type and upload a photo.");
      return;
    }

    setIsSubmitting(true);

    try {
      // to send from Django, we need to use FormData to mimic a form submission with a file upload.
      const formData = new FormData();
      formData.append("discount_type", selectedType);

      // extract file extension to tell Django what kind of image it is (jpeg, png, etc.)
      const filename = imageUri.split("/").pop() || "id_photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      // the framework requires this exact structure { uri, name, type } for file uploads.
      formData.append("id_photo", {
        uri: imageUri,
        name: filename,
        type: fileType,
      } as any);

      // send POST request sa Django and set Content-Type header to "multipart/form-data" so Django knows a file is coming.
      await api.post("/users/verify-id/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      Alert.alert(
        "Verification Submitted!",
        "Your ID has been sent to the LGU for review. You will be notified once your 20% discount is activated.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (error: any) {
      console.warn("Upload Error:", error);
      Alert.alert(
        "Upload Failed",
        "Could not send your ID to the server. Please check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
        {/* ID TYPE */}
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

        {/* UPLOAD PHOTO */}
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
          {/* show image if available, otherwise show placeholder */}
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
          {/* show a spinner while the upload request is happening */}
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

  uploadBox: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1.5,
    borderColor: "#FECACA",
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
    backgroundColor: "#FFE4E6",
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
