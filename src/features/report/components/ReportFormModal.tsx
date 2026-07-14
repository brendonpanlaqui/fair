import { MaterialIcons } from "@expo/vector-icons";
import {
  CameraView,
  useCameraPermissions,
  useMicrophonePermissions,
} from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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

  const [newBodyNumber, setNewBodyNumber] = useState("");
  const [newViolation, setNewViolation] = useState("Overcharging");
  const [newComments, setNewComments] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [evidenceMedia, setEvidenceMedia] = useState<{
    uri: string;
    type: string;
  } | null>(null);

  const [cameraMode, setCameraMode] = useState<"picture" | "video">("picture");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const cameraRef = useRef<CameraView>(null);

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();

  useEffect(() => {
    if (visible) {
      setNewBodyNumber(initialBodyNumber);
      setNewViolation("Overcharging");
      setNewComments("");
      setEvidenceMedia(null);
      setIsCameraActive(false);
    }
  }, [visible, initialBodyNumber]);

  // --- Camera Functions ---
  const handleOpenCamera = async () => {
    if (!cameraPermission?.granted) await requestCameraPermission();
    if (!micPermission?.granted) await requestMicPermission();

    if (cameraPermission?.granted && micPermission?.granted) {
      setIsCameraActive(true);
    } else {
      Alert.alert(
        "Permission Required",
        "Camera and microphone access are needed.",
      );
    }
  };

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.5 });
      if (photo) {
        setEvidenceMedia({ uri: photo.uri, type: "image" });
        setIsCameraActive(false);
      }
    }
  };

  const startVideo = async () => {
    if (cameraRef.current) {
      setIsRecording(true);
      const video = await cameraRef.current.recordAsync({ maxDuration: 15 });
      if (video) {
        setEvidenceMedia({ uri: video.uri, type: "video" });
        setIsRecording(false);
        setIsCameraActive(false);
      }
    }
  };

  const stopVideo = () => {
    if (cameraRef.current && isRecording) {
      cameraRef.current.stopRecording();
      setIsRecording(false);
    }
  };

  const pickMedia = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      Alert.alert("Permission Required", "Gallery access is needed.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsEditing: true,
      videoMaxDuration: 15,
      quality: 0.5,
    });

    if (!result.canceled) {
      setEvidenceMedia({
        uri: result.assets[0].uri,
        type: result.assets[0].type || "image",
      });
    }
  };

  const handleSubmitReport = async () => {
    if (!newComments.trim()) {
      Alert.alert("Required", "Please provide details about the incident.");
      return;
    }

    setIsSubmitting(true);
    try {
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

      if (evidenceMedia) {
        const filename = evidenceMedia.uri.split("/").pop() || "evidence.jpg";
        const isVideo =
          evidenceMedia.type === "video" || filename.endsWith(".mp4");
        const mimeType = isVideo ? "video/mp4" : "image/jpeg";
        const fieldName = isVideo ? "evidence_video" : "evidence_photo";

        formData.append(fieldName, {
          uri: evidenceMedia.uri,
          name: filename,
          type: mimeType,
        } as any);
      }

      await api.post("/reports/submit/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      onSubmitSuccess();
      Alert.alert(
        "Report Submitted",
        "Your ticket has been forwarded to the PTRO.",
      );
    } catch (error: any) {
      console.warn("Submit Error:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Could not submit report. Please try again.";
      Alert.alert("Report Failed", errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = newComments.trim().length > 0;

  if (isCameraActive) {
    return (
      <Modal visible={visible} animationType="slide" transparent={false}>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            ref={cameraRef}
            mode={cameraMode}
            videoQuality="480p"
          />

          <View style={styles.cameraOverlay}>
            <TouchableOpacity
              style={styles.cameraCloseBtn}
              onPress={() => setIsCameraActive(false)}
            >
              <MaterialIcons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.cameraBottomControls}>
              {/* 🚨 FIX 2: Photo / Video Toggle */}
              {!isRecording && (
                <View style={styles.modeSelector}>
                  <TouchableOpacity onPress={() => setCameraMode("picture")}>
                    <Text
                      style={[
                        styles.modeText,
                        cameraMode === "picture" && styles.modeTextActive,
                      ]}
                    >
                      PHOTO
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setCameraMode("video")}>
                    <Text
                      style={[
                        styles.modeText,
                        cameraMode === "video" && styles.modeTextActive,
                      ]}
                    >
                      VIDEO
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* 🚨 FIX 3: Universal Capture Button */}
              <View style={styles.cameraActionRow}>
                <TouchableOpacity
                  style={styles.captureBtnOuter}
                  onPress={
                    cameraMode === "picture"
                      ? takePhoto
                      : isRecording
                        ? stopVideo
                        : startVideo
                  }
                >
                  <View
                    style={[
                      styles.captureBtnInner,
                      cameraMode === "video" && styles.captureBtnInnerVideo,
                      isRecording && styles.captureBtnRecording,
                    ]}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.fullModalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.fullModalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <MaterialIcons name="close" size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.fullModalTitle}>File a Complaint</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ... Warning Banner, Body Number, Violation Type, Incident Details remain EXACTLY the same ... */}

          <View style={styles.warningBanner}>
            <MaterialIcons
              name="info-outline"
              size={20}
              color="#B91C1C"
              style={{ marginTop: 2 }}
            />
            <Text style={styles.warningText}>
              False reports may lead to account suspension. Please provide
              accurate details.
            </Text>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>TRICYCLE BODY NUMBER</Text>
              {initialTripId !== "" && (
                <View style={styles.linkedBadge}>
                  <MaterialIcons name="verified" size={12} color="#10B981" />
                  <Text style={styles.autoLinkedText}>AUTO-LINKED</Text>
                </View>
              )}
            </View>
            <TextInput
              style={[
                styles.input,
                initialTripId !== "" && styles.inputDisabled,
              ]}
              value={newBodyNumber}
              onChangeText={setNewBodyNumber}
              placeholder="e.g. 0406"
              keyboardType="number-pad"
              placeholderTextColor="#94A3B8"
              editable={initialTripId === ""}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>VIOLATION TYPE</Text>
            <View style={styles.chipContainer}>
              {VIOLATION_OPTIONS.map((option: any) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.chip,
                    newViolation === option.backendValue && styles.chipActive,
                  ]}
                  onPress={() => setNewViolation(option.backendValue)}
                  activeOpacity={0.7}
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
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>INCIDENT DETAILS *</Text>
            <TextInput
              style={styles.textArea}
              value={newComments}
              onChangeText={setNewComments}
              placeholder="Describe what happened clearly..."
              placeholderTextColor="#94A3B8"
              multiline={true}
              numberOfLines={5}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>EVIDENCE (OPTIONAL)</Text>
            <View style={styles.evidenceDisclaimerBox}>
              <MaterialIcons
                name="privacy-tip"
                size={14}
                color="#64748B"
                style={{ marginTop: 2 }}
              />
              <Text style={styles.evidenceDisclaimerText}>
                Videos are capped at 15 seconds for fast uploads. Try to clearly
                capture the tricycle body number or the fare matrix.
              </Text>
            </View>
            {evidenceMedia ? (
              <TouchableOpacity
                style={styles.evidenceAttachedCard}
                activeOpacity={0.7}
                onPress={() => setEvidenceMedia(null)}
              >
                <View style={styles.evidenceIconContainer}>
                  <MaterialIcons
                    name={evidenceMedia.type === "video" ? "videocam" : "image"}
                    size={28}
                    color="#10B981"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.evidenceTitle}>
                    {evidenceMedia.type === "video"
                      ? "Video Attached"
                      : "Photo Attached"}
                  </Text>
                  <Text style={styles.evidenceSubtitle}>
                    Tap here to remove or change
                  </Text>
                </View>
                <MaterialIcons name="cancel" size={24} color="#64748B" />
              </TouchableOpacity>
            ) : (
              <View style={styles.mediaButtonsRow}>
                {/* Updated Button to trigger Custom Camera */}
                <TouchableOpacity
                  style={styles.mediaActionCard}
                  activeOpacity={0.7}
                  onPress={handleOpenCamera}
                >
                  <View style={styles.mediaActionIcon}>
                    <MaterialIcons
                      name="camera-alt"
                      size={28}
                      color="#D32F2F"
                    />
                  </View>
                  <Text style={styles.mediaActionText}>Camera</Text>
                  <Text style={styles.mediaActionSubtext}>
                    Take a photo/video
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.mediaActionCard}
                  activeOpacity={0.7}
                  onPress={pickMedia}
                >
                  <View style={styles.mediaActionIcon}>
                    <MaterialIcons
                      name="photo-library"
                      size={28}
                      color="#D32F2F"
                    />
                  </View>
                  <Text style={styles.mediaActionText}>Gallery</Text>
                  <Text style={styles.mediaActionSubtext}>
                    Upload from device
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={styles.formFooter}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !isFormValid && styles.submitButtonDisabled,
            ]}
            activeOpacity={0.9}
            onPress={handleSubmitReport}
            disabled={isSubmitting || !isFormValid}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <MaterialIcons
                  name="send"
                  size={20}
                  color={isFormValid ? "#FFFFFF" : "#94A3B8"}
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={[
                    styles.submitButtonText,
                    !isFormValid && { color: "#94A3B8" },
                  ]}
                >
                  {isFormValid ? "SUBMIT REPORT" : "FILL DETAILS TO SUBMIT"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  cameraContainer: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  cameraControls: {
    flex: 1,
    backgroundColor: "transparent",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
  },
  cameraCloseBtn: {
    alignSelf: "flex-end",
    marginTop: 40,
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 8,
    borderRadius: 100,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject, // This makes it float over the entire screen
    backgroundColor: "transparent",
    flexDirection: "column",
    justifyContent: "space-between",
    padding: 24,
    zIndex: 10, // Ensures buttons are clickable on Android
  },
  cameraBottomControls: {
    alignItems: "center",
    paddingBottom: 20,
  },
  modeSelector: {
    flexDirection: "row",
    gap: 30,
    marginBottom: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  modeText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 1,
  },
  modeTextActive: {
    color: "#FFFFFF",
  },
  cameraActionRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  captureBtnOuter: {
    borderWidth: 4,
    borderColor: "#FFFFFF",
    borderRadius: 100,
    padding: 4,
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
  },
  captureBtnInnerVideo: {
    backgroundColor: "#D32F2F",
  },
  captureBtnRecording: {
    borderRadius: 8,
    transform: [{ scale: 0.6 }],
  },
  photoCaptureBtn: {
    backgroundColor: "rgba(0,0,0,0.6)",
    padding: 20,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  videoCaptureBtn: {
    backgroundColor: "#D32F2F",
    padding: 24,
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  videoCaptureBtnActive: {
    backgroundColor: "#B91C1C",
    borderColor: "#FFFFFF",
    transform: [{ scale: 1.1 }],
  },

  // Existing Styles from previous block:
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
    backgroundColor: "#FFFFFF",
  },
  closeButton: { padding: 8, marginLeft: -8 },
  fullModalTitle: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  warningBanner: {
    flexDirection: "row",
    backgroundColor: "#FFF1F2",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FFE4E6",
    marginBottom: 24,
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: "#BE123C",
    marginLeft: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  formGroup: { marginBottom: 24 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  linkedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  autoLinkedText: {
    fontSize: 10,
    color: "#059669",
    fontWeight: "bold",
    marginLeft: 4,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: "#0F172A",
    fontWeight: "600",
  },
  inputDisabled: { backgroundColor: "#E2E8F0", color: "#64748B" },
  chipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  chip: {
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  chipActive: { backgroundColor: "#FFF1F2", borderColor: "#D32F2F" },
  chipText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  chipTextActive: { color: "#D32F2F", fontWeight: "800" },
  textArea: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    fontSize: 16,
    color: "#0F172A",
    minHeight: 120,
    marginTop: 8,
  },
  mediaButtonsRow: { flexDirection: "row", gap: 12, marginTop: 8 },
  mediaActionCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  mediaActionIcon: {
    backgroundColor: "#FFF1F2",
    padding: 12,
    borderRadius: 100,
    marginBottom: 12,
  },
  mediaActionText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 2,
  },
  mediaActionSubtext: { fontSize: 12, color: "#64748B", textAlign: "center" },
  evidenceAttachedCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#10B981",
    borderRadius: 16,
    padding: 16,
    marginTop: 8,
  },
  evidenceIconContainer: {
    backgroundColor: "#D1FAE5",
    padding: 10,
    borderRadius: 12,
    marginRight: 16,
  },
  evidenceTitle: { fontSize: 15, fontWeight: "800", color: "#065F46" },
  evidenceSubtitle: { fontSize: 12, color: "#059669", marginTop: 2 },
  formFooter: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    backgroundColor: "#FFFFFF",
  },
  evidenceDisclaimerBox: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  evidenceDisclaimerText: {
    flex: 1,
    fontSize: 11,
    color: "#475569",
    marginLeft: 8,
    lineHeight: 16,
    fontWeight: "500",
  },
  submitButton: {
    backgroundColor: "#D32F2F",
    flexDirection: "row",
    borderRadius: 16,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  submitButtonDisabled: { backgroundColor: "#E2E8F0" },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
