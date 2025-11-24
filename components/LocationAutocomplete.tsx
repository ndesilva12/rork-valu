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

interface LocationSuggestion {
  description: string;
  place_id: string;
}

interface LocationAutocompleteProps {
  value: string;
  onLocationSelect: (location: string, latitude: number, longitude: number) => void;
  isDarkMode: boolean;
  placeholder?: string;
  isConfirmed?: boolean;
}

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY || '';

// Note: The Google Maps JavaScript API requires the "Maps JavaScript API" to be enabled
// in Google Cloud Console. If only "Places API" and "Geocoding API" are enabled,
// the JS SDK won't work. We use REST APIs as fallback which work for geocoding
// but not for autocomplete suggestions due to CORS restrictions.

export default function LocationAutocomplete({
  value,
  onLocationSelect,
  isDarkMode,
  placeholder = "Type full address with city and state",
  isConfirmed = false,
}: LocationAutocompleteProps) {
  const colors = isDarkMode ? darkColors : lightColors;
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Sync internal state with external value prop
  useEffect(() => {
    if (value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);

  const fetchSuggestions = async (text: string) => {
    if (!text.trim() || text.length < 3 || !GOOGLE_API_KEY) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    console.log('[Location] Fetching autocomplete for:', text);

    // Note: Places Autocomplete REST API is blocked by CORS on web browsers.
    // This will only work on native mobile platforms.
    // For web, users must use the search button to geocode their address.
    if (Platform.OS === 'web') {
      console.log('[Location] Autocomplete not available on web (CORS restriction)');
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // REST API call (works on native mobile platforms)
    try {
      const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log('[Location] Autocomplete API response:', data.status);

      if (data.status === 'OK' && data.predictions && data.predictions.length > 0) {
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

    // This is only called on native (autocomplete doesn't work on web)
    // Try Place Details REST API, fall back to geocoding
    try {
      if (!GOOGLE_API_KEY) {
        await geocodeAddressWithGoogle(suggestion.description);
        setIsLoading(false);
        return;
      }

      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${suggestion.place_id}&fields=geometry&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const { lat, lng } = data.result.geometry.location;
        console.log('[Location] Got coordinates from Place Details:', { lat, lng });
        onLocationSelect(suggestion.description, lat, lng);
        showLocationAlert('Location Set', `Location "${suggestion.description}" has been set. Click "Save Changes" to save.`);
      } else {
        // Fallback to geocoding
        await geocodeAddressWithGoogle(suggestion.description);
      }
    } catch (error) {
      console.error('[Location] Error getting place details:', error);
      await geocodeAddressWithGoogle(suggestion.description);
    } finally {
      setIsLoading(false);
    }
  };

  const showLocationAlert = (title: string, message: string) => {
    if (Platform.OS === 'web') {
      window.alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const geocodeAddressWithGoogle = async (address: string): Promise<boolean> => {
    console.log('[Location] Geocoding with Google API:', address);

    if (!GOOGLE_API_KEY) {
      console.error('[Location] No Google API key available');
      showLocationAlert('Configuration Error', 'Google API key is not configured. Please contact support.');
      return false;
    }

    // Use Geocoding REST API - this works on both web and native
    // (Google allows CORS for the Geocoding API, unlike Places API)
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();

      console.log('[Location] Geocoding API response:', data.status);

      if (data.status === 'OK' && data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        console.log('[Location] SUCCESS - Geocoded to:', { lat, lng });

        // Call the callback to save location
        onLocationSelect(address, lat, lng);

        showLocationAlert('Location Set', `Location "${address}" has been set. Click "Save Changes" to save.`);
        return true;
      } else {
        console.warn('[Location] Geocoding failed with status:', data.status);
        showLocationAlert(
          'Location Not Found',
          'Could not find that address. Please include the full address with city and state (e.g., "123 Main St, New York, NY").'
        );
        return false;
      }
    } catch (error) {
      console.error('[Location] Geocoding error:', error);
      showLocationAlert('Error', 'Failed to find this location. Please check your internet connection and try again.');
      return false;
    }
  };

  const handleSearchLocation = async () => {
    const trimmedInput = inputValue.trim();

    if (!trimmedInput) {
      showLocationAlert('Enter Location', 'Please type an address');
      return;
    }

    console.log('[Location] Search button clicked for:', trimmedInput);
    setIsLoading(true);
    setShowSuggestions(false);

    const success = await geocodeAddressWithGoogle(trimmedInput);
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
        showLocationAlert('Permission Denied', 'Location permission is required to use your current location.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const lat = currentLocation.coords.latitude;
      const lon = currentLocation.coords.longitude;
      console.log('[Location] Current coordinates:', { lat, lon });

      // Use Google Reverse Geocoding API for consistent results
      if (GOOGLE_API_KEY) {
        const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${GOOGLE_API_KEY}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const address = data.results[0].formatted_address;
          console.log('[Location] Reverse geocoded to:', address);

          setInputValue(address);
          onLocationSelect(address, lat, lon);

          showLocationAlert('Current Location Set', `Location set to "${address}". Click "Save Changes" to save.`);
        } else {
          // Fallback to coordinates
          const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setInputValue(coords);
          onLocationSelect(coords, lat, lon);
          showLocationAlert('Current Location Set', 'Location set to your coordinates. Click "Save Changes" to save.');
        }
      } else {
        // No API key, try expo-location reverse geocoding (mobile only)
        try {
          const addresses = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lon });
          if (addresses && addresses.length > 0) {
            const addr = addresses[0];
            const locationString = [addr.city, addr.region].filter(Boolean).join(', ');
            const displayLocation = locationString || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

            setInputValue(displayLocation);
            onLocationSelect(displayLocation, lat, lon);
            showLocationAlert('Current Location Set', `Location set to "${displayLocation}". Click "Save Changes" to save.`);
          } else {
            const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
            setInputValue(coords);
            onLocationSelect(coords, lat, lon);
            showLocationAlert('Current Location Set', 'Location set. Click "Save Changes" to save.');
          }
        } catch (reverseError) {
          console.error('[Location] Reverse geocoding failed:', reverseError);
          const coords = `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
          setInputValue(coords);
          onLocationSelect(coords, lat, lon);
          showLocationAlert('Current Location Set', 'Location set. Click "Save Changes" to save.');
        }
      }
    } catch (error: any) {
      console.error('[Location] Current location error:', error);
      showLocationAlert('Error', `Failed to get current location: ${error.message || 'Unknown error'}`);
    } finally {
      setGettingLocation(false);
      setIsLoading(false);
    }
  };

  const handleBlur = () => {
    // Delay to allow suggestion click to register
    setTimeout(() => {
      setShowSuggestions(false);
      setShowInfoTooltip(false);
    }, 300);
  };

  const handleFocus = () => {
    if (!isConfirmed) {
      setShowInfoTooltip(true);
    }
    if (inputValue && inputValue.length >= 3) {
      fetchSuggestions(inputValue);
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
              borderColor: isConfirmed ? '#22C55E' : colors.border,
              borderWidth: isConfirmed ? 2 : 1,
              color: colors.text,
            }
          ]}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          value={inputValue}
          onChangeText={handleTextChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
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

      {/* Info Tooltip */}
      {showInfoTooltip && !isConfirmed && (
        <View style={[
          styles.infoTooltip,
          {
            backgroundColor: colors.primary + '15',
            borderColor: colors.primary + '40',
          }
        ]}>
          <Text style={[styles.infoTooltipText, { color: colors.primary }]}>
            💡 Click the search icon after typing your full address to confirm and save your location
          </Text>
        </View>
      )}

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
            backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
            borderColor: colors.border,
          }
        ]}>
          <FlatList
            data={suggestions}
            keyExtractor={(item) => item.place_id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.suggestionItem,
                  {
                    borderBottomColor: colors.border,
                    backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
                  }
                ]}
                onPress={() => handleSelectSuggestion(item)}
                activeOpacity={0.7}
              >
                <MapPin size={16} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.suggestionText, { color: isDarkMode ? '#F9FAFB' : '#111827' }]}>
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
  infoTooltip: {
    marginTop: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  infoTooltipText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
});
