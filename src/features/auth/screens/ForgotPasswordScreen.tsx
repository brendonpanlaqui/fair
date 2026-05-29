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
  TouchableOpacity,
  View,
} from "react-native";
import { InputField } from "../../../components/ui/InputField";
import { api } from "../../../services/api";

const ForgotPasswordScreen = () => {
  const router = useRouter();

  // track the current step of the password reset process
  // enter email -> receive code -> enter code + new password
  const [step, setStep] = useState<1 | 2>(1);
  const [isLoading, setIsLoading] = useState(false);

  // form inputs for both steps
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // requests verification code to be sent to the user's email for password reset
  const handleRequestCode = async () => {
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setIsLoading(true);
    try {
      // send OTP request to backend, which will handle sending the email to the user
      await api.post("/auth/forgot-password/", { email });
      setStep(2); // next step
      Alert.alert("Code Sent!", "Check your email for the reset code.");
    } catch (error) {
      // if email did not exist or network issue
      Alert.alert("Error", "Could not send reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // resetting the password
  const handleResetPassword = async () => {
    // validate OTP and new password before sending to backend
    if (otp.length < 6 || newPassword.length < 8) {
      Alert.alert(
        "Incomplete",
        "Please enter the 6-digit code and a new password (min 8 characters).",
      );
      return;
    }
    setIsLoading(true);
    try {
      // send to backend to complete process
      await api.post("/auth/reset-password/", { email, otp, newPassword });
      Alert.alert("Success!", "Your password has been reset.", [
        // back to login screen after successful reset
        { text: "Log In", onPress: () => router.replace("/auth") },
      ]);
    } catch (error: any) {
      // if expired or invalid OTP
      Alert.alert(
        "Reset Failed",
        error.response?.data?.error || "Invalid reset code.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.logoText}>fair</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* dynamic content based on the current step */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {step === 1
                ? "Enter your email address and we will send you a 6-digit reset code."
                : "Enter the code we sent to your email and your new password."}
            </Text>
          </View>

          {/* input fields for both step */}
          {step === 1 ? (
            <InputField
              label="Email Address"
              icon="mail-outline"
              placeholder="name@example.com"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          ) : (
            <>
              <InputField
                label="6-Digit Reset Code"
                icon="vpn-key"
                placeholder="123456"
                keyboardType="number-pad"
                maxLength={6}
                value={otp}
                onChangeText={setOtp}
              />
              <InputField
                label="New Password"
                icon="lock-outline"
                placeholder="Min. 8 characters"
                isPassword
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </>
          )}

          {/* dynamic submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
            activeOpacity={0.9}
            // call appropriate handler based on step, and disable while loading to prevent multiple requests
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
    </View>
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
