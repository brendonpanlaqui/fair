import { AntDesign, MaterialIcons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

// Import the Auth Context we created
import { useAuth } from "../../../hooks/AuthContext"; // Adjust path if needed

const AuthScreen = () => {
  const router = useRouter();
  const { login, register } = useAuth(); // Assuming you add register to your AuthContext

  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // New state for Django UserProfile matching
  const [userType, setUserType] = useState("Regular");
  const userTypes = ["Regular", "Student", "Senior", "PWD"];

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const toggleMode = (mode: "login" | "register") => {
    setIsLogin(mode === "login");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");
    setPassword("");
    setConfirmPassword("");
  };

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!email.includes("@") || !email.includes(".")) {
      setEmailError("Please enter a valid email format");
      isValid = false;
    }

    if (password.length < 8) {
      setPasswordError("Minimum 8 characters required");
      isValid = false;
    }

    if (!isLogin && password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      if (isLogin) {
        // --- LOGIN FLOW ---
        await login(email, password);
        // If AuthContext doesn't handle navigation automatically, keep this:
        router.replace("/(tabs)");
      } else {
        // --- REGISTRATION FLOW ---
        // Pass the extra fields needed for your Django extended UserProfile
        await register(email, password, firstName, lastName, userType);

        Alert.alert(
          "Success",
          "Your account has been created! You can now log in.",
          [{ text: "OK", onPress: () => toggleMode("login") }],
        );
      }
    } catch (error: any) {
      if (isLogin) {
        setPasswordError(error.response?.data?.detail || "Invalid credentials");
      } else {
        setEmailError(
          error.response?.data?.email?.[0] ||
            "Registration failed. Email may exist.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    router.replace("/");
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior="height">
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <MaterialIcons name="close" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.logoText}>fair</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, isLogin && styles.activeTab]}
            onPress={() => toggleMode("login")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, isLogin && styles.activeTabText]}>
              Sign In
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, !isLogin && styles.activeTab]}
            onPress={() => toggleMode("register")}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>
              Create Account
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            {isLogin ? "Welcome back" : "Create an account"}
          </Text>
          <Text style={styles.subtitle}>
            {isLogin
              ? "Enter your details to access your account."
              : "Fill in your details to get started."}
          </Text>
        </View>
        <View style={styles.formContainer}>
          {!isLogin && (
            <>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <View style={styles.inputWrapper}>
                    <MaterialIcons
                      name="person-outline"
                      size={20}
                      color="#94A3B8"
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.inputWithIcon}
                      placeholder="Juan"
                      placeholderTextColor="#94A3B8"
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <View style={styles.inputWrapper}>
                    <TextInput
                      style={[styles.inputWithIcon, { paddingLeft: 16 }]}
                      placeholder="Dela Cruz"
                      placeholderTextColor="#94A3B8"
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              {/* NEW: User Type Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Passenger Type</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.typeContainer}
                >
                  {userTypes.map((type) => (
                    <TouchableOpacity
                      key={type}
                      style={[
                        styles.typeChip,
                        userType === type && styles.typeChipActive,
                      ]}
                      onPress={() => setUserType(type)}
                    >
                      <Text
                        style={[
                          styles.typeChipText,
                          userType === type && styles.typeChipTextActive,
                        ]}
                      >
                        {type}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                {userType !== "Regular" && (
                  <Text style={styles.helperText}>
                    You will need to upload your valid ID (e.g., CCA Student ID,
                    Senior ID) later to verify your discount.
                  </Text>
                )}
              </View>
            </>
          )}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                emailError ? styles.inputWrapperError : null,
              ]}
            >
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
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
              />
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View
              style={[
                styles.inputWrapper,
                passwordError ? styles.inputWrapperError : null,
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={20}
                color="#94A3B8"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.inputWithIcon}
                placeholder="Enter your password"
                placeholderTextColor="#94A3B8"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <MaterialIcons
                  name={showPassword ? "visibility" : "visibility-off"}
                  size={20}
                  color="#94A3B8"
                />
              </TouchableOpacity>
            </View>
            {isLogin && (
              <Text
                style={passwordError ? styles.errorText : styles.helperText}
              >
                {passwordError || "Minimum 8 characters required"}
              </Text>
            )}
            {!isLogin && passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>
          {!isLogin && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View
                style={[
                  styles.inputWrapper,
                  confirmPasswordError ? styles.inputWrapperError : null,
                ]}
              >
                <MaterialIcons
                  name="lock-outline"
                  size={20}
                  color="#94A3B8"
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.inputWithIcon}
                  placeholder="Confirm your password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    setConfirmPasswordError("");
                  }}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                >
                  <MaterialIcons
                    name={showConfirmPassword ? "visibility" : "visibility-off"}
                    size={20}
                    color="#94A3B8"
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>
          )}
          {isLogin && (
            <TouchableOpacity style={styles.forgotPassword}>
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
          onPress={handleGuestMode}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  closeBtn: { padding: 4, marginLeft: -4 },
  logoText: {
    color: "#D32F2F",
    fontSize: 26,
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
  activeTabText: { color: "#D32F2F", fontWeight: "bold" },
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
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "700", color: "#0F172A", marginBottom: 8 },

  // NEW STYLES FOR PASSENGER TYPE CHIPS
  typeContainer: { flexDirection: "row", marginBottom: 4 },
  typeChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  typeChipActive: {
    backgroundColor: "#FEF2F2",
    borderColor: "#D32F2F",
  },
  typeChipText: { color: "#64748B", fontWeight: "600", fontSize: 14 },
  typeChipTextActive: { color: "#D32F2F" },

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
  inputWrapperError: { borderColor: "#D32F2F" },
  inputIcon: { marginRight: 12 },
  inputWithIcon: { flex: 1, height: "100%", fontSize: 16, color: "#0F172A" },
  eyeIcon: { padding: 4, marginLeft: 8 },
  helperText: { color: "#64748B", fontSize: 12, marginTop: 8 },
  errorText: { color: "#D32F2F", fontSize: 12, marginTop: 8 },
  forgotPassword: { alignSelf: "flex-end", marginTop: -4 },
  forgotPasswordText: { color: "#D32F2F", fontSize: 14, fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#D32F2F",
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
  footerLink: { color: "#D32F2F", fontSize: 14, fontWeight: "bold" },
});

export default AuthScreen;
