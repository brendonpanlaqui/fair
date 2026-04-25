import { MaterialIcons } from "@expo/vector-icons";
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
  // get the auth functions from context
  const { login, register, continueAsGuest, resendOtp } = useAuth();

  // state to toggle between login and register modes
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // form input states
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // state to track form validation errors
  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // function to switch between login and register modes
  const toggleMode = (mode: "login" | "register") => {
    setIsLogin(mode === "login");
    // clear errors when switching modes
    setErrors({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    });
    // clear passwords for security
    setPassword("");
    setConfirmPassword("");
  };

  // function to validate form inputs before submission
  const validateForm = () => {
    let isValid = true;
    let newErrors = {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
    };

    // basic email format validation
    if (!email.includes("@") || !email.includes(".")) {
      newErrors.email = "Please enter a valid email format";
      isValid = false;
    }

    if (isLogin) {
      // basic validation for login
      if (!password) {
        newErrors.password = "Password is required";
        isValid = false;
      }
    } else {
      // strict modern password validation for registration
      // requires: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
      const strongPasswordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.])[A-Za-z\d@$!%*?&.]{8,}$/;

      if (!strongPasswordRegex.test(password)) {
        newErrors.password =
          "Must contain 8+ characters, uppercase, number, & symbol";
        isValid = false;
      }

      // required fields for registration
      if (!firstName.trim()) {
        newErrors.firstName = "Required";
        isValid = false;
      }
      if (!lastName.trim()) {
        newErrors.lastName = "Required";
        isValid = false;
      }
      // check if passwords match
      if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // handle form submission for login or registration
  const handleSubmit = async () => {
    if (!validateForm()) return;
    setIsLoading(true);

    try {
      if (isLogin) {
        // attempt to log in
        await login(email, password);
        router.replace("/(tabs)");
      } else {
        // attempt to register
        await register(email, password, firstName, lastName);
        Alert.alert(
          "Code Sent!",
          "Check your email for the verification code.",
          [
            {
              text: "OK",
              // navigate to otp screen after successful registration
              onPress: () =>
                router.push({ pathname: "/otp", params: { email } }),
            },
          ],
        );
      }
    } catch (error: any) {
      // 1. check for your exact django response flags
      const requiresOtp = error.response?.data?.requires_otp;
      const unverifiedEmail = error.response?.data?.email || email;
      const backendError = error.response?.data?.error;

      // 2. handle the unverified account case explicitly
      if (isLogin && requiresOtp) {
        setIsLoading(false);

        Alert.alert(
          "Account Not Verified",
          backendError ||
            "You haven't verified your email yet. Would you like us to send a new code?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Send Code & Verify",
              onPress: async () => {
                try {
                  // turn button spinner on while requesting new code
                  setIsLoading(true);
                  await resendOtp(unverifiedEmail);
                  router.push({
                    pathname: "/otp",
                    params: { email: unverifiedEmail },
                  });
                } catch (resendError) {
                  Alert.alert(
                    "Error",
                    "Could not send a new code. Please try again.",
                  );
                } finally {
                  setIsLoading(false);
                }
              },
            },
          ],
        );
        return; // stop execution here
      }

      // 3. handle standard form errors (404 not found, 401 invalid password, etc.)
      const errorMessage =
        backendError ||
        error.response?.data?.email?.[0] ||
        "Authentication failed.";

      // display error on the appropriate field
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
        {/* logo section */}
        <View style={styles.header}>
          <Text style={styles.logoText}>fair</Text>
        </View>

        {/* tabs to switch between login and registration */}
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

        {/* dynamic title and subtitle based on mode */}
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

        {/* form input fields */}
        <View style={styles.formContainer}>
          {/* show first and last name only on registration */}
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

          {/* email field used in both modes */}
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

          {/* password field used in both modes */}
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
          {/* updated helper text to show only on registration */}
          {!isLogin && !errors.password && (
            <Text style={styles.helperText}>
              Minimum of 8 characters, 1 uppercase, 1 number, 1 symbol
            </Text>
          )}

          {/* confirm password only on registration */}
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

          {/* forgot password link only on login */}
          {isLogin && (
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => router.push("/forgot-password")}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* submit button */}
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
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* guest login button */}
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
            size={18}
            color="#0F172A"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      </ScrollView>

      {/* footer with link to switch modes */}
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
    paddingBottom: 30,
  },
  logoText: {
    color: "#C62828",
    fontSize: 32,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8 },
  activeTab: { backgroundColor: "#FFFFFF", elevation: 2 },
  tabText: { fontSize: 14, fontWeight: "600", color: "#64748B" },
  activeTabText: { color: "#C62828", fontWeight: "bold" },
  titleContainer: { marginBottom: 24 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: { fontSize: 15, color: "#64748B" },
  formContainer: { marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between" },
  helperText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: -12,
    marginBottom: 16,
  },
  forgotPassword: { alignSelf: "flex-end", marginTop: -4 },
  forgotPasswordText: { color: "#C62828", fontSize: 14, fontWeight: "700" },
  submitBtn: {
    backgroundColor: "#C62828",
    height: 54,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    elevation: 4,
    shadowColor: "#C62828",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  submitBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
  dividerRow: { flexDirection: "row", alignItems: "center", marginBottom: 24 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E2E8F0" },
  dividerText: {
    marginHorizontal: 16,
    color: "#94A3B8",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  guestBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 54,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
  },
  guestBtnText: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  footerText: { color: "#64748B", fontSize: 14 },
  footerLink: { color: "#C62828", fontSize: 14, fontWeight: "bold" },
});

export default AuthScreen;
