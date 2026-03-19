import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useRef, useState } from "react";
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
import { useAuth } from "../../../hooks/AuthContext";
import { api } from "../../../services/api";

const OTPScreen = () => {
  const router = useRouter();
  const { email } = useLocalSearchParams();
  const { setUser } = useAuth() as any;

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  const inputRefs = useRef<Array<TextInput | null>>([]);

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

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== "" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && otp[index] === "" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length < 6) {
      Alert.alert("Incomplete", "Please enter the full 6-digit code.");
      return;
    }

    setIsLoading(true);

    try {
      // 1. Verify OTP with Django
      const response = await api.post("/auth/verify-otp/", {
        email: email,
        otp: code,
      });

      const { tokens, user_id, email: userEmail } = response.data;

      // 2. Securely store the JWT access token
      if (tokens && tokens.access) {
        await SecureStore.setItemAsync("userToken", tokens.access);
      }

      // 3. Auto-Login the user globally! (This works now)
      if (typeof setUser === "function") {
        setUser({ id: user_id, email: userEmail });
      }

      // 4. Slide directly to the Map Dashboard
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

  const handleResend = () => {
    Alert.alert("Code Resent", "A new code has been sent to your email.");
    setTimeLeft(300);
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

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpBox, digit ? styles.otpBoxActive : null]}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleOtpChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              secureTextEntry={false}
            />
          ))}
        </View>

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
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendLink}>Resend</Text>
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
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 24,
  },
  otpBox: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    backgroundColor: "#FFFFFF",
  },
  otpBoxActive: {
    borderColor: "#C62828",
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
