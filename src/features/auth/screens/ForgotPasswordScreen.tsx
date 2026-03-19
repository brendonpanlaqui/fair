import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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
import { api } from "../../../services/api";

const ForgotPasswordScreen = () => {
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const handleRequestCode = async () => {
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password/", { email });
      setStep(2);
      Alert.alert(
        "Code Sent!",
        "Check your email (or the terminal) for the reset code.",
      );
    } catch (error) {
      Alert.alert("Error", "Could not send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (otp.length < 6 || newPassword.length < 8) {
      Alert.alert(
        "Incomplete",
        "Please enter the 6-digit code and a new password (min 8 characters).",
      );
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password/", {
        email,
        otp,
        newPassword,
      });

      Alert.alert("Success!", "Your password has been reset.", [
        { text: "Log In", onPress: () => router.replace("/auth") },
      ]);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || "Invalid reset code.";
      Alert.alert("Reset Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.logoText}>fair</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? "Enter your email address and we will send you a 6-digit reset code."
              : "Enter the code we sent to your email and your new password."}
          </Text>
        </View>

        {step === 1 ? (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={styles.inputWrapper}>
              <MaterialIcons
                name="mail-outline"
                size={20}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="name@example.com"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>
        ) : (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>6-Digit Reset Code</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="vpn-key"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={6}
                  value={otp}
                  onChangeText={setOtp}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Min. 8 characters"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons
                    name={showPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
          activeOpacity={0.9}
          onPress={step === 1 ? handleRequestCode : handleResetPassword}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {step === 1 ? "Send Reset Code" : "Update Password"}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { padding: 4, marginLeft: -4 },
  logoText: {
    color: "#C62828",
    fontSize: 28,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  scrollContent: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40 },
  textContainer: { alignItems: "center", marginBottom: 40 },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    height: 56,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
  },
  inputIcon: { marginRight: 12 },
  inputWithIcon: { flex: 1, height: "100%", fontSize: 16, color: "#0F172A" },
  submitBtn: {
    backgroundColor: "#C62828",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    elevation: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});

export default ForgotPasswordScreen;
