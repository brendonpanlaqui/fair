import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";

interface ElevatedCardProps extends ViewProps {
  backgroundColor?: string;
}

const ElevatedCard: React.FC<ElevatedCardProps> = ({
  children,
  backgroundColor = "#FFFFFF",
  style,
  ...props
}) => {
  return (
    <View style={[styles.card, { backgroundColor }, style]} {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 12,
    elevation: 4, // Android shadow
    shadowColor: "#000000", // iOS shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    marginBottom: 20,
  },
});

export default ElevatedCard;
