import React from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

interface Props {
  mapCenter: { latitude: number; longitude: number };
  currentLocation: { latitude: number; longitude: number } | null;
  destLat: number | null;
  destLng: number | null;
  waypoints: { latitude: number; longitude: number }[];
  stopovers: any[];
  onRouteReady: (coords: { latitude: number; longitude: number }[]) => void;
}

export const ActiveTripMap = ({
  mapCenter,
  currentLocation,
  destLat,
  destLng,
  waypoints,
  stopovers,
  onRouteReady,
}: Props) => {
  return (
    <View style={styles.mapContainer}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        region={{
          ...mapCenter,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="standard"
      >
        {/* User Location */}
        {currentLocation && (
          <Marker coordinate={mapCenter} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.userMarker}>
              <View style={styles.userMarkerCore} />
            </View>
          </Marker>
        )}

        {/* Destination Marker */}
        {destLat && destLng && (
          <Marker
            coordinate={{ latitude: destLat, longitude: destLng }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.destinationMarker}>
              <View style={styles.destinationMarkerCore} />
            </View>
          </Marker>
        )}

        {/* Live Red Line */}
        {currentLocation && destLat && destLng && (
          <MapViewDirections
            origin={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            destination={{ latitude: destLat, longitude: destLng }}
            waypoints={waypoints}
            apikey={GOOGLE_API_KEY}
            strokeWidth={5}
            strokeColor="#E53935"
            optimizeWaypoints={false}
            onReady={(result) => onRouteReady(result.coordinates)}
          />
        )}

        {/* Stopovers (Orange) */}
        {stopovers.map((stop, index) => {
          const lat = Number(stop.latitude);
          const lng = Number(stop.longitude);
          if (isNaN(lat) || isNaN(lng)) return null;

          return (
            <Marker
              key={stop.id || `stop-${index}`}
              coordinate={{ latitude: lat, longitude: lng }}
              title={`Stopover ${index + 1}`}
              description={stop.name || "Passenger Stop"}
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.stopoverMarker}>
                <View style={styles.stopoverMarkerCore} />
              </View>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { ...StyleSheet.absoluteFillObject },
  userMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  userMarkerCore: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#3B82F6",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  destinationMarker: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#E53935",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 6,
  },
  destinationMarkerCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
  },
  stopoverMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F59E0B",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  stopoverMarkerCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
});
