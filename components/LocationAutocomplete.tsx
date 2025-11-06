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
  placeholder = "Type address and click search",
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
      setShowSuggestions(false);
      return;
    }

    try {
      console.log('[Location] Fetching suggestions for:', text);

      const data = await trpc.location.autocomplete.query({ input: text });
      console.log('[Location] API response:', data);

      if (data.predictions && data.predictions.length > 0) {
        console.log('[Location] Got', data.predictions.length, 'suggestions');
        setSuggestions(data.predictions);
        setShowSuggestions(true);
      } else {
        console.log('[Location] No suggestions from API');
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('[Location] Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleTextChange = (text: string) => {
    console.log('[Location] Text changed:', text);
    setInputValue(text);

    // Clear existing timeout
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    // Debounce the API call - only for showing suggestions
    debounceTimeout.current = setTimeout(() => {
      fetchSuggestions(text);
    }, 800);
  };

  const handleSelectSuggestion = async (suggestion: LocationSuggestion) => {
    console.log('[Location] Selected suggestion:', suggestion.description);
    setInputValue(suggestion.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);

    // Get coordinates for the selected place
    try {
      const data = await trpc.location.placeDetails.query({ placeId: suggestion.place_id });

      if (data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        console.log('[Location] Got coordinates from API:', { lat, lng });
        onLocationSelect(suggestion.description, lat, lng);
      } else {
        // Fallback to expo-location geocoding
        console.log('[Location] No coordinates from API, using fallback geocoding');
        await geocodeAddress(suggestion.description);
      }
    } catch (error) {
      console.error('[Location] Error getting coordinates:', error);
      await geocodeAddress(suggestion.description);
    } finally {
      setIsLoading(false);
    }
  };

  const geocodeAddress = async (address: string): Promise<boolean> => {
    try {
      console.log('[Location] Geocoding address:', address);
      const results = await Location.geocodeAsync(address);
      console.log('[Location] Geocoding results:', results);

      if (results && results.length > 0) {
        const { latitude, longitude } = results[0];
        console.log('[Location] SUCCESS - Geocoded to:', { latitude, longitude });

        // Call the callback to save location
        onLocationSelect(address, latitude, longitude);

        Alert.alert('Location Set', `Location "${address}" has been set. Click "Save Changes" to save.`);
        return true;
      } else {
        console.warn('[Location] No geocoding results found');
        Alert.alert('Location Not Found', 'Could not find coordinates for this address. Please try a different address or be more specific.');
        return false;
      }
    } catch (error) {
      console.error('[Location] Geocoding error:', error);
      Alert.alert('Error', 'Failed to find this location. Please try again.');
      return false;
    }
  };

  const handleSearchLocation = async () => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      Alert.alert('Enter Location', 'Please type an address or city name');
      return;
    }

    console.log('[Location] Search button clicked for:', trimmedInput);
    setIsLoading(true);
    setShowSuggestions(false);

    const success = await geocodeAddress(trimmedInput);
    console.log('[Location] Search completed, success:', success);

    setIsLoading(false);
  };

  const handleGetCurrentLocation = async () => {
    try {
      setGettingLocation(true);
      setIsLoading(true);
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
      console.log('[Location] Current coordinates:', { lat, lon });

      // Reverse geocode to get address in City, State format
      const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
      console.log('[Location] Reverse geocode result:', addresses);

      if (addresses && addresses.length > 0) {
        const addr = addresses[0];
        // Format as "City, State" for human readability
        const locationString = [addr.city, addr.region]
          .filter(Boolean)
          .join(', ');

        const displayLocation = locationString || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        console.log('[Location] Formatted location:', displayLocation);

        setInputValue(displayLocation);
        onLocationSelect(displayLocation, lat, lon);

        Alert.alert('Current Location Set', `Location set to "${displayLocation}". Click "Save Changes" to save.`);
      } else {
        // Fallback to coordinates if reverse geocoding fails
        const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
        setInputValue(coords);
        onLocationSelect(coords, lat, lon);
        Alert.alert('Current Location Set', 'Location set to your current coordinates. Click "Save Changes" to save.');
      }
    } catch (error: any) {
      console.error('[Location] Current location error:', error);
      Alert.alert('Error', `Failed to get current location: ${error.message || 'Unknown error'}`);
    } finally {
      setGettingLocation(false);
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion click to register
    setTimeout(() => {
      setShowSuggestions(false);
    }, 300);
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
          onFocus={() => inputValue && inputValue.length >= 3 && fetchSuggestions(inputValue)}
          autoCapitalize="words"
          returnKeyType="search"
          onSubmitEditing={handleSearchLocation}
        />
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.primary, opacity: (isLoading || !inputValue.trim()) ? 0.5 : 1 }
          ]}
          onPress={handleSearchLocation}
          disabled={isLoading || !inputValue.trim()}
          activeOpacity={0.7}
        >
          {isLoading && !gettingLocation ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Search size={20} color={colors.white} strokeWidth={2} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.iconButton,
            { backgroundColor: colors.primary, opacity: gettingLocation ? 0.5 : 1 }
          ]}
          onPress={handleGetCurrentLocation}
          disabled={gettingLocation || isLoading}
          activeOpacity={0.7}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <MapPin size={20} color={colors.white} strokeWidth={2} />
          )}
        </TouchableOpacity>
      </View>

      {/* Loading indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {gettingLocation ? 'Getting your location...' : 'Searching for location...'}
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
