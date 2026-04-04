import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { MapPickerModal } from "@/src/features/trip/components/setup/MapPickerModal";
import { useLocationTracking } from "@/src/features/trip/hooks/useLocationTracking";

const STORAGE_KEY = "@fair_saved_places";

interface SavedPlace {
  id: string;
  title: string;
  address: string;
  latitude: number;
  longitude: number;
  icon: string;
  color: string;
  bg: string;
}

export default function SavedPlacesScreen() {
  const router = useRouter();
  const { currentLocation } = useLocationTracking();

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [isMapPickerVisible, setIsMapPickerVisible] = useState(false);

  const [isNamePromptVisible, setIsNamePromptVisible] = useState(false);
  const [customName, setCustomName] = useState("");
  const [pendingPlace, setPendingPlace] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);

  useEffect(() => {
    loadSavedPlaces();
  }, []);

  const loadSavedPlaces = async () => {
    try {
      const storedPlaces = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedPlaces) {
        setSavedPlaces(JSON.parse(storedPlaces));
      }
    } catch (error) {
      console.error("Failed to load saved places", error);
    }
  };

  const savePlacesToStorage = async (newPlaces: SavedPlace[]) => {
    try {
      setSavedPlaces(newPlaces);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newPlaces));
    } catch (error) {
      console.error("Failed to save place", error);
    }
  };

  const handleAddNew = () => {
    setIsMapPickerVisible(true);
  };

  // called when the user confirms a location in the MapPickerModal
  const handleMapConfirm = (lat: number, lng: number, addressName: string) => {
    setIsMapPickerVisible(false);

    // store the picked location in state and open a custom prompt to ask for a name
    const defaultName = addressName.split(",")[0];
    setCustomName(defaultName);

    setPendingPlace({ lat, lng, address: addressName });

    // slight delay to ensure the map picker modal has fully closed before opening the next one
    setTimeout(() => {
      setIsNamePromptVisible(true);
    }, 400);
  };

  // saves the new place with the custom name entered by the user, or a default name if they left it blank
  const handleSaveCustomName = () => {
    if (!pendingPlace) return;

    const newPlace: SavedPlace = {
      id: Date.now().toString(),
      title: customName.trim() || pendingPlace.address.split(",")[0],
      address: pendingPlace.address,
      latitude: pendingPlace.lat,
      longitude: pendingPlace.lng,
      icon: "place",
      color: "#D32F2F",
      bg: "#FFF1F2",
    };

    savePlacesToStorage([...savedPlaces, newPlace]);

    // reset prompt state
    setIsNamePromptVisible(false);
    setPendingPlace(null);
    setCustomName("");
  };

  const handleDeletePlace = (id: string) => {
    const filteredPlaces = savedPlaces.filter((p) => p.id !== id);
    savePlacesToStorage(filteredPlaces);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Places</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.addNewCard}
          activeOpacity={0.7}
          onPress={handleAddNew}
        >
          <View style={styles.addIconBg}>
            <MaterialIcons name="add-location-alt" size={24} color="#D32F2F" />
          </View>
          <View style={styles.addTextContainer}>
            <Text style={styles.addTitle}>Add New Place</Text>
            <Text style={styles.addSubtitle}>
              Save a new destination for quicker booking.
            </Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>YOUR LOCATIONS</Text>

        <View style={styles.listContainer}>
          {savedPlaces.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <MaterialIcons
                name="location-off"
                size={48}
                color="#E2E8F0"
                style={{ marginBottom: 12 }}
              />
              <Text style={styles.emptyStateText}>No saved places yet.</Text>
            </View>
          ) : (
            savedPlaces.map((place, index) => (
              <React.Fragment key={place.id}>
                <View style={styles.placeRow}>
                  <View
                    style={[styles.placeIconBg, { backgroundColor: place.bg }]}
                  >
                    <MaterialIcons
                      name={place.icon as any}
                      size={22}
                      color={place.color}
                    />
                  </View>

                  <View style={styles.placeTextContainer}>
                    <Text style={styles.placeTitle}>{place.title}</Text>
                    <Text
                      style={styles.placeAddress}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {place.address}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.moreBtn}
                    onPress={() => handleDeletePlace(place.id)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <MaterialIcons
                      name="delete-outline"
                      size={22}
                      color="#EF4444"
                    />
                  </TouchableOpacity>
                </View>

                {index < savedPlaces.length - 1 && (
                  <View style={styles.divider} />
                )}
              </React.Fragment>
            ))
          )}
        </View>
      </ScrollView>

      <MapPickerModal
        visible={isMapPickerVisible}
        target="destination"
        initialLat={currentLocation?.latitude || 15.1444}
        initialLng={currentLocation?.longitude || 120.5928}
        onClose={() => setIsMapPickerVisible(false)}
        onConfirm={handleMapConfirm}
      />

      <Modal visible={isNamePromptVisible} transparent animationType="fade">
        <View style={styles.promptOverlay}>
          <View style={styles.promptBox}>
            <Text style={styles.promptTitle}>Name this location</Text>
            <Text style={styles.promptSubtitle}>
              Enter a short title (e.g., Work, Gym, Home)
            </Text>

            <TextInput
              style={styles.promptInput}
              value={customName}
              onChangeText={setCustomName}
              placeholder="My New Place"
              autoFocus={true}
            />

            <View style={styles.promptActions}>
              <TouchableOpacity
                style={styles.promptCancelBtn}
                onPress={() => setIsNamePromptVisible(false)}
              >
                <Text style={styles.promptCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.promptSaveBtn}
                onPress={handleSaveCustomName}
              >
                <Text style={styles.promptSaveText}>Save Place</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },

  scrollContent: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 60 },

  addNewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#FECACA",
    borderStyle: "dashed",
    elevation: 2,
    shadowColor: "#D32F2F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  addIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFF1F2",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  addTextContainer: { flex: 1 },
  addTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#C62828",
    marginBottom: 2,
  },
  addSubtitle: { fontSize: 12, color: "#94A3B8" },

  sectionTitle: {
    fontSize: 12,
    fontWeight: "900",
    color: "#94A3B8",
    marginBottom: 12,
    marginLeft: 8,
    letterSpacing: 1,
  },

  listContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
  },
  placeRow: { flexDirection: "row", alignItems: "center", padding: 16 },
  placeIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  placeTextContainer: { flex: 1, marginRight: 16 },
  placeTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F172A",
    marginBottom: 2,
  },
  placeAddress: { fontSize: 13, color: "#64748B" },
  moreBtn: { padding: 4 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 76 },

  emptyStateContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateText: { color: "#94A3B8", fontWeight: "600", fontSize: 15 },
  promptOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  promptBox: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    width: "100%",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  promptTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 8,
  },
  promptSubtitle: { fontSize: 14, color: "#64748B", marginBottom: 20 },
  promptInput: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#0F172A",
    marginBottom: 24,
  },
  promptActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12 },
  promptCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  promptCancelText: { color: "#64748B", fontSize: 15, fontWeight: "bold" },
  promptSaveBtn: {
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  promptSaveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "bold" },
});
