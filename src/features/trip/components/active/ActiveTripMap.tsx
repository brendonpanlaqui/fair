import { LocationObjectCoords } from "expo-location";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

interface Props {
  mapCenter: { latitude: number; longitude: number };
  currentLocation: LocationObjectCoords | null; // 🚀 Uses Expo's official strict typing
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
  const mapRef = useRef<MapView>(null);

  // 🚀 FIX 1: Start as null, then set it ONCE via useEffect
  const [lockedOrigin, setLockedOrigin] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Wait for the GPS to lock on, then freeze the origin for the red line
  useEffect(() => {
    if (!lockedOrigin && currentLocation) {
      setLockedOrigin({
        latitude: currentLocation.latitude,
        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation, lockedOrigin]);

  // 🚀 FIX 2: Gentle Camera Update
  // We only animate the camera if we already have the route drawn,
  // giving it that smooth 3D navigation feel without breaking the initial zoom.
  useEffect(() => {
    if (currentLocation && lockedOrigin && mapRef.current) {
      mapRef.current.animateCamera(
        {
          center: currentLocation,
          pitch: 45, // 3D driving view
          heading: currentLocation.heading || 0, // Faces the direction you are moving (if available)
        },
        { duration: 1000 },
      );
    }
  }, [currentLocation, lockedOrigin]);

  return (
    <View style={styles.mapContainer}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          ...mapCenter,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        mapType="standard"
      >
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

        {/* Locked Route Line */}
        {lockedOrigin && destLat && destLng && (
          <MapViewDirections
            origin={lockedOrigin}
            destination={{ latitude: destLat, longitude: destLng }}
            waypoints={waypoints}
            apikey={GOOGLE_API_KEY}
            strokeWidth={6}
            strokeColor="#E53935"
            optimizeWaypoints={false}
            onReady={(result) => {
              onRouteReady(result.coordinates);
              // Zoom to show the whole route initially
              mapRef.current?.fitToCoordinates(result.coordinates, {
                edgePadding: { top: 120, right: 40, bottom: 300, left: 40 },
                animated: true,
              });
            }}
          />
        )}

        {/* Stopovers */}
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
