import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
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

export default function BusinessMapView({ businesses, userLocation, distanceRadius, onBusinessPress }: Props) {
  const centerLat = userLocation?.latitude || 37.7749;
  const centerLng = userLocation?.longitude || -122.4194;

  useEffect(() => {
    // Load Leaflet CSS
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
            html: '<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          }),
        }).addTo(map).bindPopup('You are here');
      }

      // Add business markers
      businesses.forEach(({ business, alignmentScore, distance, closestLocation }) => {
        const location = business.businessInfo.locations?.[0] ||
                       (business.businessInfo.latitude && business.businessInfo.longitude
                         ? { latitude: business.businessInfo.latitude, longitude: business.businessInfo.longitude }
                         : null);

        if (location && location.latitude && location.longitude) {
          const color = alignmentScore >= 50 ? '#22C55E' : '#EF4444';
          const address = closestLocation || location.address || business.businessInfo.location || 'Address not available';

          L.marker([location.latitude, location.longitude], {
            icon: L.divIcon({
              className: 'business-marker',
              html: `<div style="background-color: ${color}; width: 18px; height: 18px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3); cursor: pointer;"></div>`,
              iconSize: [22, 22],
              iconAnchor: [11, 11],
            }),
          })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 220px; padding: 8px;">
                <div style="font-size: 16px; font-weight: bold; margin-bottom: 6px; color: #1f2937;">
                  ${business.businessInfo.name}
                </div>
                <div style="font-size: 13px; color: #6b7280; margin-bottom: 8px;">
                  ${business.businessInfo.category}
                </div>
                <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                  <div style="background-color: ${color}15; color: ${color}; padding: 4px 8px; border-radius: 6px; font-weight: bold; font-size: 13px;">
                    Score: ${alignmentScore}
                  </div>
                  ${distance !== undefined ? `
                    <div style="color: #6b7280; font-size: 12px;">
                      ${distance < 1 ? `${(distance * 5280).toFixed(0)} ft` : `${distance.toFixed(1)} mi`}
                    </div>
                  ` : ''}
                </div>
                <div style="font-size: 12px; color: #6b7280; margin-bottom: 10px; line-height: 1.4;">
                  📍 ${address}
                </div>
                <button
                  onclick="window.dispatchEvent(new CustomEvent('navigate-to-business', { detail: '${business.id}' }))"
                  style="
                    width: 100%;
                    background-color: #3B82F6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  "
                  onmouseover="this.style.backgroundColor='#2563EB'"
                  onmouseout="this.style.backgroundColor='#3B82F6'"
                >
                  View Details
                </button>
              </div>
            `, {
              maxWidth: 280,
              className: 'business-popup'
            });
        }
      });

      // Store map reference
      (existingMap as any)._leaflet_map = map;
    }

    // Listen for navigation events
    const handleNavigate = (event: any) => {
      if (onBusinessPress) {
        onBusinessPress(event.detail);
      }
    };

    window.addEventListener('navigate-to-business', handleNavigate);

    return () => {
      const existingMap = document.getElementById('business-map');
      if (existingMap && (existingMap as any)._leaflet_map) {
        (existingMap as any)._leaflet_map.remove();
      }
      window.removeEventListener('navigate-to-business', handleNavigate);
    };
  }, [businesses, userLocation, distanceRadius]);

  return (
    <View style={styles.container}>
      <div id="business-map" style={{ width: '100%', height: '100%' }} />
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
