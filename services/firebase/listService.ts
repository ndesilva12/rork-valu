import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/firebase';
import { UserList, ListEntry } from '@/types/library';
import {
  startEndorsementPeriod,
  endEndorsementPeriod,
  updateCurrentPosition,
} from './endorsementHistoryService';

const LISTS_COLLECTION = 'userLists';

// Convert Firestore timestamp to Date
const timestampToDate = (timestamp: any): Date => {
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
};

// Get all lists for a user
export const getUserLists = async (userId: string): Promise<UserList[]> => {
  try {
    const listsRef = collection(db, LISTS_COLLECTION);
    const q = query(
      listsRef,
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const lists: UserList[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      lists.push({
        id: doc.id,
        userId: data.userId,
        name: data.name,
        description: data.description,
        creatorName: data.creatorName,
        creatorImage: data.creatorImage,
        entries: data.entries || [],
        createdAt: timestampToDate(data.createdAt),
        updatedAt: timestampToDate(data.updatedAt),
        isPublic: data.isPublic || false,
        isEndorsed: data.isEndorsed || false,
        originalListId: data.originalListId,
        originalCreatorName: data.originalCreatorName,
        originalCreatorImage: data.originalCreatorImage,
      });
    });

    // Sort by updatedAt in JavaScript to avoid needing composite index
    lists.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());

    return lists;
  } catch (error) {
    console.error('Error getting user lists:', error);
    throw error;
  }
};

// Get a single list by ID
export const getList = async (listId: string): Promise<UserList | null> => {
  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    const listDoc = await getDoc(listRef);

    if (!listDoc.exists()) {
      return null;
    }

    const data = listDoc.data();
    return {
      id: listDoc.id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      creatorName: data.creatorName,
      creatorImage: data.creatorImage,
      entries: data.entries || [],
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
      isPublic: data.isPublic || false,
      isEndorsed: data.isEndorsed || false,
      originalListId: data.originalListId,
      originalCreatorName: data.originalCreatorName,
      originalCreatorImage: data.originalCreatorImage,
    };
  } catch (error) {
    console.error('Error getting list:', error);
    throw error;
  }
};

// Resolve a list - if it's a reference (has originalListId), fetch the original
// This ensures referenced lists always show live data from the source
export const resolveList = async (list: UserList): Promise<UserList> => {
  try {
    // If this list has no originalListId, it's not a reference - return as-is
    if (!list.originalListId) {
      return list;
    }

    // This is a reference list - fetch the original
    const originalList = await getList(list.originalListId);

    if (!originalList) {
      // Original list was deleted - return the reference with empty entries
      console.warn(`Original list ${list.originalListId} not found, returning empty reference`);
      return {
        ...list,
        entries: [],
      };
    }

    // Return a merged object: use original's entries and data, but keep reference metadata
    return {
      ...list, // Keep the reference's ID, userId (who added it), createdAt
      name: originalList.name, // Use original's current name
      description: originalList.description, // Use original's current description
      entries: originalList.entries, // Use original's current entries (live data!)
      updatedAt: originalList.updatedAt, // Use original's update time
      isPublic: originalList.isPublic, // Use original's privacy setting
      // Keep originalListId, originalCreatorName, originalCreatorImage from reference
    };
  } catch (error) {
    console.error('Error resolving list reference:', error);
    // On error, return the reference list with empty entries
    return {
      ...list,
      entries: [],
    };
  }
};

// Create a new list
export const createList = async (
  userId: string,
  name: string,
  description?: string,
  creatorName?: string,
  isEndorsed: boolean = false,
  originalListId?: string,
  originalCreatorName?: string,
  creatorImage?: string,
  originalCreatorImage?: string
): Promise<UserList> => {
  try {
    // Prevent creating multiple endorsed lists
    if (isEndorsed) {
      const existingEndorsementList = await getEndorsementList(userId);
      if (existingEndorsementList) {
        throw new Error('User already has an endorsement list');
      }
    }

    const listsRef = collection(db, LISTS_COLLECTION);
    const now = new Date();
    const newList = {
      userId,
      name,
      description: description || '',
      creatorName: creatorName || '',
      ...(creatorImage && { creatorImage }),
      entries: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: true, // Default to public
      isEndorsed,
      ...(originalListId && { originalListId }),
      ...(originalCreatorName && { originalCreatorName }),
      ...(originalCreatorImage && { originalCreatorImage }),
    };

    const docRef = await addDoc(listsRef, newList);

    // Return the full UserList object
    return {
      id: docRef.id,
      userId,
      name,
      description: description || '',
      creatorName: creatorName || '',
      ...(creatorImage && { creatorImage }),
      entries: [],
      createdAt: now,
      updatedAt: now,
      isPublic: true,
      isEndorsed,
      ...(originalListId && { originalListId }),
      ...(originalCreatorName && { originalCreatorName }),
      ...(originalCreatorImage && { originalCreatorImage }),
    };
  } catch (error) {
    console.error('Error creating list:', error);
    throw error;
  }
};

// Update list metadata (name, description)
export const updateListMetadata = async (
  listId: string,
  updates: { name?: string; description?: string; isPublic?: boolean }
): Promise<void> => {
  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating list metadata:', error);
    throw error;
  }
};

// Add entry to list
export const addEntryToList = async (
  listId: string,
  entry: Omit<ListEntry, 'id' | 'createdAt'>
): Promise<ListEntry> => {
  try {
    const list = await getList(listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Check for duplicates based on entry type (filter out null/undefined entries first)
    const isDuplicate = list.entries.filter(e => e).some((existingEntry) => {
      // For brands, check brandId
      if (entry.type === 'brand' && existingEntry.type === 'brand' && 'brandId' in entry && 'brandId' in existingEntry) {
        return entry.brandId === existingEntry.brandId;
      }
      // For businesses, check businessId
      if (entry.type === 'business' && existingEntry.type === 'business' && 'businessId' in entry && 'businessId' in existingEntry) {
        return entry.businessId === existingEntry.businessId;
      }
      // For values, check valueId and mode
      if (entry.type === 'value' && existingEntry.type === 'value' && 'valueId' in entry && 'valueId' in existingEntry && 'mode' in entry && 'mode' in existingEntry) {
        return entry.valueId === existingEntry.valueId && entry.mode === existingEntry.mode;
      }
      // For links, check url
      if (entry.type === 'link' && existingEntry.type === 'link' && 'url' in entry && 'url' in existingEntry) {
        return entry.url === existingEntry.url;
      }
      // For places, check placeId
      if (entry.type === 'place' && existingEntry.type === 'place' && 'placeId' in entry && 'placeId' in existingEntry) {
        return entry.placeId === existingEntry.placeId;
      }
      return false;
    });

    if (isDuplicate) {
      throw new Error('This item is already in the list');
    }

    const newEntry: ListEntry = {
      ...entry,
      id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    } as ListEntry;

    const updatedEntries = [...list.entries, newEntry];

    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      entries: updatedEntries,
      updatedAt: serverTimestamp(),
    });

    // Track endorsement history if this is an endorsement list
    if (list.isEndorsed && list.userId) {
      try {
        const position = updatedEntries.length; // New item added at the end
        let entityId = '';
        let entityName = '';

        if (entry.type === 'brand' && 'brandId' in entry) {
          entityId = entry.brandId;
          entityName = (entry as any).brandName || 'Unknown Brand';
        } else if (entry.type === 'business' && 'businessId' in entry) {
          entityId = entry.businessId;
          entityName = (entry as any).businessName || 'Unknown Business';
        } else if (entry.type === 'place' && 'placeId' in entry) {
          entityId = entry.placeId;
          entityName = (entry as any).placeName || 'Unknown Place';
        } else if (entry.type === 'value' && 'valueId' in entry) {
          entityId = entry.valueId;
          entityName = (entry as any).valueName || 'Unknown Value';
        }

        if (entityId && (entry.type === 'brand' || entry.type === 'business' || entry.type === 'place' || entry.type === 'value')) {
          await startEndorsementPeriod(
            list.userId,
            entry.type as 'brand' | 'business' | 'place' | 'value',
            entityId,
            entityName,
            position
          );
          console.log('[listService] Started endorsement period for', entityName);
        }
      } catch (historyError) {
        console.error('[listService] Error tracking endorsement history:', historyError);
        // Don't fail the main operation if history tracking fails
      }
    }

    // Return the newly created entry for optimistic updates
    return newEntry;
  } catch (error) {
    console.error('Error adding entry to list:', error);
    throw error;
  }
};

// Remove entry from list
export const removeEntryFromList = async (
  listId: string,
  entryId: string
): Promise<void> => {
  try {
    const list = await getList(listId);
    if (!list) {
      throw new Error('List not found');
    }

    // Find the entry being removed (for endorsement history tracking)
    const removedEntry = list.entries.find((entry) => entry.id === entryId);

    const updatedEntries = list.entries.filter((entry) => entry.id !== entryId);

    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      entries: updatedEntries,
      updatedAt: serverTimestamp(),
    });

    // Track endorsement history if this is an endorsement list
    if (list.isEndorsed && list.userId && removedEntry) {
      try {
        let entityId = '';
        const entryType = removedEntry.type;

        if (entryType === 'brand' && 'brandId' in removedEntry) {
          entityId = removedEntry.brandId;
        } else if (entryType === 'business' && 'businessId' in removedEntry) {
          entityId = removedEntry.businessId;
        } else if (entryType === 'value' && 'valueId' in removedEntry) {
          entityId = removedEntry.valueId;
        }

        if (entityId && (entryType === 'brand' || entryType === 'business' || entryType === 'value')) {
          await endEndorsementPeriod(
            list.userId,
            entryType as 'brand' | 'business' | 'value',
            entityId
          );
          console.log('[listService] Ended endorsement period for entry', entryId);
        }
      } catch (historyError) {
        console.error('[listService] Error tracking endorsement history:', historyError);
        // Don't fail the main operation if history tracking fails
      }
    }
  } catch (error) {
    console.error('Error removing entry from list:', error);
    throw error;
  }
};

// Update entry in list
export const updateEntryInList = async (
  listId: string,
  entryId: string,
  updates: Partial<ListEntry>
): Promise<void> => {
  try {
    const list = await getList(listId);
    if (!list) {
      throw new Error('List not found');
    }

    const updatedEntries = list.entries.map((entry) =>
      entry.id === entryId ? { ...entry, ...updates } : entry
    );

    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      entries: updatedEntries,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating entry in list:', error);
    throw error;
  }
};

// Delete a list
export const deleteList = async (listId: string): Promise<void> => {
  try {
    const listRef = doc(db, LISTS_COLLECTION, listId);
    await deleteDoc(listRef);
  } catch (error) {
    console.error('Error deleting list:', error);
    throw error;
  }
};

// Reorder entries in a list
export const reorderListEntries = async (
  listId: string,
  entries: ListEntry[]
): Promise<void> => {
  try {
    const list = await getList(listId);
    if (!list) {
      throw new Error('List not found');
    }

    const listRef = doc(db, LISTS_COLLECTION, listId);
    await updateDoc(listRef, {
      entries,
      updatedAt: serverTimestamp(),
    });

    // Track position changes for endorsement lists
    if (list.isEndorsed && list.userId) {
      try {
        // Update positions for all entries in the new order
        for (let i = 0; i < entries.length; i++) {
          const entry = entries[i];
          const newPosition = i + 1; // 1-indexed position

          let entityId = '';
          const entryType = entry.type;

          if (entryType === 'brand' && 'brandId' in entry) {
            entityId = entry.brandId;
          } else if (entryType === 'business' && 'businessId' in entry) {
            entityId = entry.businessId;
          } else if (entryType === 'value' && 'valueId' in entry) {
            entityId = entry.valueId;
          }

          if (entityId && (entryType === 'brand' || entryType === 'business' || entryType === 'value')) {
            await updateCurrentPosition(
              list.userId,
              entryType as 'brand' | 'business' | 'value',
              entityId,
              newPosition
            );
          }
        }
        console.log('[listService] Updated positions for', entries.length, 'entries');
      } catch (historyError) {
        console.error('[listService] Error tracking position changes:', historyError);
        // Don't fail the main operation if history tracking fails
      }
    }
  } catch (error) {
    console.error('Error reordering list entries:', error);
    throw error;
  }
};

// Get a user's endorsement list
export const getEndorsementList = async (userId: string): Promise<UserList | null> => {
  try {
    const listsRef = collection(db, LISTS_COLLECTION);
    const q = query(
      listsRef,
      where('userId', '==', userId),
      where('isEndorsed', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    const data = doc.data();

    return {
      id: doc.id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      creatorName: data.creatorName,
      entries: data.entries || [],
      createdAt: timestampToDate(data.createdAt),
      updatedAt: timestampToDate(data.updatedAt),
      isPublic: data.isPublic || false,
      isEndorsed: true,
      originalListId: data.originalListId,
      originalCreatorName: data.originalCreatorName,
    };
  } catch (error) {
    console.error('Error getting endorsement list:', error);
    throw error;
  }
};

// Ensure user has an endorsement list (create if doesn't exist)
export const ensureEndorsementList = async (
  userId: string,
  userName: string
): Promise<string> => {
  try {
    // Check if user already has an endorsement list
    const existingEndorsedList = await getEndorsementList(userId);

    if (existingEndorsedList) {
      return existingEndorsedList.id;
    }

    // Check if user has an existing "My List" to convert
    const allLists = await getUserLists(userId);
    const myList = allLists.find(list => list.name === 'My List');

    if (myList) {
      // Convert existing "My List" to endorsed list
      const listRef = doc(db, LISTS_COLLECTION, myList.id);
      await updateDoc(listRef, {
        name: userName, // Update name to user's actual name
        isEndorsed: true,
        isPublic: true, // Endorsement lists are public by default
        updatedAt: serverTimestamp(),
      });
      console.log('Converted existing "My List" to endorsement list:', myList.id);
      return myList.id;
    }

    // Create new endorsement list if no existing list found
    const listsRef = collection(db, LISTS_COLLECTION);
    const newList = {
      userId,
      name: userName, // User's name is the list name
      description: '',
      creatorName: userName,
      entries: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: true, // Endorsement lists are public by default
      isEndorsed: true,
    };

    const docRef = await addDoc(listsRef, newList);
    console.log('Created endorsement list for user:', userId);
    return docRef.id;
  } catch (error) {
    console.error('Error ensuring endorsement list:', error);
    throw error;
  }
};

// Copy a list to user's library
export const copyListToLibrary = async (
  sourceListId: string,
  targetUserId: string,
  targetUserName: string,
  originalCreatorImage?: string
): Promise<string> => {
  try {
    // Get the source list
    const sourceList = await getList(sourceListId);
    if (!sourceList) {
      throw new Error('Source list not found');
    }

    // Check if user already has this list in their library
    const userLists = await getUserLists(targetUserId);
    const alreadyHas = userLists.some(
      (list) => list.originalListId === sourceListId || list.id === sourceListId
    );

    if (alreadyHas) {
      throw new Error('You already have this list in your library');
    }

    // Create a copy in target user's library
    const listsRef = collection(db, LISTS_COLLECTION);
    const copiedList = {
      userId: targetUserId,
      name: sourceList.name,
      description: sourceList.description || '',
      creatorName: targetUserName,
      entries: [...sourceList.entries], // Copy all entries
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      isPublic: false, // Copied lists are private by default
      isEndorsed: false,
      originalListId: sourceList.id, // Track original
      originalCreatorName: sourceList.creatorName || 'Unknown',
      // Use the passed image, fallback to source list's image
      originalCreatorImage: originalCreatorImage || sourceList.creatorImage || sourceList.originalCreatorImage,
    };

    const docRef = await addDoc(listsRef, copiedList);
    console.log('Copied list to user library:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error copying list to library:', error);
    throw error;
  }
};
