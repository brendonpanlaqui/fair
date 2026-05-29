import { ANGELES_POLYGON, isWithinAngelesCity } from "@/src/utils/geofencing";
import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Polygon, PROVIDER_GOOGLE, Region } from "react-native-maps";

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
  const mapRef = useRef<MapView>(null);
  const liftAnim = useRef(new Animated.Value(0)).current; // 🚀 For pin animation
  const fetchTimeoutRef = useRef<number | null>(null); // 🚀 For API debouncing

  const [region, setRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [addressName, setAddressName] = useState("Move map to select location");
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);

  // forces map to current location when visible changes
  useEffect(() => {
    if (visible && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: initialLat,
          longitude: initialLng,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        },
        600,
      );
    }
  }, [visible, initialLat, initialLng]);

  // prevent memory leaks if modal closes while fetching
  useEffect(() => {
    return () => {
      if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
    };
  }, []);

  const fetchAddressName = (lat: number, lng: number) => {
    // clear any pending API requests if the user is still moving the map
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }

    setIsFetchingAddress(true);

    // wait 1000ms before hitting the API to prevent rate limits (debouncing)
    fetchTimeoutRef.current = setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          {
            headers: {
              "User-Agent": "FairCommuteApp/1.0",
              "Accept-Language": "en-US,en;q=0.9",
            },
          },
        );
        const data = await response.json();
        if (data && data.address) {
          const address = data.address;
          const shortName =
            address.amenity ||
            address.shop ||
            address.building ||
            address.road ||
            address.neighbourhood ||
            address.suburb ||
            data.name ||
            data.display_name.split(",")[0];
          setAddressName(shortName);
        } else if (data && data.display_name) {
          setAddressName(data.display_name.split(",")[0]);
        } else {
          setAddressName("Unknown Location");
        }
      } catch (error) {
        console.warn("Geocoding error:", error);
        setAddressName("Pinned Location");
      } finally {
        setIsFetchingAddress(false);
      }
    }, 1000);
  };

  const handleRegionChange = () => {
    // lift the pin when map starts moving
    Animated.spring(liftAnim, {
      toValue: -15,
      useNativeDriver: true,
    }).start();
  };

  const handleRegionChangeComplete = (newRegion: Region) => {
    // drop the pin when movement stops
    Animated.spring(liftAnim, {
      toValue: 0,
      useNativeDriver: true,
    }).start();

    setRegion(newRegion);
    fetchAddressName(newRegion.latitude, newRegion.longitude);
  };

  const snapToCurrent = () => {
    mapRef.current?.animateToRegion(
      {
        latitude: initialLat,
        longitude: initialLng,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      600,
    );
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
      <StatusBar barStyle="dark-content" />

      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            Pin {target === "stopover" ? "Stopover" : "Destination"}
          </Text>
          <View style={{ width: 40 }} />
        </View>

        {/* MAP AREA */}
        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={StyleSheet.absoluteFillObject}
            initialRegion={region}
            onRegionChange={handleRegionChange}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation={true}
            showsMyLocationButton={false}
          >
            {/* Shaded background outside of Angeles City */}
            <Polygon
              coordinates={[
                { latitude: 35, longitude: 110 },
                { latitude: 35, longitude: 140 },
                { latitude: -5, longitude: 140 },
                { latitude: -5, longitude: 110 },
              ]}
              holes={[ANGELES_POLYGON]}
              fillColor="rgba(15, 23, 42, 0.15)"
              strokeWidth={0}
              zIndex={1}
            />
            {/* Red outline for Angeles City boundary */}
            <Polygon
              coordinates={ANGELES_POLYGON}
              strokeColor="rgba(211, 47, 47, 0.8)"
              fillColor="transparent"
              strokeWidth={2}
              zIndex={2}
            />
          </MapView>

          {/* SNAP TO ME BUTTON */}
          <TouchableOpacity
            style={styles.myLocationBtn}
            onPress={snapToCurrent}
          >
            <MaterialIcons name="my-location" size={24} color="#0F172A" />
          </TouchableOpacity>

          {/* ANIMATED CENTER PIN */}
          <View style={styles.centerPinContainer} pointerEvents="none">
            <Animated.View
              style={[
                styles.pinWrapper,
                { transform: [{ translateY: liftAnim }] },
              ]}
            >
              <View style={styles.tooltip}>
                <Text style={styles.tooltipText}>SET HERE</Text>
              </View>
              <MaterialIcons name="location-on" size={48} color="#D32F2F" />
            </Animated.View>
            <View style={styles.pinShadow} />
          </View>
        </View>

        {/* FOOTER */}
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>SELECTED ADDRESS</Text>
          <View style={styles.addressRow}>
            {isFetchingAddress ? (
              <ActivityIndicator
                size="small"
                color="#D32F2F"
                style={{ marginRight: 12 }}
              />
            ) : (
              <View style={styles.iconCircle}>
                <MaterialIcons name="place" size={18} color="#D32F2F" />
              </View>
            )}
            <Text style={styles.addressText} numberOfLines={2}>
              {isFetchingAddress ? "Locating..." : addressName}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.confirmBtn,
              isFetchingAddress && { backgroundColor: "#CBD5E1" },
            ]}
            onPress={handleConfirm}
            disabled={isFetchingAddress}
          >
            <Text style={styles.confirmBtnText}>CONFIRM THIS LOCATION</Text>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: -0.5,
  },
  mapContainer: { flex: 1, position: "relative" },

  myLocationBtn: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },

  centerPinContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -50,
    marginTop: -50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  pinWrapper: { alignItems: "center" },
  tooltip: {
    backgroundColor: "#0F172A",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: -4,
  },
  tooltipText: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
  pinShadow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.2)",
    transform: [{ scaleX: 2 }],
    marginTop: -6,
  },

  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94A3B8",
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  addressText: { flex: 1, fontSize: 16, fontWeight: "800", color: "#0F172A" },
  confirmBtn: {
    backgroundColor: "#D32F2F",
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
  },
  confirmBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
});
