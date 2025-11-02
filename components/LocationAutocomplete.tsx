import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { lightColors, darkColors } from '@/constants/colors';

interface LocationAutocompleteProps {
  value: string;
  onLocationSelect: (location: string, latitude: number, longitude: number) => void;
  isDarkMode: boolean;
  placeholder?: string;
}

export default function LocationAutocomplete({
  value,
  onLocationSelect,
  isDarkMode,
  placeholder = "Enter city and state (e.g., New York, NY)",
}: LocationAutocompleteProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const [gettingLocation, setGettingLocation] = useState(false);
  const googlePlacesRef = useRef<any>(null);

  // Get API key from multiple sources
  const API_KEY =
    Constants.expoConfig?.extra?.googlePlacesApiKey ||
    process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ||
    '';

  // Debug logging
  useEffect(() => {
    console.log('[LocationAutocomplete] Initialized');
    console.log('[LocationAutocomplete] API Key available:', !!API_KEY);
    if (!API_KEY) {
      console.error('[LocationAutocomplete] No Google Places API key found!');
      console.error('[LocationAutocomplete] Checked:', {
        expoConfig: !!Constants.expoConfig?.extra?.googlePlacesApiKey,
        processEnv: !!process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY
      });
    }
  }, [API_KEY]);

  // Sync with parent value changes
  useEffect(() => {
    if (value && googlePlacesRef.current) {
      googlePlacesRef.current.setAddressText(value);
    }
  }, [value]);

  const handleGetCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      console.log('[LocationAutocomplete] Requesting location permission...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      console.log('[LocationAutocomplete] Permission status:', status);

      if (status !== 'granted') {
        console.warn('[LocationAutocomplete] Location permission denied');
        Alert.alert('Permission Required', 'Location permission is required to use your current location.');
        return;
      }

      console.log('[LocationAutocomplete] Getting current position...');
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;
      console.log('[LocationAutocomplete] Got coordinates:', { lat, lon });

      // Reverse geocode to get address
      console.log('[LocationAutocomplete] Reverse geocoding...');
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      console.log('[LocationAutocomplete] Reverse geocode result:', addresses);

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const locationString = [addr.city, addr.region].filter(Boolean).join(', ');
        const displayLocation = locationString || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

        console.log('[LocationAutocomplete] Setting location:', displayLocation);

        // Update the GooglePlacesAutocomplete input
        if (googlePlacesRef.current) {
          googlePlacesRef.current.setAddressText(displayLocation);
        }

        // Call the callback
        onLocationSelect(displayLocation, lat, lon);

        console.log('[LocationAutocomplete] Location set successfully');
      } else {
        console.warn('[LocationAutocomplete] No addresses found for coordinates');
        Alert.alert('Error', 'Could not determine your location address.');
      }
    } catch (error: any) {
      console.error('[LocationAutocomplete] Error getting location:', error);
      Alert.alert('Error', `Failed to get current location: ${error.message || 'Unknown error'}`);
    } finally {
      setGettingLocation(false);
    }
  };

  if (!API_KEY) {
    // Fallback to simple text input when no API key
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error || '#ff0000' }]}>
            ⚠️ Google Places API key not configured
          </Text>
          <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
            Please add EXPO_PUBLIC_GOOGLE_PLACES_API_KEY to your .env file
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.autocompleteWrapper}>
          <GooglePlacesAutocomplete
            ref={googlePlacesRef}
            placeholder={placeholder}
            onPress={(data, details = null) => {
              console.log('[LocationAutocomplete] Place selected:', data.description);
              console.log('[LocationAutocomplete] Place details:', details);

              if (details?.geometry?.location) {
                const { lat, lng } = details.geometry.location;
                console.log('[LocationAutocomplete] Coordinates:', { lat, lng });
                onLocationSelect(data.description, lat, lng);
              } else {
                console.warn('[LocationAutocomplete] No geometry in details, attempting geocode...');
                // Fallback to expo-location geocoding
                Location.geocodeAsync(data.description)
                  .then((results) => {
                    if (results && results.length > 0) {
                      const { latitude, longitude } = results[0];
                      console.log('[LocationAutocomplete] Geocoded to:', { latitude, longitude });
                      onLocationSelect(data.description, latitude, longitude);
                    } else {
                      console.error('[LocationAutocomplete] Geocoding returned no results');
                    }
                  })
                  .catch((error) => {
                    console.error('[LocationAutocomplete] Geocoding error:', error);
                  });
              }
            }}
            query={{
              key: API_KEY,
              language: 'en',
              types: '(cities)',
            }}
            fetchDetails={true}
            enablePoweredByContainer={false}
            styles={{
              textInputContainer: {
                backgroundColor: 'transparent',
                borderTopWidth: 0,
                borderBottomWidth: 0,
                paddingHorizontal: 0,
                paddingVertical: 0,
              },
              textInput: {
                height: 48,
                color: colors.text,
                fontSize: 16,
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
              },
              predefinedPlacesDescription: {
                color: colors.primary,
              },
              listView: {
                backgroundColor: colors.backgroundSecondary,
                borderColor: colors.border,
                borderWidth: 1,
                borderRadius: 12,
                marginTop: 4,
              },
              row: {
                backgroundColor: colors.backgroundSecondary,
                padding: 13,
                height: 44,
                flexDirection: 'row',
              },
              separator: {
                height: 0.5,
                backgroundColor: colors.border,
              },
              description: {
                color: colors.text,
                fontSize: 15,
              },
              loader: {
                flexDirection: 'row',
                justifyContent: 'flex-end',
                height: 20,
              },
            }}
            textInputProps={{
              placeholderTextColor: colors.textSecondary,
              returnKeyType: 'search',
            }}
            debounce={300}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.locationButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleGetCurrentLocation}
          disabled={gettingLocation}
          activeOpacity={0.7}
        >
          <MapPin size={18} color={colors.white || '#ffffff'} strokeWidth={2} />
          <Text style={[styles.locationButtonText, { color: colors.white || '#ffffff' }]}>
            {gettingLocation ? 'Getting...' : 'Use Current'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  autocompleteWrapper: {
    flex: 1,
    zIndex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    height: 48,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorSubtext: {
    fontSize: 12,
  },
});
