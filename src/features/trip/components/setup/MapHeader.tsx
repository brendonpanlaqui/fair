import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "expo-router";
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

// 🚀 SECURITY UPGRADE: Generate a random string to act as our Session Token
const generateSessionToken = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

const MapHeader: React.FC<MapHeaderProps> = ({
  onPlaceSelected,
  onClear,
  hasDestination,
  googleApiKey,
  onChooseOnMap,
}) => {
  const autocompleteRef = useRef<GooglePlacesAutocompleteRef>(null);
  const [savedPlaces, setSavedPlaces] = useState<any[]>([]);

  // 🚀 Initialize the session token
  const [sessionToken, setSessionToken] = useState(generateSessionToken());

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

  const predefinedPlaces = savedPlaces.map((place) => ({
    description: place.title,
    geometry: { location: { lat: place.latitude, lng: place.longitude } },
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

      <View style={styles.searchBarWrapper} pointerEvents="box-none">
        <GooglePlacesAutocomplete
          ref={autocompleteRef}
          enablePoweredByContainer={false}
          placeholder="Where are you going?"
          debounce={800} // Keeps API calls low while typing
          minLength={2}
          GooglePlacesDetailsQuery={{
            fields: "geometry,name", // STRICTLY fetches only needed data
          }}
          fetchDetails={true}
          predefinedPlaces={predefinedPlaces}
          predefinedPlacesAlwaysVisible={true}
          onPress={(data: any, details = null) => {
            const lat =
              details?.geometry?.location?.lat || data?.geometry?.location?.lat;
            const lng =
              details?.geometry?.location?.lng || data?.geometry?.location?.lng;
            const name =
              data?.structured_formatting?.main_text || data.description;

            if (lat && lng) {
              onPlaceSelected({ latitude: lat, longitude: lng }, name);

              // 🚀 SECURITY UPGRADE: Refresh the token AFTER a successful search
              // This ensures the next search starts a brand new billing session.
              setSessionToken(generateSessionToken());
            }
          }}
          query={{
            key: googleApiKey,
            language: "en",
            components: "country:ph",
            location: "15.1444,120.5928",
            radius: "8000",
            strictbounds: true,
            sessiontoken: sessionToken, // 🚀 Binds all keystrokes to one billable event
          }}
          renderRow={(rowData: any) => {
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
                    isSaved && { backgroundColor: rowData.customBg },
                  ]}
                >
                  <MaterialIcons
                    name={isSaved ? rowData.customIcon : "location-on"}
                    size={20}
                    color={isSaved ? rowData.customColor : "#94A3B8"}
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
              elevation: 4,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
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
              elevation: 10,
              shadowColor: "#0F172A",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
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

        {!hasDestination && (
          <TouchableOpacity
            style={styles.standaloneChooseOnMapBtn}
            activeOpacity={0.8}
            onPress={() => {
              Keyboard.dismiss();
              if (onChooseOnMap) {
                setTimeout(() => onChooseOnMap(), 100);
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
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
  redBackground: {
    backgroundColor: "#D32F2F",
    paddingTop: 60,
    paddingBottom: 45,
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
  standaloneChooseOnMapBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 3,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
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
    color: "#0F172A",
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
