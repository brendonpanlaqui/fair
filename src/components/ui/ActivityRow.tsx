import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface ActivityRowProps {
  label: string;
  description: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
}

const ActivityRow: React.FC<ActivityRowProps> = ({
  label,
  description,
  iconName = "checkmark-circle",
  iconColor = "#4CAF50",
}) => {
  return (
    <View style={styles.row}>
      <View style={styles.labelBadge}>
        <Text style={styles.labelText}>{label}</Text>
      </View>
      <Text style={styles.descriptionText} numberOfLines={1}>
        {description}
      </Text>
      <Ionicons name={iconName} size={20} color={iconColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  labelBadge: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 12,
    width: 85, // Keeps the layout aligned like a table
  },
  labelText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#555555",
    textAlign: "center",
  },
  descriptionText: {
    flex: 1,
    fontSize: 14,
    color: "#333333",
    fontWeight: "500",
  },
});

export default ActivityRow;
