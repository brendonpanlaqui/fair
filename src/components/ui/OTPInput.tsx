import React, { useRef, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

interface OTPInputProps {
  code: string;
  setCode: (code: string) => void;
  maxLength: number;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  code,
  setCode,
  maxLength,
}) => {
  const hiddenInputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(true);

  // Creates an empty array of the correct length to map our visual boxes
  const boxArray = new Array(maxLength).fill(0);

  const handlePress = () => {
    hiddenInputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      {/* 1. VISUAL BOXES */}
      <Pressable style={styles.inputsContainer} onPress={handlePress}>
        {boxArray.map((_, index) => {
          const digit = code[index] || "";

          // Determine which box should have the red "active" border
          const isCurrentBox =
            index === code.length ||
            (index === maxLength - 1 && code.length === maxLength);
          const activeStyle =
            isFocused && isCurrentBox ? styles.boxActive : null;

          return (
            <View key={index} style={[styles.box, activeStyle]}>
              <Text style={styles.boxText}>{digit}</Text>
            </View>
          );
        })}
      </Pressable>

      {/* 2. THE REAL, HIDDEN TEXT INPUT */}
      <TextInput
        ref={hiddenInputRef}
        value={code}
        onChangeText={setCode}
        maxLength={maxLength}
        keyboardType="number-pad"
        textContentType="oneTimeCode" // 🚀 Tells iOS/Android to listen for SMS codes!
        style={styles.hiddenInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: "100%",
    marginBottom: 24,
  },
  inputsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  box: {
    width: 48,
    height: 56,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  boxActive: {
    borderColor: "#C62828", // Your brand red
  },
  boxText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0F172A",
  },
  hiddenInput: {
    position: "absolute",
    width: 1,
    height: 1,
    opacity: 0,
  },
});
