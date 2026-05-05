import { LocationObjectCoords } from "expo-location";

import React, { useEffect, useRef, useState } from "react";

import { StyleSheet, View } from "react-native";

import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import MapViewDirections from "react-native-maps-directions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string;

const getDistanceInMeters = (
  lat1: number,

  lon1: number,

  lat2: number,

  lon2: number,
) => {
  const R = 6371e3;

  const p1 = (lat1 * Math.PI) / 180;

  const p2 = (lat2 * Math.PI) / 180;

  const dp = ((lat2 - lat1) * Math.PI) / 180;

  const dl = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};

interface Props {
  mapCenter: { latitude: number; longitude: number };

  currentLocation: LocationObjectCoords | null;

  destLat: number | null;

  destLng: number | null;

  waypoints: { latitude: number; longitude: number }[];

  stopovers: any[];

  onRouteReady: (coords: { latitude: number; longitude: number }[]) => void;

  onDestinationReached: () => void;

  onError?: (error: any) => void;
}

export const ActiveTripMap = ({
  mapCenter,

  currentLocation,

  destLat,

  destLng,

  waypoints,

  stopovers,

  onRouteReady,

  onDestinationReached,

  onError,
}: Props) => {
  const mapRef = useRef<MapView>(null);

  const [lockedOrigin, setLockedOrigin] = useState<{
    latitude: number;

    longitude: number;
  } | null>(null);

  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);

  const [hasAttemptedRoute, setHasAttemptedRoute] = useState(false);

  useEffect(() => {
    if (!lockedOrigin && currentLocation) {
      setLockedOrigin({
        latitude: currentLocation.latitude,

        longitude: currentLocation.longitude,
      });
    }
  }, [currentLocation, lockedOrigin]);

  useEffect(() => {
    if (currentLocation && destLat && destLng) {
      const distanceToDest = getDistanceInMeters(
        currentLocation.latitude,

        currentLocation.longitude,

        destLat,

        destLng,
      );

      if (distanceToDest < 50) {
        onDestinationReached();

        return;
      }

      if (routeCoords.length > 0) {
        let closestIndex = 0;

        let minDistance = Infinity;

        for (let i = 0; i < routeCoords.length; i++) {
          const dist = getDistanceInMeters(
            currentLocation.latitude,

            currentLocation.longitude,

            routeCoords[i].latitude,

            routeCoords[i].longitude,
          );

          if (dist < minDistance) {
            minDistance = dist;

            closestIndex = i;
          }
        }

        if (closestIndex > 0 && minDistance < 100) {
          setRouteCoords((prev) => prev.slice(closestIndex));
        }
      }

      if (mapRef.current) {
        mapRef.current.animateCamera(
          {
            center: currentLocation,

            pitch: 45,

            heading: currentLocation.heading || 0,
          },

          { duration: 1000 },
        );
      }
    }
  }, [currentLocation]);

  // 🚀 ISOLATED RENDER FUNCTIONS (Guarantees no text string crashes)

  const renderDestinationMarker = () => {
    if (!destLat || !destLng) return null;

    return <Marker coordinate={{ latitude: destLat, longitude: destLng }} />;
  };

  const renderRouteLine = () => {
    if (!lockedOrigin || !destLat || !destLng || hasAttemptedRoute) return null;

    return (
      <MapViewDirections
        origin={lockedOrigin}
        destination={{ latitude: destLat, longitude: destLng }}
        waypoints={waypoints}
        apikey={GOOGLE_API_KEY}
        strokeWidth={0}
        optimizeWaypoints={false}
        onReady={(result) => {
          setHasAttemptedRoute(true);

          setRouteCoords(result.coordinates);

          onRouteReady(result.coordinates);

          mapRef.current?.fitToCoordinates(result.coordinates, {
            edgePadding: { top: 120, right: 40, bottom: 300, left: 40 },

            animated: true,
          });
        }}
        onError={(err) => {
          setHasAttemptedRoute(true); // Stop loop if the API fails

          if (onError) onError(err);
        }}
      />
    );
  };

  const renderDynamicLine = () => {
    if (routeCoords.length === 0) return null;

    return (
      <Polyline
        coordinates={routeCoords}
        strokeWidth={6}
        strokeColor="#E53935"
        lineCap="round"
        lineJoin="round"
      />
    );
  };

  const renderStopovers = () => {
    if (!stopovers || stopovers.length === 0) return null;

    return stopovers.map((stop, index) => {
      const lat = Number(stop.latitude);

      const lng = Number(stop.longitude);

      if (isNaN(lat) || isNaN(lng)) return null;

      return (
        <Marker
          key={stop.id || `stop-${index}`}
          coordinate={{ latitude: lat, longitude: lng }}
          title={`Stopover ${index + 1}`}
          description={stop.name || "Passenger Stop"}
        />
      );
    });
  };

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
        {renderDestinationMarker()}

        {renderRouteLine()}

        {renderDynamicLine()}

        {renderStopovers()}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: { ...StyleSheet.absoluteFillObject },
});
