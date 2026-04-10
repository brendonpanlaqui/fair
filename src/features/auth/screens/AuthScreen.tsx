import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { InputField } from "../../../components/ui/InputField";
import { useAuth } from "../../../hooks/AuthContext";

const AuthScreen = () => {
  const router = useRouter();
  const { login, register, continueAsGuest } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const toggleMode = (mode: "login" | "register") => {
    setIsLogin(mode === "login");
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    setPassword("");
    setConfirmPassword("");
  };

  const validateForm = () => {
    let isValid = true;
    let newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Please enter a valid email format";
      isValid = false;
    }

    if (password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
      isValid = false;
    }

    if (!isLogin) {
      if (!firstName.trim()) {
        newErrors.firstName = "Required";
        isValid = false;
      }
      if (!lastName.trim()) {
        newErrors.lastName = "Required";
        isValid = false;
      }
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        router.replace("/(tabs)");
      } else {
        await register(email, password, firstName, lastName);
        Alert.alert(
          "Code Sent!",
          "Check your email for the verification code.",
          [
            {
              text: "OK",
              onPress: () =>
                router.push({ pathname: "/otp", params: { email } }),
            },
          ],
        );
      }
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error ||
        error.response?.data?.email?.[0] ||
        "Authentication failed.";
      isLogin
        ? setErrors((prev) => ({ ...prev, password: errorMessage }))
        : setErrors((prev) => ({ ...prev, email: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.logoText}>fair</Text>
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => toggleMode("login")}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => toggleMode("register")}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isLogin ? "Welcome Back" : "Create an account"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Enter your details to access your account."
              : "Fill in your details to get started."}
          </Text>
        </View>

        <View style={styles.formContainer}>
          {!isLogin && (
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <InputField
                  label="First Name"
                  icon="person-outline"
                  placeholder="Juan"
                  value={firstName}
                  onChangeText={(text) => {
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
                  onChangeText={(text) => {
                    setLastName(text);
                    setErrors((prev) => ({ ...prev, lastName: "" }));
                  }}
                  error={errors.lastName}
                />
              </View>
            </View>
          )}

          <InputField
            label="Email Address"
            icon="mail-outline"
            placeholder="name@example.com"
            keyboardType="email-address"
            value={email}
            onChangeText={(text) => {
              setEmail(text);
              setErrors((prev) => ({ ...prev, email: "" }));
            }}
            error={errors.email}
          />

          <InputField
            label="Password"
            icon="lock-outline"
            placeholder="Enter your password"
            isPassword
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              setErrors((prev) => ({ ...prev, password: "" }));
            }}
            error={errors.password}
          />
          {isLogin && !errors.password && (
            <Text style={styles.helperText}>Minimum 8 characters required</Text>
          )}

          {!isLogin && (
            <InputField
              label="Confirm Password"
              icon="lock-outline"
              placeholder="Confirm your password"
              isPassword
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setErrors((prev) => ({ ...prev, confirmPassword: "" }));
              }}
              error={errors.confirmPassword}
            />
          )}

          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, isLoading && { opacity: 0.7 }]}
          activeOpacity={0.9}
          onPress={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>
              {isLogin ? "Sign In" : "Create Account"}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity style={styles.googleBtn} activeOpacity={0.8}>
          <AntDesign
            name="google"
            size={20}
            color="#0F172A"
            style={{ marginRight: 12 }}
          />
          <Text style={styles.googleBtnText}>Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestBtn}
          onPress={() => {
            continueAsGuest();
            router.replace("/(tabs)");
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.guestBtnText}>Continue as Guest</Text>
          <MaterialIcons
            name="arrow-forward"
            size={16}
            color="#64748B"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
        </Text>
        <TouchableOpacity
          onPress={() => toggleMode(isLogin ? "register" : "login")}
        >
          <Text style={styles.footerLink}>
            {isLogin ? "Create Account" : "Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoText: {
    color: "#C62828",
    fontSize: 32,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 40, flexGrow: 1 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 32,
  },
  tab: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#FFFFFF", elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#C62828", fontWeight: "bold" },
  titleContainer: { marginBottom: 32 },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 16, color: "#64748B" },
  formContainer: { marginBottom: 16 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 20,
  },
  forgotPassword: { alignSelf: "flex-end", marginTop: -4 },
  forgotPasswordText: { color: "#C62828", fontSize: 14, fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#C62828",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 32,
    elevation: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 32 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: {
    marginHorizontal: 16,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
  },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  googleBtnText: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
    paddingVertical: 8,
  },
  guestBtnText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 24,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerText: { color: "#64748B", fontSize: 14 },
  footerLink: { color: "#C62828", fontSize: 14, fontWeight: "bold" },
});

export default AuthScreen;
