import { MaterialIcons } from "@expo/vector-icons";
import { CameraView } from "expo-camera";
import React, { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
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
  onScan: (imageUri: string) => void; // 🚀 Changed to expect a local file path
  onScanStart: () => void;
}

export const OCRScannerModal = ({
  visible,
  isScanning,
  onClose,
  onScan,
  onScanStart,
}: Props) => {
  const cameraRef = useRef<CameraView>(null);

  const handleTakePicture = async () => {
    if (!cameraRef.current || isScanning) return;

    try {
      onScanStart();

      // 🚀 Take a standard photo. No base64 conversion needed anymore!
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.5,
      });

      if (photo && photo.uri) {
        onScan(photo.uri); // Pass the local file path to ML Kit
      }
    } catch (error) {
      console.error("Camera error:", error);
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.cameraModalContainer}>
        {visible && (
          <>
            <CameraView
              style={StyleSheet.absoluteFillObject}
              facing="back"
              ref={cameraRef}
            />

            <View style={styles.absoluteOverlay} pointerEvents="box-none">
              <View style={styles.cameraHeaderOverlay}>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.cameraCloseBtn}
                  disabled={isScanning}
                >
                  <MaterialIcons name="close" size={28} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Text style={styles.cameraHeaderTitle}>Scan Body Number</Text>
                  <TouchableOpacity
                    style={{ marginLeft: 8, padding: 4 }}
                    onPress={() => {
                      Alert.alert(
                        "Why scan?",
                        "Angeles City Ordinance 296 strictly prohibits unregistered 'colorum' tricycles.\n\nScanning the painted body number ensures you are riding a legitimate, LGU-verified tricycle for your own safety.",
                      );
                    }}
                  >
                    <MaterialIcons
                      name="help-outline"
                      size={22}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
                <View style={{ width: 28 }} />
              </View>

              <View style={styles.cameraTargetContainer} pointerEvents="none">
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
                  onPress={handleTakePicture}
                  disabled={isScanning}
                >
                  {isScanning ? (
                    <ActivityIndicator size="large" color="#E53935" />
                  ) : (
                    <View style={styles.shutterInner} />
                  )}
                </TouchableOpacity>
                <Text style={styles.shutterText}>
                  {isScanning ? "Processing Offline..." : "Tap to Scan OCR"}
                </Text>

                {/* DEV BYPASS BUTTON */}
                {__DEV__ && (
                  <TouchableOpacity
                    style={{
                      marginTop: 20,
                      padding: 10,
                      backgroundColor: "rgba(255,255,255,0.2)",
                      borderRadius: 8,
                    }}
                    onPress={() => {
                      onScanStart();
                      setTimeout(() => onScan("DEV_MOCK_SCAN_TRIGGER"), 500);
                    }}
                  >
                    <Text
                      style={{
                        color: "#FFF",
                        fontSize: 12,
                        fontWeight: "bold",
                      }}
                    >
                      🧪 DEV: Simulate Scan
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
};

// ... KEEP YOUR EXISTING STYLES AT THE BOTTOM ...
const styles = StyleSheet.create({
  cameraModalContainer: { flex: 1, backgroundColor: "#000000" },
  absoluteOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
    zIndex: 10,
  },
  cameraHeaderOverlay: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    zIndex: 20,
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
  cameraFooterOverlay: {
    paddingBottom: 50,
    alignItems: "center",
    zIndex: 20,
  },
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
