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
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import * as Location from 'expo-location';
import { lightColors, darkColors } from '@/constants/colors';

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

  const API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

  const fetchSuggestions = async (text: string) => {
    if (!text.trim() || !API_KEY) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&types=(cities)&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.predictions) {
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
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
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry&key=${API_KEY}`
      );
      const data = await response.json();

      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        onLocationSelect(suggestion.description, lat, lng);
      }
    } catch (error) {
      console.error('Error getting place details:', error);
      // If Places API fails, try expo-location geocoding as fallback
      try {
        const results = await Location.geocodeAsync(suggestion.description);
        if (results && results.length > 0) {
          const { latitude, longitude } = results[0];
          onLocationSelect(suggestion.description, latitude, longitude);
        }
      } catch (geocodeError) {
        console.error('Error geocoding location:', geocodeError);
      }
    }
  };

  const handleBlur = async () => {
    // Delay to allow suggestion click to register
    setTimeout(async () => {
      setShowSuggestions(false);

      // If no API key, use expo-location as fallback
      if (!API_KEY && inputValue.trim()) {
        try {
          const results = await Location.geocodeAsync(inputValue);
          if (results && results.length > 0) {
            const { latitude, longitude } = results[0];
            onLocationSelect(inputValue, latitude, longitude);
          }
        } catch (error) {
          console.error('Error geocoding location:', error);
        }
      }
    }, 200);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setGettingLocation(true);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const locationString = [addr.city, addr.region].filter(Boolean).join(', ');
        const displayLocation = locationString || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setInputValue(displayLocation);
        onLocationSelect(displayLocation, lat, lon);
      }
    } catch (error) {
      console.error('Error getting location:', error);
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
    right: 120,
    maxHeight: 200,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
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
