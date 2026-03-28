import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Mock data: In a real app, this would come from your Django backend or local SQLite
const SAVED_PLACES = [
  {
    id: "1",
    type: "home",
    title: "Home",
    address: "123 Main St, Balibago, Angeles City",
    icon: "home",
    color: "#0284C7",
    bg: "#E0F2FE",
  },
  {
    id: "2",
    type: "school",
    title: "CCA Campus",
    address: "City College of Angeles, Pampanga",
    icon: "school",
    color: "#D32F2F",
    bg: "#FFF1F2",
  },
  {
    id: "3",
    type: "place",
    title: "Nepo Mall",
    address: "St. Joseph St, Angeles City",
    icon: "storefront",
    color: "#D97706",
    bg: "#FEF3C7",
  },
];

export default function SavedPlacesScreen() {
  const router = useRouter();

  const handleAddNew = () => {
    Alert.alert(
      "Add New Place",
      "This will open a map picker to pin your new saved location.",
    );
  };

  const handleEditPlace = (title: string) => {
    Alert.alert("Manage Location", `What would you like to do with ${title}?`, [
      { text: "Edit Address", onPress: () => {} },
      { text: "Delete", style: "destructive", onPress: () => {} },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* HEADER */}
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
        {/* ADD NEW BUTTON */}
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

        {/* SAVED PLACES LIST */}
        <View style={styles.listContainer}>
          {SAVED_PLACES.map((place, index) => (
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
                  onPress={() => handleEditPlace(place.title)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <MaterialIcons name="more-vert" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Add a divider unless it's the last item */}
              {index < SAVED_PLACES.length - 1 && (
                <View style={styles.divider} />
              )}
            </React.Fragment>
          ))}
        </View>
      </ScrollView>
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

  // Add New Card
  addNewCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: "#FECACA", // Subtle red border
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

  // List Container
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
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
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
});
