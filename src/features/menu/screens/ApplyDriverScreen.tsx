import { MaterialIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { api } from "../../../services/api";

// Real Angeles City TODA Branches
const ANGELES_TODAS = [
  "BOTDA (Balibago)",
  "SMH TODA (SM Clark)",
  "MCTODA (Clarkview)",
  "SV TODA (Pampang)",
  "FCC TODA (Capaya)",
  "MPMNCH TODA (Marquee)",
  "Independent / Other",
  "CBSNVTODA (Cutud Bagong Silang Northville)",
  "PCERPVTODA (Pulung Cacutud EPZA Punta Verde)",
  "NLEC (Pulung Cacutud)",
  "DPECENTRO (Pulmar Cento)",
  "PUL-MARTODA (Pulung Maragul)",
  "SIPATODA (Sitio Pader Balibago)",
  "SPTODA (Sapalibutad)",
  "CAMEGATODA (Capaya Metrogate)",
  "C1 TODA (Capaya Uno)",
  "Fiesta Community TODA (Capaya)",
  "RDGTODA (R. De Guzman)",
  "RECTODA (Claro M. Recto)",
  "AUFTODA (Angeles University Foundation)",
  "DAGTODA (Dagohoy Street)",
  "ESPELETA TODA (Espeleta)",
  "FOTDA (Fajardo Street)",
  "MITODA (Mining)",
  "NATDA (Ninoy Aquino Tricycle Driver's Association)",
  "Jaoville Pandan TODA",
  "CCPOTDA (Citicenter Pandan)",
  "SIPTODA (San Ignacio Pandan)",
  "SSTODA (Spring Side)",
  "MANATODA (Magnolia Nazarene)",
  "SAFDA (Salapungan Fajardo)",
  "DBSTODA (Dona Belen Sto. Cristo)",
  "BELENTODA (MS. Belen)",
  "MHTODA (Marcos Highway)",
  "SCMLQTODA (Sto. Cristo Manuel L. Quezon)",
  "VSTODA (Villa Siete)",
  "BTFCTODA (Barangay Tabun Fiesta Community)",
  "PGTODA (Pandan Grotto)",
  "PTACHSTODA (Pandan Tabun Angeles City High School)",
  "REMTODA (Remedian)",
  "BERNAS TODA (San Nicolas)",
  "PINEROSE TODA (San Nicolas)",
  "SNPMTODA (San Nicolas Public Market)",
  "J&C TODA (Sto. Cristo)",
  "PAMANA TODA (Sto. Cristo)",
  "S.C. TODA (Sto. Cristo)",
  "BATIS TODA (Batis Asul)",
  "UKPTDAI / EPTDAI (Essel Park)",
  "LLMTODA (L&S Leoncia Mansfield)",
  "PALTODA (Palmera)",
  "SANATODA (San Angelo)",
  "SDACTODA (Sto. Domingo Angeles City)",
  "VATODAI (Villa Angela)",
  "UCPBTODA (United Coconut Planter's Bank)",
  "HAU-VTTODA (Holy Angel University Villa Teresa)",
  "NEMATODA (Nepomart)",
  "AIRLAND TODA (Airland)",
  "ADREMTODA (Agapito Del Rosario E. Mallari)",
  "CHARMSTODA (Charms)",
  "JOJUTODA (Joju)",
  "MATDA (Montoya Amglo)",
  "VAL-HEN TODA (Valdez Henson)",
  "BPGTODA (Burgos Plaridel Gamboa)",
  "BPTODA (Burgos Plaridel)",
  "KPTODA (Kuliat Plaridel)",
  "APUTODA (Apu)",
  "PNRTODA (Philippine National Railway)",
  "CDGVTODA (C. Dayrit G. Valdez)",
  "ELCATODA (Elcano)",
  "LAMITODA (Lakandula Miranda)",
  "LPTODA (La Pieta)",
  "PBTODA (Pulung Bulu)",
  "SMACTODA (Sitio Manga Angeles City)",
  "SVMTODA (Sun Valley Mabatu)",
  "TJTODA (Torres Jesus)",
  "LANETODA (Lakandula Nepomuceno)",
  "SJFLATODA (San Jose F. Lazatin)",
  "VATDA (Villa Angelina)",
  "VG TODA (Villa Gloria)",
  "AMSIC ANGELES TODA (Amsic Anunas)",
  "AMP2TODA (Amsic Plaridel 2)",
  "ATDA (Anunas)",
  "CAVTODA (Clark Avenue)",
  "P2FVTODA (Plaridel 2 Friendship Villasol)",
  "VGTODA (Volga)",
  "1884SCTA TODA (1884 Santol Clark)",
  "BATDAI (Bangkal Apalit)",
  "COSTODA (Clarkton Oasis)",
  "EPTODA (Esperanza Pineda)",
  "FELIZA TODA (Feliza)",
  "HPTODA (Hensonville Plaza)",
  "JOSEFA TODA (Josefa)",
  "LCMTODA (Lanzones Clark Malabanias)",
  "PCMTODA (Plaridel Clarkview Malabanias)",
  "SACABA TODA (Sacaba)",
  "SM CUEVAS TODA (SM Cuevas)",
  "ZEPPELIN TODA (Zeppelin)",
  "SM Hypermarket TODA",
  "BAMADECA TODA (Margot)",
  "SABATODA (Sapang Bato)",
  "CUTODA (Cuayan)",
  "BBTODA (Bagong Bayan)",
  "CATODA (Carmenville)",
  "CPTODA (Cut Cut Proper)",
  "HFVTODA (Holy Family Village)",
  "HMBSTODA (Holy Mary Bagong Silang)",
  "N3TODA (Nepo 3)",
  "NCTODA (Nepo Corazon)",
  "NSTODA (Nepo Sylvia)",
  "PCRTODA (Paradise Camia Road)",
  "RETODAI (Rizal Extension)",
  "ROTODA (Robin)",
  "SRTODA (Sylvia Rosal)",
  "SPVTODA (Saint Peter Village)",
  "SVMETODA (Sunset Valley Mansion Extension)",
  "KSFTODA (Kalayaan San Francisco)",
  "LNWTODA (Lourdes North West)",
  "RDRTODA (R.D Reyes)",
  "SFTODA (San Francisco)",
  "MPTODA (Malabanias Palace)",
  "SABASTODA (Sabas)",
  "ACNHSTODA (Angeles City National High School)",
  "ACPMTODA (Angeles City Pampang Market)",
  "ONA TODA (Ospital Ning Angeles)",
  "SOPTODA (Sto. Nino Old Pampang)",
  "TP TODA (Timog Park)",
  "McDo HTODA (Mc Donald Henson)",
  "STARTODA (Star Manson)",
  "AL-B TODA (Al-B Drug)",
  "SMTODA (San Miguel)",
  "STAMAL TODA (Sta. Teresita Araw Malansik)",
  "STATDA (Sta. Teresita)",
  "STPC TODA (Sta. Teresita Parish Church)",
  "VPSF TODA (Villa Paz San Francisco)",
  "STTODA (Sta. Trinidad)",
];

export default function ApplyDriverScreen() {
  const router = useRouter();

  const [bodyNumber, setBodyNumber] = useState("");
  const [selectedToda, setSelectedToda] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New state for the modal
  const [isTodaModalVisible, setIsTodaModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Filtered TODAs based on search
  const filteredTodas = ANGELES_TODAS.filter((toda) =>
    toda.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const pickImage = async () => {
    // ... (Keep your exact pickImage code here) ...
    Alert.alert("Upload Franchise/TODA ID", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const permission = await ImagePicker.requestCameraPermissionsAsync();
          if (!permission.granted)
            return Alert.alert("Permission Needed", "We need camera access.");
          const result = await ImagePicker.launchCameraAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0].uri)
            setImageUri(result.assets[0].uri);
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ["images"],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0].uri)
            setImageUri(result.assets[0].uri);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSubmit = async () => {
    if (!bodyNumber.trim() || !imageUri || !selectedToda) {
      Alert.alert(
        "Incomplete",
        "Please enter your Body Number, select your TODA, and upload your ID.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("body_number", bodyNumber.trim());
      formData.append("toda_branch", selectedToda); // <-- Pass TODA to Django

      const filename = imageUri.split("/").pop() || "franchise_photo.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : `image/jpeg`;

      formData.append("franchise_photo", {
        uri: imageUri,
        name: filename,
        type: fileType,
      } as any);

      await api.post("/users/apply-driver/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert(
        "Application Submitted!",
        "Your driver application has been sent to the LGU for review.",
        [{ text: "Done", onPress: () => router.back() }],
      );
    } catch (error: any) {
      Alert.alert("Upload Failed", "Could not send application to the server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Driver Registration</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* BODY NUMBER INPUT */}
        <Text style={styles.sectionTitle}>Tricycle Details</Text>
        <Text style={styles.sectionSubtitle}>
          Enter the official body number of your tricycle.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. 0406"
          placeholderTextColor="#94A3B8"
          value={bodyNumber}
          onChangeText={setBodyNumber}
          keyboardType="numeric"
          maxLength={10}
        />

        {/* TODA SELECTION */}
        <Text style={styles.sectionSubtitle}>
          Select your registered TODA branch.
        </Text>
        <TouchableOpacity
          style={styles.dropdown}
          onPress={() => {
            setSearchQuery(""); // Reset search on open
            setIsTodaModalVisible(true);
          }}
        >
          <Text
            style={[
              styles.dropdownText,
              !selectedToda && styles.dropdownPlaceholder,
            ]}
          >
            {selectedToda || "Select your TODA branch"}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={24} color="#64748B" />
        </TouchableOpacity>

        {/* UPLOAD PHOTO */}
        <Text style={styles.sectionTitle}>Franchise / TODA ID</Text>
        <Text style={styles.sectionSubtitle}>
          Upload a clear photo of your official LGU Franchise document or TODA
          ID for verification.
        </Text>

        <TouchableOpacity
          style={styles.uploadBox}
          activeOpacity={0.8}
          onPress={pickImage}
        >
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.previewImage} />
          ) : (
            <>
              <View style={styles.uploadIconCircle}>
                <MaterialIcons name="badge" size={28} color="#C62828" />
              </View>
              <Text style={styles.uploadTitle}>Upload Document</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitBtn,
            (!bodyNumber || !imageUri || !selectedToda) &&
              styles.submitBtnDisabled,
          ]}
          activeOpacity={0.9}
          disabled={!bodyNumber || !imageUri || !selectedToda || isSubmitting}
          onPress={handleSubmit}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitBtnText}>Submit Application</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* TODA SELECTION MODAL */}
      <Modal
        visible={isTodaModalVisible}
        animationType="slide"
        onRequestClose={() => setIsTodaModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select TODA Branch</Text>
              <TouchableOpacity
                onPress={() => setIsTodaModalVisible(false)}
                style={{ padding: 4 }}
              >
                <MaterialIcons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            <View style={styles.searchContainer}>
              <MaterialIcons
                name="search"
                size={20}
                color="#94A3B8"
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search for your TODA..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
            </View>
            <FlatList
              data={filteredTodas}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.todaItem}
                  onPress={() => {
                    setSelectedToda(item);
                    setIsTodaModalVisible(false);
                  }}
                >
                  <Text style={styles.todaItemText}>{item}</Text>
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              ListEmptyComponent={
                <View style={styles.emptyListContainer}>
                  <Text style={styles.emptyListText}>No TODA found.</Text>
                </View>
              }
              keyboardShouldPersistTaps="handled"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ... (keep all your existing styles, and just add these three below) ...
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: "#FFFFFF",
  },
  backBtn: { padding: 4, marginLeft: -4 },
  headerTitle: { fontSize: 18, fontWeight: "900", color: "#0F172A" },
  scrollContent: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 120 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 20,
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 18,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  uploadBox: {
    backgroundColor: "#FFF5F5",
    borderWidth: 1.5,
    borderColor: "#FECACA",
    borderStyle: "dashed",
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    minHeight: 200,
  },
  uploadIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFE4E6",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: "#C62828",
    marginBottom: 8,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    borderRadius: 14,
    resizeMode: "cover",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  submitBtn: {
    flexDirection: "row",
    backgroundColor: "#C62828",
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  submitBtnDisabled: { backgroundColor: "#CBD5E1" },
  submitBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },

  // --- NEW STYLES for Dropdown and Modal ---
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 32,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0F172A",
  },
  dropdownPlaceholder: {
    color: "#94A3B8",
    fontWeight: "normal",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingTop: 60,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    margin: 16,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: "#0F172A",
  },
  todaItem: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  todaItemText: {
    fontSize: 16,
    color: "#334155",
  },
  separator: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginLeft: 24,
  },
  emptyListContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyListText: {
    fontSize: 16,
    color: "#94A3B8",
  },
});
