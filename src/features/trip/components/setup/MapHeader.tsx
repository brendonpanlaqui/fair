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
    <View style={styles.topSection}>
      {/* Centered Logo Row */}
      <View style={styles.headerContainer}>
        <View style={{ width: 28 }} />
        <Text style={styles.headerTitle}>fair</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Floating Search Pill */}
      <View style={styles.searchBarContainer}>
        <MaterialIcons
          name="location-on"
          size={24}
          color="#E53935"
          style={styles.searchIcon}
        />

        <GooglePlacesAutocomplete
          placeholder="Where are you going?"
          fetchDetails={true} // Crucial: This gets the actual GPS coordinates
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
            container: { flex: 1 },
            textInputContainer: {
              backgroundColor: "transparent",
              flexDirection: "row",
              alignItems: "center",
            },
            textInput: {
              height: 40,
              color: "#0F172A",
              fontSize: 16,
              backgroundColor: "transparent",
              margin: 0,
              padding: 0,
            },
            // Make the dropdown list float nicely over the map
            listView: {
              position: "absolute",
              top: 50,
              left: -40,
              right: -40,
              backgroundColor: "#FFFFFF",
              borderRadius: 12,
              elevation: 10,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 5,
              zIndex: 20,
            },
            row: { padding: 13, flexDirection: "row", alignItems: "center" },
            separator: { height: 1, backgroundColor: "#E2E8F0" },
          }}
          textInputProps={{
            placeholderTextColor: "#94A3B8",
            returnKeyType: "search",
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  topSection: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#E53935",
    paddingTop: 55,
    paddingBottom: 25,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 10,
    elevation: 8,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    letterSpacing: 1,
    fontStyle: "italic",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 56,
    elevation: 4,
    zIndex: 20,
  },
  searchIcon: { marginRight: 8, marginTop: 8 },
  iconButton: { padding: 4, marginTop: 4 },
});

export default MapHeader;
