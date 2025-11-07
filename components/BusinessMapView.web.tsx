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
  // Approximate zoom levels for different distances (higher = more zoomed in)
  if (radiusMiles <= 1) return 16;
  if (radiusMiles <= 5) return 14;
  if (radiusMiles <= 10) return 13;
  if (radiusMiles <= 25) return 12;
  if (radiusMiles <= 50) return 11;
  return 10; // 100+ miles
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

      // Add user location marker (blue dot)
      if (userLocation) {
        L.marker([userLocation.latitude, userLocation.longitude], {
          icon: L.divIcon({
            className: 'user-marker',
            html: `<svg width="24" height="32" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" fill="#3B82F6"/>
              <path d="M12 0C5.37 0 0 5.37 0 12c0 9 12 20 12 20s12-11 12-20c0-6.63-5.37-12-12-12z" stroke="white" stroke-width="2"/>
              <circle cx="12" cy="12" r="4" fill="white"/>
            </svg>`,
            iconSize: [24, 32],
            iconAnchor: [12, 32],
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

          // Stand discount information
          const acceptsStand = business.businessInfo.acceptsStandDiscounts;
          const acceptsQR = business.businessInfo.acceptsQRCode ?? true;
          const acceptsPromo = business.businessInfo.acceptsValueCode ?? true;
          const discountPercent = business.businessInfo.customerDiscountPercent || 0;
          const donationPercent = business.businessInfo.donationPercent || 0;

          let acceptanceMethod = '';
          if (acceptsQR && acceptsPromo) {
            acceptanceMethod = 'QR Code / Promo Code';
          } else if (acceptsQR) {
            acceptanceMethod = 'QR Code';
          } else if (acceptsPromo) {
            acceptanceMethod = 'Promo Code';
          }

          L.marker([location.latitude, location.longitude], {
            icon: L.divIcon({
              className: 'business-marker',
              html: `<svg width="20" height="28" viewBox="0 0 20 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z" fill="${color}"/>
                <path d="M10 0C4.48 0 0 4.48 0 10c0 7.5 10 18 10 18s10-10.5 10-18c0-5.52-4.48-10-10-10z" stroke="white" stroke-width="1.5"/>
              </svg>`,
              iconSize: [20, 28],
              iconAnchor: [10, 28],
            }),
          })
            .addTo(map)
            .bindPopup(`
              <div style="min-width: 220px; padding: 12px;">
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

                ${acceptsStand ? `
                  <div style="background-color: #f0f9ff; border-radius: 8px; padding: 10px; margin-bottom: 10px;">
                    <div style="font-size: 12px; font-weight: 600; color: #00aaff; margin-bottom: 6px;">
                      Stand Contributions Accepted
                    </div>
                    <div style="font-size: 11px; color: #4b5563; margin-bottom: 3px;">
                      Accepts: ${acceptanceMethod}
                    </div>
                    <div style="display: flex; gap: 12px; font-size: 11px; color: #4b5563;">
                      <div>Discount: <strong style="font-size: 14px;">${discountPercent.toFixed(1)}%</strong></div>
                      <div>Donation: <strong style="font-size: 14px;">${donationPercent.toFixed(1)}%</strong></div>
                    </div>
                  </div>
                ` : ''}

                <button
                  onclick="window.dispatchEvent(new CustomEvent('navigate-to-business', { detail: '${business.id}' }))"
                  style="
                    width: 100%;
                    background-color: #00aaff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: background-color 0.2s;
                  "
                  onmouseover="this.style.backgroundColor='#0099ee'"
                  onmouseout="this.style.backgroundColor='#00aaff'"
                >
                  View Details
                </button>
              </div>
            `, {
              maxWidth: 300,
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
