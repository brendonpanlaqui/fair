import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Keyboard,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  GooglePlacesAutocomplete,
  GooglePlacesAutocompleteRef,
} from "react-native-google-places-autocomplete";

interface MapHeaderProps {
  onPlaceSelected: (
    location: { latitude: number; longitude: number },
    name: string,
  ) => void;
  onClear: () => void;
  hasDestination: boolean;
  googleApiKey: string;
}

const MapHeader: React.FC<MapHeaderProps> = ({
  onPlaceSelected,
  onClear,
  hasDestination,
  googleApiKey,
}) => {
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);

  useEffect(() => {
    if (!hasDestination) {
      autocompleteRef.current?.setAddressText("");
      autocompleteRef.current?.clear();
    }
  }, [hasDestination]);

  const handleClear = () => {
    Keyboard.dismiss();
    autocompleteRef.current?.setAddressText("");
    autocompleteRef.current?.clear();
    onClear();
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
      <View style={styles.redBackground}>
        <Text style={styles.brandText}>fair</Text>
      </View>

      <View style={styles.searchBarWrapper}>
        <GooglePlacesAutocomplete
          ref={autocompleteRef}
          enablePoweredByContainer={false}
          placeholder="Where are you going?"
          debounce={400}
          minLength={2}
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
            location: "15.1444,120.5928", // Angeles City coordinates
            radius: "8000",
            strictbounds: true,
          }}
          // 🚀 THE UI/UX UPGRADE: Custom rendering for every list item
          renderRow={(rowData) => {
            const title = rowData.structured_formatting.main_text;
            const subtitle = rowData.structured_formatting.secondary_text;

            return (
              <View style={styles.customRow}>
                <View style={styles.rowIconContainer}>
                  <MaterialIcons name="location-on" size={20} color="#94A3B8" />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {subtitle || "Angeles City, Pampanga"}
                  </Text>
                </View>
              </View>
            );
          }}
          styles={{
            container: { flex: 0 },
            textInputContainer: {
              backgroundColor: "#FFFFFF",
              borderRadius: 28,
              height: 56,
              flexDirection: "row",
              alignItems: "center",
            },
            textInput: {
              height: 56,
              color: "#0F172A",
              fontSize: 16,
              fontWeight: "450",
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
              borderRadius: 16, // Upgraded from 12 to 16
              elevation: 8,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              zIndex: 9999,
              paddingVertical: 8, // Gives the list breathing room
            },
            // Overriding the default row padding so our custom row handles it
            row: {
              paddingVertical: 0,
              paddingHorizontal: 0,
            },
            separator: {
              height: 1,
              backgroundColor: "#F1F5F9",
              marginHorizontal: 16,
            },
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
          renderRightButton={() =>
            hasDestination ? (
              <TouchableOpacity
                style={styles.clearIconWrapper}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <MaterialIcons name="cancel" size={22} color="#94A3B8" />
              </TouchableOpacity>
            ) : null
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  redBackground: {
    backgroundColor: "#D32F2F",
    paddingTop: 55,
    paddingBottom: 40,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
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
    marginTop: -28,
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    elevation: 8,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    zIndex: 20,
  },
  searchIconWrapper: {
    paddingLeft: 20,
    paddingRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  clearIconWrapper: {
    paddingRight: 16,
    paddingLeft: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },

  // 🚀 NEW: CUSTOM ROW STYLES
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  rowTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 2,
  },
  rowSubtitle: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
});

export default MapHeader;
