import React, { useState, useRef, useEffect } from 'react';
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
import { MapPin, Search } from 'lucide-react-native';
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
  placeholder = "Enter address or city",
}: LocationAutocompleteProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const fetchSuggestions = async (text: string) => {
    if (!text.trim() || text.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      setIsLoading(true);
      console.log('[Location] Fetching autocomplete for:', text);

      const data = await trpc.location.autocomplete.query({ input: text });

      if (data.predictions && data.predictions.length > 0) {
        console.log('[Location] Got', data.predictions.length, 'suggestions');
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.log('[Location] No autocomplete results');
        setSuggestions([]);
      }
    } catch (error) {
      console.error('[Location] Autocomplete error:', error);
      setSuggestions([]);
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
    }, 500);
  };

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    console.log('[Location] Selected:', suggestion.description);
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);

    // Get coordinates for the selected place
    try {
      const data = await trpc.location.placeDetails.query({ placeId: suggestion.place_id });

      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        console.log('[Location] Got coordinates:', { lat, lng });
        onLocationSelect(suggestion.description, lat, lng);
      } else {
        // Fallback to expo-location geocoding
        await geocodeAddress(suggestion.description);
      }
    } catch (error) {
      console.error('[Location] Error getting coordinates:', error);
      await geocodeAddress(suggestion.description);
    }
  };

  const geocodeAddress = async (address: string) => {
    try {
      console.log('[Location] Geocoding:', address);
      const results = await Location.geocodeAsync(address);

      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        console.log('[Location] Geocoded to:', { latitude, longitude });
        onLocationSelect(address, latitude, longitude);
        return true;
      } else {
        console.warn('[Location] No geocoding results');
        Alert.alert('Location Not Found', 'Could not find coordinates for this address. Try being more specific or use your current location.');
        return false;
      }
    } catch (error) {
      console.error('[Location] Geocoding error:', error);
      Alert.alert('Error', 'Failed to geocode address. Please try again.');
      return false;
    }
  };

  const handleSearchLocation = async () => {
    if (!inputValue.trim()) {
      Alert.alert('Enter Location', 'Please enter an address or city name');
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);
    await geocodeAddress(inputValue.trim());
    setIsLoading(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      console.log('[Location] Getting current location...');

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use your current location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;
      console.log('[Location] Current coords:', { lat, lon });

      // Reverse geocode to get address
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        const locationString = [addr.street, addr.city, addr.region, addr.postalCode].filter(Boolean).join(', ');
        const displayLocation = locationString || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        console.log('[Location] Reverse geocoded to:', displayLocation);
        setInputValue(displayLocation);
        onLocationSelect(displayLocation, lat, lon);
      } else {
        const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setInputValue(coords);
        onLocationSelect(coords, lat, lon);
      }
    } catch (error: any) {
      console.error('[Location] Current location error:', error);
      Alert.alert('Error', `Failed to get current location: ${error.message || 'Unknown error'}`);
    } finally {
      setGettingLocation(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion click to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
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
          returnKeyType="search"
          onSubmitEditing={handleSearchLocation}
        />
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleSearchLocation}
          disabled={isLoading || !inputValue.trim()}
          activeOpacity={0.7}
        >
          <Search size={20} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.primary }
          ]}
          onPress={handleGetCurrentLocation}
          disabled={gettingLocation}
          activeOpacity={0.7}
        >
          <MapPin size={20} color={colors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {gettingLocation ? 'Getting your location...' : 'Searching...'}
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
    gap: 8,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
