import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { lightColors, darkColors } from '@/constants/colors';
import { trpc } from '@/lib/trpc';

interface LocationSuggestion {
  description: string;
  place_id: string;
}

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
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  const fetchSuggestions = async (text: string) => {
    if (!text.trim()) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[LocationAutocomplete] Fetching suggestions via tRPC for:', text);

      const data = await trpc.location.autocomplete.query({ input: text });

      if (data.predictions) {
        console.log('[LocationAutocomplete] Got', data.predictions.length, 'suggestions');
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else if (data.error) {
        console.error('[LocationAutocomplete] API error:', data.error);
      }
    } catch (error) {
      console.error('[LocationAutocomplete] Error fetching suggestions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextChange = (text: string) => {
    setInputValue(text);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce the API call
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 300);
  };

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get coordinates for the selected place
    try {
      console.log('[LocationAutocomplete] Fetching place details via tRPC for:', suggestion.place_id);

      const data = await trpc.location.placeDetails.query({ placeId: suggestion.place_id });

      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        console.log('[LocationAutocomplete] Got coordinates:', { lat, lng });
        onLocationSelect(suggestion.description, lat, lng);
      } else if (data.error) {
        console.error('[LocationAutocomplete] Place details error:', data.error);
        // Fallback to expo-location geocoding
        try {
          const results = await Location.geocodeAsync(suggestion.description);
          if (results && results.length > 0) {
            const { latitude, longitude } = results[0];
            onLocationSelect(suggestion.description, latitude, longitude);
          }
        } catch (geocodeError) {
          console.error('[LocationAutocomplete] Error geocoding location:', geocodeError);
        }
      }
    } catch (error) {
      console.error('[LocationAutocomplete] Error getting place details:', error);
      // If tRPC fails, try expo-location geocoding as fallback
      try {
        const results = await Location.geocodeAsync(suggestion.description);
        if (results && results.length > 0) {
          const { latitude, longitude } = results[0];
          onLocationSelect(suggestion.description, latitude, longitude);
        }
      } catch (geocodeError) {
        console.error('[LocationAutocomplete] Error geocoding location:', geocodeError);
      }
    }
  };

  const handleBlur = async () => {
    // Delay to allow suggestion click to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

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

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;
      console.log('[LocationAutocomplete] Got coordinates:', { lat, lon });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      console.log('[LocationAutocomplete] Reverse geocode result:', addresses);
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const locationString = [addr.city, addr.region].filter(Boolean).join(', ');
        const displayLocation = locationString || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        console.log('[LocationAutocomplete] Setting location:', displayLocation);
        setInputValue(displayLocation);
        onLocationSelect(displayLocation, lat, lon);
      } else {
        console.warn('[LocationAutocomplete] No addresses found for coordinates');
        Alert.alert('Error', 'Could not determine your location address.');
      }
    } catch (error) {
      console.error('[LocationAutocomplete] Error getting location:', error);
      Alert.alert('Error', `Failed to get current location: ${error.message || 'Unknown error'}`);
    } finally {
      setGettingLocation(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: colors.backgroundSecondary,
              borderColor: colors.border,
              color: colors.text,
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={inputValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onFocus={() => inputValue && fetchSuggestions(inputValue)}
          autoCapitalize="words"
        />
        <TouchableOpacity
          style={[
            styles.locationButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleGetCurrentLocation}
          disabled={gettingLocation}
          activeOpacity={0.7}
        >
          <MapPin size={18} color={colors.white} strokeWidth={2} />
          <Text style={[styles.locationButtonText, { color: colors.white }]}>
            {gettingLocation ? 'Getting...' : 'Use Current'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Searching locations...
          </Text>
        </View>
      )}

      {/* Suggestions list */}
      {showSuggestions && suggestions.length > 0 && (
        <View style={[
          styles.suggestionsContainer,
          {
            backgroundColor: colors.backgroundSecondary,
            borderColor: colors.border,
          }
        ]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.suggestionItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.suggestionText, { color: colors.text }]}>
                  {item.description}
                </Text>
              </TouchableOpacity>
            )}
            style={styles.suggestionsList}
            nestedScrollEnabled
          />
        </View>
      )}
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
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  loadingText: {
    fontSize: 13,
  },
  suggestionsContainer: {
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  suggestionsList: {
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    fontSize: 15,
    flex: 1,
  },
});
