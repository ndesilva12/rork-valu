import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BusinessUser } from '@/services/firebase/businessService';

type Props = {
  businesses: Array<{
    business: BusinessUser;
    alignmentScore: number;
    distance?: number;
    closestLocation?: string;
  }>;
  userLocation: { latitude: number; longitude: number } | null;
  distanceRadius: number; // in miles
  onBusinessPress?: (businessId: string) => void;
};

export default function BusinessMapView({ businesses, userLocation, distanceRadius, onBusinessPress }: Props) {
  // Calculate the appropriate zoom/delta based on distance radius
  const getLatLongDelta = (radiusMiles: number) => {
    // Rough approximation: 1 degree latitude ≈ 69 miles
    // Add some padding for better view
    const delta = (radiusMiles / 69) * 2.5;
    return { latitudeDelta: delta, longitudeDelta: delta };
  };

  const { latitudeDelta, longitudeDelta } = getLatLongDelta(distanceRadius);

  const centerLat = userLocation?.latitude || 37.7749;
  const centerLng = userLocation?.longitude || -122.4194;

  if (Platform.OS === 'web') {
    // Web implementation using Leaflet
    useEffect(() => {
      if (!document.querySelector('link[data-leaflet-css]')) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        link.setAttribute('data-leaflet-css', 'true');
        document.head.appendChild(link);
      }

      // Load Leaflet library
      if (!(window as any).L) {
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.async = true;
        script.onload = () => initializeMap();
        document.body.appendChild(script);
      } else {
        initializeMap();
      }

      function initializeMap() {
        const L = (window as any).L;
        if (!L) return;

        // Remove existing map if any
        const existingMap = document.getElementById('business-map');
        if (existingMap && (existingMap as any)._leaflet_id) {
          (existingMap as any)._leaflet_map?.remove();
        }

        // Initialize map
        const map = L.map('business-map').setView([centerLat, centerLng], getZoomLevel(distanceRadius));

        // Add tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map);

        // Add user location marker
        if (userLocation) {
          L.marker([userLocation.latitude, userLocation.longitude], {
            icon: L.divIcon({
              className: 'user-marker',
              html: '<div style="background-color: #3B82F6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
          }).addTo(map).bindPopup('You are here');
        }

        // Add business markers
        businesses.forEach(({ business, alignmentScore }) => {
          const location = business.businessInfo.locations?.[0] ||
                         (business.businessInfo.latitude && business.businessInfo.longitude
                           ? { latitude: business.businessInfo.latitude, longitude: business.businessInfo.longitude }
                           : null);

          if (location && location.latitude && location.longitude) {
            const color = alignmentScore >= 50 ? '#22C55E' : '#EF4444';

            L.marker([location.latitude, location.longitude], {
              icon: L.divIcon({
                className: 'business-marker',
                html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
                iconSize: [16, 16],
                iconAnchor: [8, 8],
              }),
            })
              .addTo(map)
              .bindPopup(`
                <div style="text-align: center;">
                  <strong>${business.businessInfo.name}</strong><br/>
                  <span style="color: ${color}; font-weight: bold;">Score: ${alignmentScore}</span>
                </div>
              `)
              .on('click', () => {
                if (onBusinessPress) {
                  onBusinessPress(business.id);
                }
              });
          }
        });

        // Store map reference
        (existingMap as any)._leaflet_map = map;
      }

      return () => {
        const existingMap = document.getElementById('business-map');
        if (existingMap && (existingMap as any)._leaflet_map) {
          (existingMap as any)._leaflet_map.remove();
        }
      };
    }, [businesses, userLocation, distanceRadius]);

    return (
      <View style={styles.container}>
        <div id="business-map" style={{ width: '100%', height: '100%' }} />
      </View>
    );
  }

  // Native implementation using react-native-maps
  const MapView = require('react-native-maps').default;
  const Marker = require('react-native-maps').Marker;
  const Circle = require('react-native-maps').Circle;

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: centerLat,
          longitude: centerLng,
          latitudeDelta,
          longitudeDelta,
        }}
      >
        {/* User location marker */}
        {userLocation && (
          <Marker
            coordinate={userLocation}
            pinColor="#3B82F6"
            title="You are here"
          />
        )}

        {/* Distance radius circle */}
        {userLocation && (
          <Circle
            center={userLocation}
            radius={distanceRadius * 1609.34} // Convert miles to meters
            strokeColor="rgba(59, 130, 246, 0.5)"
            fillColor="rgba(59, 130, 246, 0.1)"
            strokeWidth={2}
          />
        )}

        {/* Business markers */}
        {businesses.map(({ business, alignmentScore }) => {
          const location = business.businessInfo.locations?.[0] ||
                         (business.businessInfo.latitude && business.businessInfo.longitude
                           ? { latitude: business.businessInfo.latitude, longitude: business.businessInfo.longitude }
                           : null);

          if (!location || !location.latitude || !location.longitude) return null;

          const color = alignmentScore >= 50 ? '#22C55E' : '#EF4444';

          return (
            <Marker
              key={business.id}
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              pinColor={color}
              title={business.businessInfo.name}
              description={`Alignment Score: ${alignmentScore}`}
              onPress={() => onBusinessPress && onBusinessPress(business.id)}
            />
          );
        })}
      </MapView>
    </View>
  );
}

// Helper function to convert distance to zoom level
function getZoomLevel(radiusMiles: number): number {
  // Approximate zoom levels for different distances
  if (radiusMiles <= 1) return 14;
  if (radiusMiles <= 5) return 12;
  if (radiusMiles <= 10) return 11;
  if (radiusMiles <= 25) return 10;
  if (radiusMiles <= 50) return 9;
  return 8; // 100+ miles
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
