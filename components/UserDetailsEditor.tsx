import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  Linking,
} from 'react-native';
import { User, Globe, MapPin, Facebook, Instagram, Twitter, Linkedin, ExternalLink } from 'lucide-react-native';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import LocationAutocomplete from '@/components/LocationAutocomplete';

export default function UserDetailsEditor() {
  const { isDarkMode, profile, setUserDetails } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;

  const userDetails = profile.userDetails || {
    name: '',
    description: '',
    website: '',
    location: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      linkedin: '',
    },
  };

  const [editing, setEditing] = useState(false);

  // Local state for editing
  const [name, setName] = useState(userDetails.name || '');
  const [description, setDescription] = useState(userDetails.description || '');
  const [website, setWebsite] = useState(userDetails.website || '');
  const [location, setLocation] = useState(userDetails.location || '');
  const [latitude, setLatitude] = useState<number | undefined>(userDetails.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(userDetails.longitude);
  const [facebook, setFacebook] = useState(userDetails.socialMedia?.facebook || '');
  const [instagram, setInstagram] = useState(userDetails.socialMedia?.instagram || '');
  const [twitter, setTwitter] = useState(userDetails.socialMedia?.twitter || '');
  const [linkedin, setLinkedin] = useState(userDetails.socialMedia?.linkedin || '');

  const handleLocationSelect = (locationName: string, lat: number, lon: number) => {
    setLocation(locationName);
    setLatitude(lat);
    setLongitude(lon);
  };

  const handleSave = async () => {
    const updateInfo: any = {
      name: name.trim(),
      description: description.trim(),
      website: website.trim(),
      socialMedia: {
        facebook: facebook.trim(),
        instagram: instagram.trim(),
        twitter: twitter.trim(),
        linkedin: linkedin.trim(),
      },
    };

    if (location.trim()) {
      updateInfo.location = location.trim();
    }
    if (latitude !== undefined) {
      updateInfo.latitude = latitude;
    }
    if (longitude !== undefined) {
      updateInfo.longitude = longitude;
    }

    await setUserDetails(updateInfo);

    setEditing(false);
    Alert.alert('Success', 'User details updated');
  };

  const handleCancel = () => {
    // Reset to saved values
    setName(userDetails.name || '');
    setDescription(userDetails.description || '');
    setWebsite(userDetails.website || '');
    setLocation(userDetails.location || '');
    setLatitude(userDetails.latitude);
    setLongitude(userDetails.longitude);
    setFacebook(userDetails.socialMedia?.facebook || '');
    setInstagram(userDetails.socialMedia?.instagram || '');
    setTwitter(userDetails.socialMedia?.twitter || '');
    setLinkedin(userDetails.socialMedia?.linkedin || '');
    setEditing(false);
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>User Details</Text>
        {!editing && (
          <TouchableOpacity
            onPress={() => setEditing(true)}
            activeOpacity={0.7}
          >
            <Text style={[styles.editButton, { color: colors.primary }]}>Edit</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { backgroundColor: colors.backgroundSecondary }]}>
        {/* Compact Header with Icon */}
        <View style={styles.compactHeader}>
          <View style={[styles.iconContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <User size={32} color={colors.primary} strokeWidth={1.5} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {userDetails.name || 'Add your name'}
            </Text>
            {userDetails.location && (
              <View style={styles.locationRow}>
                <MapPin size={12} color={colors.textSecondary} strokeWidth={2} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>{userDetails.location}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Compact Form - 2 columns */}
        <View style={styles.formGrid}>
          {/* Name & Location Row */}
          <View style={styles.formRow}>
            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Name</Text>
              {editing ? (
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                  placeholder="Your name"
                  placeholderTextColor={colors.textSecondary}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>{userDetails.name || 'Not set'}</Text>
              )}
            </View>

            <View style={[styles.inputGroup, styles.halfWidth]}>
              <Text style={[styles.label, { color: colors.text }]}>Location</Text>
              {editing ? (
                <LocationAutocomplete
                  value={location}
                  onLocationSelect={handleLocationSelect}
                  isDarkMode={isDarkMode}
                />
              ) : (
                <Text style={[styles.value, { color: colors.text }]}>{userDetails.location || 'Not set'}</Text>
              )}
            </View>
          </View>

          {/* Description - Full Width */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Bio</Text>
            {editing ? (
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }
                ]}
                placeholder="Tell people about yourself..."
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            ) : (
              <Text style={[styles.value, { color: colors.text }]}>
                {userDetails.description || 'No bio added'}
              </Text>
            )}
          </View>

          {/* Website */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Globe size={14} color={colors.text} strokeWidth={2} />
              <Text style={[styles.label, { color: colors.text }]}>Website</Text>
            </View>
            {editing ? (
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                placeholder="https://your-website.com"
                placeholderTextColor={colors.textSecondary}
                value={website}
                onChangeText={setWebsite}
                autoCapitalize="none"
                keyboardType="url"
              />
            ) : userDetails.website ? (
              <TouchableOpacity
                style={[styles.linkButton, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}
                onPress={() => Linking.openURL(userDetails.website.startsWith('http') ? userDetails.website : `https://${userDetails.website}`)}
                activeOpacity={0.7}
              >
                <Text style={[styles.linkButtonText, { color: colors.primary }]} numberOfLines={1}>
                  {userDetails.website}
                </Text>
                <ExternalLink size={14} color={colors.primary} strokeWidth={2} />
              </TouchableOpacity>
            ) : (
              <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
            )}
          </View>

          {/* Social Media - 2x2 Grid */}
          <View style={styles.socialMediaSection}>
            <Text style={[styles.sectionSubtitle, { color: colors.text }]}>Social Media</Text>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Facebook size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>Facebook</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="facebook.com/username"
                    placeholderTextColor={colors.textSecondary}
                    value={facebook}
                    onChangeText={setFacebook}
                    autoCapitalize="none"
                  />
                ) : userDetails.socialMedia?.facebook ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}
                    onPress={() => Linking.openURL(userDetails.socialMedia.facebook.startsWith('http') ? userDetails.socialMedia.facebook : `https://${userDetails.socialMedia.facebook}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Instagram size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>Instagram</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="@username"
                    placeholderTextColor={colors.textSecondary}
                    value={instagram}
                    onChangeText={setInstagram}
                    autoCapitalize="none"
                  />
                ) : userDetails.socialMedia?.instagram ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}
                    onPress={() => Linking.openURL(userDetails.socialMedia.instagram.startsWith('http') ? userDetails.socialMedia.instagram : `https://instagram.com/${userDetails.socialMedia.instagram.replace('@', '')}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>
            </View>

            <View style={styles.formRow}>
              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Twitter size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>Twitter/X</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="@username"
                    placeholderTextColor={colors.textSecondary}
                    value={twitter}
                    onChangeText={setTwitter}
                    autoCapitalize="none"
                  />
                ) : userDetails.socialMedia?.twitter ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}
                    onPress={() => Linking.openURL(userDetails.socialMedia.twitter.startsWith('http') ? userDetails.socialMedia.twitter : `https://twitter.com/${userDetails.socialMedia.twitter.replace('@', '')}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>

              <View style={[styles.inputGroup, styles.halfWidth]}>
                <View style={styles.labelRow}>
                  <Linkedin size={14} color={colors.text} strokeWidth={2} />
                  <Text style={[styles.label, { color: colors.text }]}>LinkedIn</Text>
                </View>
                {editing ? (
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                    placeholder="linkedin.com/in/username"
                    placeholderTextColor={colors.textSecondary}
                    value={linkedin}
                    onChangeText={setLinkedin}
                    autoCapitalize="none"
                  />
                ) : userDetails.socialMedia?.linkedin ? (
                  <TouchableOpacity
                    style={[styles.socialButton, { backgroundColor: colors.primary + '10', borderColor: colors.border }]}
                    onPress={() => Linking.openURL(userDetails.socialMedia.linkedin.startsWith('http') ? userDetails.socialMedia.linkedin : `https://${userDetails.socialMedia.linkedin}`)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.socialButtonText, { color: colors.primary }]} numberOfLines={1}>
                      View Profile
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <Text style={[styles.value, { color: colors.textSecondary }]}>Not set</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Edit Actions */}
        {editing && (
          <View style={styles.editActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton, { borderColor: colors.border }]}
              onPress={handleCancel}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              activeOpacity={0.7}
            >
              <Text style={[styles.actionButtonText, { color: colors.white }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  editButton: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  card: {
    borderRadius: 16,
    padding: 16,
  },
  // Compact Header Layout
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingBottom: 16,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
  },
  // Compact Form Layout
  formGrid: {
    gap: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputGroup: {
    marginBottom: 8,
  },
  halfWidth: {
    flex: 1,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 10,
  },
  value: {
    fontSize: 14,
    lineHeight: 20,
  },
  link: {
    textDecorationLine: 'underline',
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  linkButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  socialButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  socialButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  socialMediaSection: {
    marginTop: 8,
  },
  // Edit Actions
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  saveButton: {
    // backgroundColor set dynamically
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
});
