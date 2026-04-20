import { useAuth } from "@/src/hooks/AuthContext";
import { api } from "@/src/services/api";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useRef, useState } from "react";
import {
    ActivityIndicator,
    Animated,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

import { InputField } from "@/src/components/ui/InputField";

export default function ManageAccountScreen() {
  const router = useRouter();
  const { user, setUser } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || "");
  const [lastName, setLastName] = useState(user?.last_name || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [toastConfig, setToastConfig] = useState({
    message: "",
    type: "error",
  });
  const slideAnim = useRef(new Animated.Value(100)).current;

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToastConfig({ message, type });
    Animated.sequence([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 8,
      }),
      Animated.delay(3000),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => setToastConfig({ message: "", type: "error" }));
  };

  const handleUpdateProfile = async () => {
    let isValid = true;
    let newErrors = { ...errors, firstName: "", lastName: "" };

    if (!firstName.trim()) {
      newErrors.firstName = "Required";
      isValid = false;
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Required";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setIsUpdatingProfile(true);
    try {
      await api.patch("/users/me/", {
        first_name: firstName,
        last_name: lastName,
      });

      setUser({ ...user, first_name: firstName, last_name: lastName });
      showToast("Profile updated successfully!", "success");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to update profile.";
      showToast(msg, "error");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async () => {
    let isValid = true;
    let newErrors = {
      ...errors,
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    };

    if (!currentPassword) {
      newErrors.currentPassword = "Required";
      isValid = false;
    }

    const strongPasswordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;
    if (!strongPasswordRegex.test(newPassword)) {
      newErrors.newPassword =
        "Must contain 8+ chars, uppercase, number, & symbol";
      isValid = false;
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      isValid = false;
    }

    setErrors(newErrors);
    if (!isValid) return;

    setIsUpdatingPassword(true);
    try {
      await api.post("/auth/change-password/", {
        old_password: currentPassword,
        new_password: newPassword,
      });

      showToast("Password changed successfully!", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      const msg = error.response?.data?.error || "Failed to change password.";
      showToast(msg, "error");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.emailCard}>
          <View style={styles.emailIconBg}>
            <MaterialIcons name="mail" size={20} color="#D32F2F" />
          </View>
          <View>
            <Text style={styles.emailLabel}>Registered Email</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
          </View>
        </View>

        <Text style={styles.sectionLabel}>PERSONAL DETAILS</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField
                label="First Name"
                placeholder="Juan"
                value={firstName}
                onChangeText={(text: string) => {
                  setFirstName(text);
                  setErrors((prev) => ({ ...prev, firstName: "" }));
                }}
                error={errors.firstName}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField
                label="Last Name"
                placeholder="Dela Cruz"
                value={lastName}
                onChangeText={(text: string) => {
                  setLastName(text);
                  setErrors((prev) => ({ ...prev, lastName: "" }));
                }}
                error={errors.lastName}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, isUpdatingProfile && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleUpdateProfile}
            disabled={isUpdatingProfile}
          >
            {isUpdatingProfile ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Save Changes</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionLabel}>SECURITY</Text>
        <View style={styles.card}>
          <InputField
            label="Current Password"
            placeholder="Enter current password"
            isPassword
            value={currentPassword}
            onChangeText={(text: string) => {
              setCurrentPassword(text);
              setErrors((prev) => ({ ...prev, currentPassword: "" }));
            }}
            error={errors.currentPassword}
          />

          <InputField
            label="New Password"
            placeholder="Enter new password"
            isPassword
            value={newPassword}
            onChangeText={(text: string) => {
              setNewPassword(text);
              setErrors((prev) => ({ ...prev, newPassword: "" }));
            }}
            error={errors.newPassword}
          />

          {!errors.newPassword ? (
            <Text style={styles.helperText}>
              Minimum 8 characters, 1 uppercase, 1 number, 1 symbol
            </Text>
          ) : null}

          <InputField
            label="Confirm New Password"
            placeholder="Re-type new password"
            isPassword
            value={confirmPassword}
            onChangeText={(text: string) => {
              setConfirmPassword(text);
              setErrors((prev) => ({ ...prev, confirmPassword: "" }));
            }}
            error={errors.confirmPassword}
          />

          <TouchableOpacity
            style={[styles.saveBtn, isUpdatingPassword && { opacity: 0.7 }]}
            activeOpacity={0.8}
            onPress={handleUpdatePassword}
            disabled={isUpdatingPassword}
          >
            {isUpdatingPassword ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>Update Password</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {toastConfig.message ? (
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateY: slideAnim }] },
            toastConfig.type === "success"
              ? styles.toastSuccess
              : styles.toastError,
          ]}
        >
          <MaterialIcons
            name={toastConfig.type === "success" ? "check-circle" : "error"}
            size={24}
            color="#FFFFFF"
          />
          <Text style={styles.toastText}>{toastConfig.message}</Text>
        </Animated.View>
      ) : null}
    </KeyboardAvoidingView>
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
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 60,
  },
  emailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  emailIconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  emailLabel: {
    fontSize: 12,
    color: "#64748B",
    fontWeight: "600",
    marginBottom: 2,
  },
  emailText: { fontSize: 15, color: "#0F172A", fontWeight: "700" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 8,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
    marginLeft: 4,
  },
  saveBtn: {
    backgroundColor: "#C62828",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    elevation: 3,
    shadowColor: "#C62828",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
  toastContainer: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 50 : 40,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  toastError: {
    backgroundColor: "#DC2626",
    shadowColor: "#DC2626",
  },
  toastSuccess: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
  },
  toastText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 12,
    flex: 1,
  },
});
