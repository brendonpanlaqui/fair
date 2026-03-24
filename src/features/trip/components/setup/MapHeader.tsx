import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

interface MapHeaderProps {
  onPlaceSelected: (
    location: { latitude: number; longitude: number },
    name: string,
  ) => void;
  googleApiKey: string;
}

const MapHeader: React.FC<MapHeaderProps> = ({
  onPlaceSelected,
  googleApiKey,
}) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* 1. The Red Top Anchor */}
      <View style={styles.redBackground}>
        <Text style={styles.brandText}>fair</Text>
      </View>

      {/* 2. The Overlapping Search Pill */}
      <View style={styles.searchBarWrapper}>
        <GooglePlacesAutocomplete
          placeholder="Where are you going?"
          fetchDetails={true}
          onPress={(data, details = null) => {
            if (details) {
              onPlaceSelected(
                {
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                },
                data.structured_formatting.main_text,
              );
            }
          }}
          query={{
            key: googleApiKey,
            language: "en",
            components: "country:ph",
            location: "15.1444,120.5928",
            radius: "8000",
            strictbounds: true,
          }}
          styles={{
            container: { flex: 0 },
            textInputContainer: {
              backgroundColor: "#FFFFFF",
              borderRadius: 28, // Fully rounded edges like the mockup
              height: 56,
              flexDirection: "row",
              alignItems: "center",
            },
            textInput: {
              height: 56,
              color: "#0F172A",
              fontSize: 15,
              backgroundColor: "transparent",
              margin: 0,
              padding: 0,
            },
            listView: {
              position: "absolute",
              top: 64,
              left: 0,
              right: 0,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              elevation: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              zIndex: 9999,
            },
            row: { paddingVertical: 14, paddingHorizontal: 16 },
            description: { color: "#0F172A", fontSize: 15 },
            separator: { height: 1, backgroundColor: "#F1F5F9" },
          }}
          textInputProps={{
            placeholderTextColor: "#94A3B8",
            returnKeyType: "search",
          }}
          renderLeftButton={() => (
            <View style={styles.searchIconWrapper}>
              <MaterialIcons name="search" size={24} color="#D32F2F" />
            </View>
          )}
          // Notice we completely removed the right button / microphone here
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  redBackground: {
    backgroundColor: "#D32F2F",
    paddingTop: 55, // Clears the status bar
    paddingBottom: 40, // Creates enough red space for the pill to overlap
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
  },
  brandText: {
    color: "#FFFFFF",
    fontSize: 32,
    fontWeight: "900",
    letterSpacing: -1,
    fontStyle: "italic",
  },
  searchBarWrapper: {
    marginTop: -28, // Pulls the search bar perfectly halfway into the red background
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28, // Fully rounded pill
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    zIndex: 20,
  },
  searchIconWrapper: {
    paddingLeft: 20,
    paddingRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MapHeader;
