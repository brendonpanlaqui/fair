import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";
import { VIOLATION_OPTIONS } from "../reportUtils";

interface ReportFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmitSuccess: () => void;
  initialTripId: string;
  initialBodyNumber: string;
}

export default function ReportFormModal({
  visible,
  onClose,
  onSubmitSuccess,
  initialTripId,
  initialBodyNumber,
}: ReportFormModalProps) {
  const { user } = useAuth();

  // holds the data the user types into the form
  const [newBodyNumber, setNewBodyNumber] = useState("");
  const [newViolation, setNewViolation] = useState("Overcharging");
  const [newComments, setNewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 📸 State for the attached photo (moved inside the component!)
  const [evidencePhoto, setEvidencePhoto] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  // Sync initial props to local state when modal opens
  useEffect(() => {
    if (visible) {
      setNewBodyNumber(initialBodyNumber);
      setNewViolation("Overcharging");
      setNewComments("");
      setEvidencePhoto(null); // reset the photo when opened
    }
  }, [visible, initialBodyNumber]);

  // 📸 Function to handle opening the gallery and picking an image
  const pickImage = async () => {
    // Ask for permission first
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(
        "Permission Required",
        "You need to allow access to your photos to attach evidence.",
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.7, // compress slightly to save server space
    });

    if (!result.canceled) {
      setEvidencePhoto(result.assets[0]);
    }
  };

  const handleSubmitReport = async () => {
    // to provide comments to at least describe the incident
    if (!newComments) {
      Alert.alert("Required", "Please provide details about the incident.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 📦 Create a new FormData object instead of a standard JSON object
      const formData = new FormData();

      formData.append(
        "report_id",
        `TKT-${Math.floor(10000 + Math.random() * 90000)}`,
      );
      formData.append("user", user?.id?.toString() || "");
      formData.append("violation_type", newViolation);
      formData.append("passenger_comments", newComments);

      if (initialTripId) {
        formData.append("trip", initialTripId);
      } else {
        formData.append("manual_body_number", newBodyNumber);
      }

      // 📸 If they selected a photo, append it exactly like this for React Native
      if (evidencePhoto) {
        const filename = evidencePhoto.uri.split("/").pop() || "evidence.jpg";

        formData.append("evidence_photo", {
          uri: evidencePhoto.uri,
          name: filename,
          type: "image/jpeg",
        } as any);
      }

      // sends the report to the backend (🚨 override Content-Type for files)
      await api.post("/reports/submit/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // kung tapos na, close the form, reset the fields, and refresh the report list to show the new ticket
      onSubmitSuccess();
      Alert.alert(
        "Report Submitted",
        "Your ticket has been forwarded to the Angeles City PTRO.",
      );
    } catch (error) {
      console.warn("Submit Error:", error);
      Alert.alert("Error", "Could not submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // REPORT FORM MODAL
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.fullModalContainer}>
        <View style={styles.fullModalHeader}>
          <TouchableOpacity onPress={onClose} style={{ padding: 4 }}>
            <MaterialIcons name="close" size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.fullModalTitle}>File a Complaint</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.formContent}>
          <View style={styles.warningBanner}>
            <MaterialIcons name="info-outline" size={20} color="#B91C1C" />
            <Text style={styles.warningText}>
              False reports may lead to account suspension. Please provide
              accurate details.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text style={styles.inputLabel}>TRICYCLE BODY NUMBER</Text>
              {initialTripId !== "" && (
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <MaterialIcons name="verified" size={14} color="#10B981" />
                  <Text style={styles.autoLinkedText}>AUTO-LINKED</Text>
                </View>
              )}
            </View>

            <TextInput
              style={[
                styles.input,
                initialTripId !== "" && {
                  backgroundColor: "#E2E8F0",
                  color: "#64748B",
                },
              ]}
              value={newBodyNumber}
              onChangeText={setNewBodyNumber}
              placeholder="e.g. 0406"
              keyboardType="number-pad"
              placeholderTextColor="#94A3B8"
              editable={initialTripId === ""} // if linked from the HistoryScreen
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>VIOLATION TYPE</Text>
            <View style={styles.chipContainer}>
              {/* dynamically map the options */}
              {VIOLATION_OPTIONS.map(
                (option: {
                  id: string;
                  label: string;
                  backendValue: string;
                }) => (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.chip,
                      newViolation === option.backendValue && styles.chipActive,
                    ]}
                    onPress={() => setNewViolation(option.backendValue)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        newViolation === option.backendValue &&
                          styles.chipTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>INCIDENT DETAILS</Text>
            <TextInput
              style={styles.textArea}
              value={newComments}
              onChangeText={setNewComments}
              placeholder="Describe what happened..."
              placeholderTextColor="#94A3B8"
              multiline={true}
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          {/* 📸 Updated Photo Button UI */}
          <TouchableOpacity
            style={[
              styles.evidenceBtn,
              evidencePhoto && {
                borderColor: "#10B981",
                backgroundColor: "#ECFDF5",
              },
            ]}
            activeOpacity={0.7}
            onPress={pickImage}
          >
            {evidencePhoto ? (
              <>
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color="#10B981"
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.evidenceBtnText, { color: "#065F46" }]}>
                  Photo Attached
                </Text>
              </>
            ) : (
              <>
                <MaterialIcons
                  name="add-a-photo"
                  size={20}
                  color="#D32F2F"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.evidenceBtnText}>
                  Attach Photo Evidence (Optional)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={styles.submitButton}
            activeOpacity={0.9}
            onPress={handleSubmitReport}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons
                  name="send"
                  size={20}
                  color="#FFFFFF"
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.submitButtonText}>SUBMIT REPORT</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fullModalContainer: { flex: 1, backgroundColor: "#FFFFFF" },
  fullModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 55,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  fullModalTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  formContent: { flex: 1, padding: 24 },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FFF1F2",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: "#BE123C",
    marginLeft: 12,
    lineHeight: 18,
    fontWeight: "500",
  },
  formGroup: { marginBottom: 24 },
  inputLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  autoLinkedText: {
    fontSize: 10,
    color: "#10B981",
    fontWeight: "bold",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: "#0F172A",
  },
  chipContainer: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#FFF1F2", borderColor: "#D32F2F" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#64748B" },
  chipTextActive: { color: "#D32F2F", fontWeight: "800" },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    color: "#0F172A",
    minHeight: 120,
  },
  evidenceBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF1F2",
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    borderStyle: "dashed",
  },
  evidenceBtnText: { fontSize: 14, fontWeight: "800", color: "#D32F2F" },
  formFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  submitButton: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
