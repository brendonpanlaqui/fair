import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

interface PrimaryButtonProps extends TouchableOpacityProps {
  title: string;
  backgroundColor?: string;
  textColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  title,
  backgroundColor = "#1976D2",
  textColor = "#FFFFFF",
  icon,
  style,
  ...props
}) => {
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor }, style]}
      activeOpacity={0.8}
      {...props}
    >
      {icon && (
        <Ionicons name={icon} size={20} color={textColor} style={styles.icon} />
      )}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  text: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  icon: {
    marginRight: 8,
  },
});

export default PrimaryButton;
