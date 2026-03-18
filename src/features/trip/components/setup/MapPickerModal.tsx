import { isWithinAngelesCity } from "@/src/utils/geofencing";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { PROVIDER_GOOGLE, Region } from "react-native-maps";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

interface Props {
  visible: boolean;
  target: "stopover" | "destination";
  initialLat: number;
  initialLng: number;
  onClose: () => void;
  onConfirm: (lat: number, lng: number, addressName: string) => void;
}

export const MapPickerModal = ({
  visible,
  target,
  initialLat,
  initialLng,
  onClose,
  onConfirm,
}: Props) => {
  const [region, setRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [addressName, setAddressName] = useState("Move map to select location");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // Reverse Geocoding: Turns Lat/Lng into a readable street address
  const fetchAddressName = async (lat: number, lng: number) => {
    setIsFetchingAddress(true);
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_API_KEY}`,
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        // Grab the most relevant street-level address
        setAddressName(data.results[0].formatted_address.split(",")[0]);
      } else {
        setAddressName("Unknown Location");
      }
    } catch (error) {
      setAddressName("Pinned Location");
    } finally {
      setIsFetchingAddress(false);
    }
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    setRegion(newRegion);
    fetchAddressName(newRegion.latitude, newRegion.longitude);
  };

  const handleConfirm = () => {
    if (!isWithinAngelesCity(region.latitude, region.longitude)) {
      Alert.alert(
        "Out of Bounds",
        "Please select a location within Angeles City limits.",
      );
      return;
    }
    onConfirm(region.latitude, region.longitude, addressName);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="close" size={28} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Pin {target === "stopover" ? "Stopover" : "Destination"}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        {/* MAP CONTAINER */}
        <View style={styles.mapContainer}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={true}
          />

          {/* FIXED CENTER PIN (PointerEvents="none" lets touches pass through to the map) */}
          <View style={styles.centerPinContainer} pointerEvents="none">
            <View style={styles.tooltip}>
              <Text style={styles.tooltipText}>Set Location Here</Text>
            </View>
            <MaterialIcons
              name="location-pin"
              size={48}
              color="#E53935"
              style={styles.pinIcon}
            />
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* BOTTOM SHEET */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>SELECTED LOCATION</Text>
          <View style={styles.addressRow}>
            {isFetchingAddress ? (
              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={{ marginRight: 8 }}
              />
            ) : (
              <MaterialIcons
                name="place"
                size={20}
                color="#3B82F6"
                style={{ marginRight: 8 }}
              />
            )}
            <Text style={styles.addressText} numberOfLines={2}>
              {isFetchingAddress ? "Fetching address..." : addressName}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              isFetchingAddress && { backgroundColor: "#94A3B8" },
            ]}
            activeOpacity={0.9}
            onPress={handleConfirm}
            disabled={isFetchingAddress}
          >
            <Text style={styles.confirmBtnText}>Confirm Location</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: "#FFFFFF",
    zIndex: 10,
    elevation: 4,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: "bold", color: "#0F172A" },
  mapContainer: { flex: 1, position: "relative" },

  // Center Pin Styles
  centerPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -50,
    marginTop: -70,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  tooltip: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 4,
  },
  tooltipText: { color: "#FFFFFF", fontSize: 11, fontWeight: "bold" },
  pinIcon: {
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  pinShadow: {
    width: 12,
    height: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.2)",
    marginTop: -4,
  },

  // Footer Styles
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    elevation: 16,
  },
  footerLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#94A3B8",
    letterSpacing: 1,
    marginBottom: 8,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  addressText: { flex: 1, fontSize: 16, fontWeight: "bold", color: "#0F172A" },
  confirmBtn: {
    backgroundColor: "#0F172A",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "bold" },
});
