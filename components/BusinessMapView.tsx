import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
