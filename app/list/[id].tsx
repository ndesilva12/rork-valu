import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Share2, ExternalLink } from 'lucide-react-native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { lightColors, darkColors } from '@/constants/colors';
import { useUser } from '@/contexts/UserContext';
import { useData } from '@/contexts/DataContext';
import { useState, useEffect } from 'react';
import { getLogoUrl } from '@/lib/logo';
import { getList } from '@/services/firebase/listService';
import { UserList, ListEntry } from '@/types/library';
import * as Clipboard from 'expo-clipboard';

export default function SharedListScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDarkMode } = useUser();
  const colors = isDarkMode ? darkColors : lightColors;
  const { brands, values } = useData();

  const [list, setList] = useState<UserList | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadList();
  }, [id]);

  const loadList = async () => {
    if (!id) return;

    setIsLoading(true);
    setError(null);

    try {
      const fetchedList = await getList(id);
      if (!fetchedList) {
        setError('List not found');
      } else {
        setList(fetchedList);
      }
    } catch (err) {
      console.error('Error loading list:', err);
      setError('Failed to load list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!list) return;

    const shareMessage = `Check out "${list.name}" on Upright Money!\n\n` +
      (list.creatorName ? `Created by: ${list.creatorName}\n` : '') +
      (list.description ? `${list.description}\n\n` : '') +
      `${list.entries.length} ${list.entries.length === 1 ? 'item' : 'items'}`;
    const shareLink = `https://upright.money/list/${list.id}`;
    const shareMessageWithLink = `${shareMessage}\n\n${shareLink}`;

    try {
      await Share.share({
        message: shareMessageWithLink,
        title: list.name,
      });
    } catch (error) {
      console.error('Error sharing list:', error);
    }
  };

  const handleCopyLink = async () => {
    if (!list) return;

    const shareLink = `https://upright.money/list/${list.id}`;
    try {
      await Clipboard.setStringAsync(shareLink);
      if (Platform.OS === 'web') {
        window.alert('Link copied to clipboard!');
      } else {
        Alert.alert('Success', 'Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const renderListEntry = (entry: ListEntry) => {
    if (entry.type === 'brand') {
      const brand = brands.find(b => b.id === entry.brandId);
      if (!brand) return null;

      return (
        <TouchableOpacity
          key={entry.id}
          style={[styles.entryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => router.push(`/brand/${brand.id}`)}
          activeOpacity={0.7}
        >
          <View style={styles.entryImageContainer}>
            <Image
              source={{ uri: getLogoUrl(brand.name, brand.website) }}
              style={styles.entryImage}
              contentFit="contain"
            />
          </View>
          <View style={styles.entryInfo}>
            <Text style={[styles.entryName, { color: colors.text }]}>{brand.name}</Text>
            <Text style={[styles.entryType, { color: colors.textSecondary }]}>Brand</Text>
          </View>
          <ExternalLink size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (entry.type === 'value') {
      const value = values.find(v => v.id === entry.valueId);
      if (!value) return null;

      return (
        <View
          key={entry.id}
          style={[styles.entryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.entryInfo}>
            <Text style={[styles.entryName, { color: colors.text }]}>{value.name}</Text>
            <Text style={[styles.entryType, { color: colors.textSecondary }]}>
              Value • {entry.mode === 'support' ? 'Support' : 'Avoid'}
            </Text>
          </View>
        </View>
      );
    }

    if (entry.type === 'link') {
      return (
        <TouchableOpacity
          key={entry.id}
          style={[styles.entryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
          onPress={() => {
            if (Platform.OS === 'web') {
              window.open(entry.url, '_blank');
            }
          }}
          activeOpacity={0.7}
        >
          <View style={styles.entryInfo}>
            <Text style={[styles.entryName, { color: colors.text }]}>{entry.title}</Text>
            <Text style={[styles.entryType, { color: colors.textSecondary }]} numberOfLines={1}>
              {entry.url}
            </Text>
          </View>
          <ExternalLink size={20} color={colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    if (entry.type === 'text') {
      return (
        <View
          key={entry.id}
          style={[styles.entryCard, { backgroundColor: colors.backgroundSecondary, borderColor: colors.border }]}
        >
          <View style={styles.entryInfo}>
            <Text style={[styles.entryText, { color: colors.text }]}>{entry.content}</Text>
          </View>
        </View>
      );
    }

    return null;
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Loading...',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading list...</Text>
        </View>
      </View>
    );
  }

  if (error || !list) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Error',
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={styles.centerContainer}>
          <Text style={[styles.errorTitle, { color: colors.text }]}>List Not Found</Text>
          <Text style={[styles.errorMessage, { color: colors.textSecondary }]}>
            {error || 'This list doesn\'t exist or has been deleted.'}
          </Text>
          <TouchableOpacity
            style={[styles.homeButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/home')}
            activeOpacity={0.7}
          >
            <Text style={[styles.homeButtonText, { color: colors.white }]}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: list.name,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backButton}
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color={colors.text} strokeWidth={2} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={handleCopyLink}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <ExternalLink size={22} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={styles.headerButton}
                activeOpacity={0.7}
              >
                <Share2 size={22} color={colors.text} strokeWidth={2} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {list.creatorName && (
          <View style={[styles.creatorCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.creatorLabel, { color: colors.textSecondary }]}>Created by</Text>
            <Text style={[styles.creatorName, { color: colors.text }]}>{list.creatorName}</Text>
          </View>
        )}

        {list.description && (
          <View style={[styles.descriptionCard, { backgroundColor: colors.backgroundSecondary }]}>
            <Text style={[styles.description, { color: colors.text }]}>{list.description}</Text>
          </View>
        )}

        <View style={styles.statsContainer}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {list.entries.length} {list.entries.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {list.entries.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              This list is empty
            </Text>
          </View>
        ) : (
          <View style={styles.entriesContainer}>
            {list.entries.map(entry => renderListEntry(entry))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  homeButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  homeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    padding: 8,
    marginLeft: 8,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  headerButton: {
    padding: 8,
  },
  creatorCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  creatorLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  creatorName: {
    fontSize: 18,
    fontWeight: '600',
  },
  descriptionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  statsContainer: {
    marginBottom: 16,
  },
  statsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  entriesContainer: {
    gap: 8,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  entryImageContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#fff',
    padding: 8,
  },
  entryImage: {
    width: '100%',
    height: '100%',
  },
  entryInfo: {
    flex: 1,
  },
  entryName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  entryType: {
    fontSize: 13,
  },
  entryText: {
    fontSize: 15,
    lineHeight: 22,
  },
  emptyContainer: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
