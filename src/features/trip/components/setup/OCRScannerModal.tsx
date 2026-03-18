import { MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  isScanning: boolean;
  onClose: () => void;
  onScan: () => void;
}

export const OCRScannerModal = ({
  visible,
  isScanning,
  onClose,
  onScan,
}: Props) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.cameraModalContainer}>
        {visible && (
          <CameraView style={styles.camera} facing="back">
            <View style={styles.cameraHeaderOverlay}>
              <TouchableOpacity onPress={onClose} style={styles.cameraCloseBtn}>
                <MaterialIcons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              <Text style={styles.cameraHeaderTitle}>Scan Body Number</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.cameraTargetContainer}>
              <View style={styles.targetBox}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.targetInstructions}>
                  Align painted number inside the box
                </Text>
              </View>
            </View>

            <View style={styles.cameraFooterOverlay}>
              <TouchableOpacity
                style={styles.shutterButton}
                activeOpacity={0.8}
                onPress={onScan}
                disabled={isScanning}
              >
                {isScanning ? (
                  <ActivityIndicator size="large" color="#E53935" />
                ) : (
                  <View style={styles.shutterInner} />
                )}
              </TouchableOpacity>
              <Text style={styles.shutterText}>
                {isScanning ? "Processing Text..." : "Tap to Scan OCR"}
              </Text>
            </View>
          </CameraView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  cameraModalContainer: { flex: 1, backgroundColor: "#000000" },
  camera: { flex: 1, justifyContent: "space-between" },
  cameraHeaderOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  cameraCloseBtn: {
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },
  cameraHeaderTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraTargetContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  targetBox: {
    width: 350,
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 40,
    height: 40,
    borderColor: "#FFFFFF",
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: 0, right: 0, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderTopWidth: 0, borderLeftWidth: 0 },
  targetInstructions: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 160,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
  },
  cameraFooterOverlay: { paddingBottom: 50, alignItems: "center" },
  shutterButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    marginBottom: 12,
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E53935",
  },
  shutterText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
