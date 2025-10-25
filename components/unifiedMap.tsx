import React, { useEffect } from 'react';
import { Platform, View, StyleSheet } from 'react-native';

type Props = {
  latitude?: number;
  longitude?: number;
  zoom?: number;
  height?: number | string;
};

export default function UnifiedMap({ latitude = 37.7749, longitude = -122.4194, zoom = 12, height = 300 }: Props) {
  if (Platform.OS === 'web') {
    // Dynamically inject leaflet CSS if not already present (helps in some bundlers)
    useEffect(() => {
      if (!document.querySelector('link[data-leaflet-css]')) {
        const link = document.createElement('link');
        link.setAttribute('rel', 'stylesheet');
        link.setAttribute('href', 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
        link.setAttribute('data-leaflet-css', 'true');
        document.head.appendChild(link);
      }
    }, []);

    const bbox = `${longitude - 0.05},${latitude - 0.03},${longitude + 0.05},${latitude + 0.03}`;
    const marker = `${latitude}%2C${longitude}`;
    const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${marker}`;

    // @ts-ignore - renders to iframe in web
    return (
      <View style={[styles.webContainer, { height }]}>
        <iframe
          title="map"
          src={src}
          style={{ border: 0, width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }}
          loading="lazy"
        />
      </View>
    );
  }

  // Native implementation (react-native-maps required)
  // This uses require to avoid top-level import failures if library isn't installed.
  const MapView = require('react-native-maps').default;
  const Marker = require('react-native-maps').Marker;

  return (
    <View style={[styles.nativeContainer, { height }]}>
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude,
          longitude,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        }}
      >
        <Marker coordinate={{ latitude, longitude }} />
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  webContainer: { width: '100%', overflow: 'hidden', borderRadius: 12 },
  nativeContainer: { width: '100%', overflow: 'hidden', borderRadius: 12 },
});
