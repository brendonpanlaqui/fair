import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
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

import { OTPInput } from "../../../components/ui/OTPInput"; // 👈 Update this path if needed
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";

const OTPScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  // 🚀 Pull resendOtp from your context here
  const { setUser, resendOtp } = useAuth() as any;

  const [otpCode, setOtpCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const handleVerify = async () => {
    if (otpCode.length < 6) {
      Alert.alert("Incomplete", "Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/auth/verify-otp/", {
        email: email,
        otp: otpCode,
      });

      const {
        tokens,
        user_id,
        email: userEmail,
        first_name,
        last_name,
      } = response.data;

      if (tokens && tokens.access) {
        await SecureStore.setItemAsync("userToken", tokens.access);
      }

      const userData = { id: user_id, email: userEmail, first_name, last_name };
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));

      if (typeof setUser === "function") {
        setUser(userData);
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      console.error("❌ OTP CRASH:", error);
      const errorMessage =
        error.response?.data?.error || "Invalid verification code.";
      Alert.alert("Verification Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    // 1. Safety check: Don't allow clicking if the timer is still running
    if (timeLeft > 0) return;

    setIsResending(true);

    try {
      // 🚀 2. Use the clean context function instead of manual API call
      await resendOtp(email as string);

      Alert.alert(
        "Code Resent",
        "A new 6-digit code has been sent to your email.",
      );

      // 3. Reset the UI for the new attempt
      setTimeLeft(60); // Start the 5-minute countdown again
      setOtpCode(""); // Clear out the old digits so the boxes are empty
    } catch (error: any) {
      console.error("❌ RESEND CRASH:", error);
      const errorMessage =
        error.response?.data?.error ||
        "Could not resend code. Please try again.";
      Alert.alert("Resend Failed", errorMessage);
    } finally {
      setIsResending(false);
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
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.textContainer}>
          <Text style={styles.title}>Verify Email</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to your email. Enter it below to secure your
            account.
          </Text>
        </View>

        <OTPInput code={otpCode} setCode={setOtpCode} maxLength={6} />

        <View style={styles.timerContainer}>
          <MaterialIcons name="access-time" size={16} color="#64748B" />
          <Text style={styles.timerText}>
            EXPIRES IN {formatTime(timeLeft)}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.verifyBtn, isLoading && { opacity: 0.7 }]}
          activeOpacity={0.9}
          onPress={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.verifyBtnText}>Verify & Continue</Text>
          )}
        </TouchableOpacity>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive code? </Text>
          <TouchableOpacity
            onPress={handleResend}
            disabled={timeLeft > 0 || isResending} // Lock button if counting down OR sending
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text
              style={[
                styles.resendLink,
                (timeLeft > 0 || isResending) && { color: "#94A3B8" }, // Gray out if disabled
              ]}
            >
              {isResending ? "Sending..." : "Resend"}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.securityCard}>
          <View style={styles.shieldIconBg}>
            <MaterialIcons name="verified-user" size={24} color="#C62828" />
          </View>
          <Text style={styles.securityTitle}>Official LGU Security</Text>
          <Text style={styles.securitySubtitle}>
            This multi-factor authentication protects your sensitive data from
            unauthorized access.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFBFD" },
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
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
    alignItems: "center",
  },
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
    paddingHorizontal: 16,
  },
  timerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 40,
  },
  timerText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748B",
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  verifyBtn: {
    backgroundColor: "#C62828",
    width: "100%",
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#C62828",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  verifyBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 48,
  },
  resendText: { fontSize: 14, color: "#64748B" },
  resendLink: { fontSize: 14, fontWeight: "bold", color: "#C62828" },
  securityCard: {
    backgroundColor: "#FFFFFF",
    width: "100%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  shieldIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFEBEE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
  },
  securitySubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    textAlign: "center",
    lineHeight: 20,
  },
});

export default OTPScreen;
