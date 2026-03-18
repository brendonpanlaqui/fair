import { CameraView, useCameraPermissions } from "expo-camera";
import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import PrimaryButton from "./PrimaryButton"; // The reusable button we made earlier!

interface SmartCameraProps {
  children?: React.ReactNode; // Allows us to pass custom overlays (reticles, buttons)
  onCapture?: (photoData: any) => void;
}

const SmartCamera: React.FC<SmartCameraProps> = ({ children, onCapture }) => {
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);

  // 1. Handle Loading State
  if (!permission) {
    return <View style={styles.blackScreen} />;
  }

  // 2. Handle Permission Denied State
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>
          We need your permission to show the camera
        </Text>
        <PrimaryButton
          title="Grant Permission"
          onPress={requestPermission}
          backgroundColor="#4CAF50"
        />
      </View>
    );
  }

  // 3. Mock Capture Function (Ready for your backend later)
  const takePicture = async () => {
    if (cameraRef) {
      // In a real scenario: const photo = await cameraRef.takePictureAsync();
      // onCapture(photo);
      console.log("Photo captured! Ready to send to Laravel API.");
    }
  };

  // 4. Render the Camera
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing={facing}
        ref={(ref) => setCameraRef(ref)}
      >
        {/* This is where the magic happens. Any UI we pass inside <SmartCamera> shows up here. */}
        <View style={styles.overlayContainer}>{children}</View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  blackScreen: {
    flex: 1,
    backgroundColor: "#000000",
  },
  camera: {
    flex: 1,
  },
  overlayContainer: {
    flex: 1,
    backgroundColor: "transparent",
  },
  permissionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A1A",
    padding: 20,
  },
  permissionText: {
    color: "#FFFFFF",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
});

export default SmartCamera;
