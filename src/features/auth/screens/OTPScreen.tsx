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

import { OTPInput } from "../../../components/ui/OTPInput";
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";

const OTPScreen = () => {
  const router = useRouter();
  // get the parameter passed from the previous screen (email address) to know which account we're verifying
  const { email } = useLocalSearchParams();
  const { setUser, resendOtp } = useAuth() as any;

  // state to hold the OTP code entered by the user (6 digits)
  const [otpCode, setOtpCode] = useState("");
  // manage loading states for both verifying the OTP and resending it, to provide user feedback and prevent multiple submissions
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  // manage the 60-second countdown timer for OTP expiration
  const [timeLeft, setTimeLeft] = useState(60);

  // countdown timer effect
  useEffect(() => {
    if (timeLeft <= 0) return;
    // decrese the timer every second until it reaches 0, at which point the user can request a new OTP
    const timerId = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timerId); // cleaner to prevent memory leaks if the component unmounts before timer finishes
  }, [timeLeft]);

  // format to minutes:seconds for display in the UI, e.g. "01:00"
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // submit the entered OTP code to the backend for verification
  const handleVerify = async () => {
    // ensure the user has entered a full 6-digit code before sending to backend
    if (otpCode.length < 6) {
      Alert.alert("Incomplete", "Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      // post to backend to verify, which returns user data and tokens if successful (or an error if invalid/expired)
      const response = await api.post("/auth/verify-otp/", {
        email: email,
        otp: otpCode,
      });

      // destructure the relevant data from the response for storing and updating auth state
      const {
        tokens,
        user_id,
        email: userEmail,
        first_name,
        last_name,
      } = response.data;

      // store jwt access token securely for authenticated requests in the future
      if (tokens && tokens.access) {
        await SecureStore.setItemAsync("userToken", tokens.access);
      }
      if (tokens && tokens.refresh) {
        await SecureStore.setItemAsync("refreshToken", tokens.refresh);
      }

      // basic data to identify the user in the app, stored securely and also set in global context for easy access across the app
      const userData = { id: user_id, email: userEmail, first_name, last_name };
      await SecureStore.setItemAsync("userData", JSON.stringify(userData));

      // update global auth context with the logged-in user's data so that other components can access it and know the user is authenticated
      if (typeof setUser === "function") {
        setUser(userData);
      }

      router.replace("/(tabs)");
    } catch (error: any) {
      // display an error
      const errorMessage =
        error.response?.data?.error || "Invalid verification code.";
      Alert.alert("Verification Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // request new code to be sent
  const handleResend = async () => {
    // prevent resend if the timer is still active, as the user should wait until the current code expires before requesting a new one
    if (timeLeft > 0) return;

    setIsResending(true);

    try {
      // reuse function for backend endpoint
      await resendOtp(email as string);

      Alert.alert(
        "Code Resent",
        "A new 6-digit code has been sent to your email.",
      );

      // reset UI for new code
      setTimeLeft(60); // 1-minute coundown
      setOtpCode("");
    } catch (error: any) {
      // if the resend limit is reached or network fails
      const errorMessage =
        error.response?.data?.error ||
        "Could not resend code. Please try again.";
      Alert.alert("Resend Failed", errorMessage);
    } finally {
      setIsResending(false);
    }
  };

  return (
    // to avoid keyboard covering of input fields
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
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.textContainer}>
            <Text style={styles.title}>Verify Email</Text>
            <Text style={styles.subtitle}>
              We sent a 6-digit code to your email. Enter it below to secure
              your account.
            </Text>
          </View>

          {/* boxes to enter OTP */}
          <OTPInput code={otpCode} setCode={setOtpCode} maxLength={6} />

          {/* display the active countdown timer */}
          <View style={styles.timerContainer}>
            <MaterialIcons name="access-time" size={16} color="#64748B" />
            <Text style={styles.timerText}>
              EXPIRES IN {formatTime(timeLeft)}
            </Text>
          </View>

          {/* verify button */}
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

          {/* resend when timer hits 0 */}
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
    </View>
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
