import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router"; // 🚀 Used to refresh data when returning to the screen
import React, { useCallback, useEffect, useRef, useState } from "react";
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
  onChooseOnMap?: () => void;
}

const STORAGE_KEY = "@fair_saved_places";

const MapHeader: React.FC<MapHeaderProps> = ({
  onPlaceSelected,
  onClear,
  hasDestination,
  googleApiKey,
  onChooseOnMap,
}) => {
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);

  // 🚀 1. Fetch saved places every time this header comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadSavedPlaces = async () => {
        try {
          const stored = await AsyncStorage.getItem(STORAGE_KEY);
          if (stored) {
            setSavedPlaces(JSON.parse(stored));
          }
        } catch (error) {
          console.error("Failed to load saved places in header", error);
        }
      };
      loadSavedPlaces();
    }, []),
  );

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

  // 🚀 2. Format the saved places so Google Places can read them
  const predefinedPlaces = savedPlaces.map((place) => ({
    description: place.title, // Required by the library
    geometry: { location: { lat: place.latitude, lng: place.longitude } },
    // Inject our custom data to trick the renderer
    structured_formatting: {
      main_text: place.title,
      secondary_text: place.address,
    },
    isSavedPlace: true,
    customIcon: place.icon,
    customColor: place.color,
    customBg: place.bg,
  })) as any[];

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
          // 🚀 3. Inject the formatted saved places!
          predefinedPlaces={predefinedPlaces}
          predefinedPlacesAlwaysVisible={true} // Shows them before typing
          onPress={(data: any, details = null) => {
            // Predefined places sometimes pass the geometry directly in `data` or `details`
            const lat =
              details?.geometry?.location?.lat || data?.geometry?.location?.lat;
            const lng =
              details?.geometry?.location?.lng || data?.geometry?.location?.lng;
            const name =
              data?.structured_formatting?.main_text || data.description;

            if (lat && lng) {
              onPlaceSelected({ latitude: lat, longitude: lng }, name);
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
          renderRow={(rowData: any) => {
            // 🚀 4. Check if this row is a Saved Place or a normal Google result
            const isSaved = rowData.isSavedPlace;
            const title =
              rowData.structured_formatting?.main_text || rowData.description;
            const subtitle =
              rowData.structured_formatting?.secondary_text ||
              "Angeles City, Pampanga";

            return (
              <View style={styles.customRow}>
                <View
                  style={[
                    styles.rowIconContainer,
                    isSaved && { backgroundColor: rowData.customBg }, // Apply custom Bg!
                  ]}
                >
                  <MaterialIcons
                    name={isSaved ? rowData.customIcon : "location-on"}
                    size={20}
                    color={isSaved ? rowData.customColor : "#94A3B8"} // Apply custom color!
                  />
                </View>
                <View style={styles.rowTextContainer}>
                  <Text style={styles.rowTitle} numberOfLines={1}>
                    {title}
                  </Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
              </View>
            );
          }}
          // @ts-ignore
          ListHeaderComponent={() => (
            <TouchableOpacity
              style={styles.chooseOnMapBtn}
              activeOpacity={0.8}
              onPress={() => {
                Keyboard.dismiss();
                if (onChooseOnMap) {
                  setTimeout(() => onChooseOnMap(), 300);
                }
              }}
            >
              <View style={styles.chooseOnMapIconBg}>
                <MaterialIcons name="place" size={20} color="#D32F2F" />
              </View>
              <View>
                <Text style={styles.chooseOnMapTitle}>Choose on Map</Text>
                <Text style={styles.chooseOnMapSubtext}>
                  Pinpoint your exact location
                </Text>
              </View>
              <MaterialIcons
                name="chevron-right"
                size={24}
                color="#CBD5E1"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          )}
          styles={{
            container: { flex: 0 },
            textInputContainer: {
              backgroundColor: "#F8FAFC",
              borderRadius: 16,
              paddingHorizontal: 12,
              borderWidth: 1,
              borderColor: "#E2E8F0",
              flexDirection: "row",
              alignItems: "center",
              height: 56,
            },
            textInput: {
              height: 52,
              color: "#0F172A",
              fontSize: 16,
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
              borderRadius: 16,
              elevation: 8,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              zIndex: 9999,
              paddingVertical: 8,
            },
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
            <MaterialIcons
              name="search"
              size={22}
              color="#94A3B8"
              style={{ marginRight: 8, marginLeft: 4 }}
            />
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
  // ... (Keep your exact existing styles here)
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
    zIndex: 20,
  },
  clearIconWrapper: {
    paddingRight: 8,
    paddingLeft: 12,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  chooseOnMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    marginBottom: 8,
  },
  chooseOnMapIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  chooseOnMapTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#D32F2F",
    marginBottom: 2,
  },
  chooseOnMapSubtext: {
    fontSize: 13,
    color: "#64748B",
    fontWeight: "500",
  },
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
    fontWeight: "800",
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
