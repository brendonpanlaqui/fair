import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";

interface InputFieldProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  error?: string;
  isPassword?: boolean;
}

export const InputField = ({
  label,
  icon,
  error,
  isPassword,
  style,
  ...props
}: InputFieldProps) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputGroup}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[styles.inputWrapper, error ? styles.inputWrapperError : null]}
      >
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            color="#94A3B8"
            style={styles.inputIcon}
          />
        )}
        <TextInput
          style={[styles.inputWithIcon, !icon && { paddingLeft: 16 }, style]}
          placeholderTextColor="#94A3B8"
          secureTextEntry={isPassword && !showPassword}
          autoCapitalize="none"
          {...props}
        />
        {isPassword && (
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
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
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
  inputWrapperError: { borderColor: "#C62828" },
  inputIcon: { marginRight: 12 },
  inputWithIcon: { flex: 1, height: "100%", fontSize: 16, color: "#0F172A" },
  eyeIcon: { padding: 4, marginLeft: 8 },
  errorText: { color: "#C62828", fontSize: 12, marginTop: 8 },
});
