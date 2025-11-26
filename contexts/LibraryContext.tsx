/**
 * LibraryContext - Centralized state management for user's library
 * Manages ONE library per user with multiple lists (endorsement, aligned, unaligned, custom)
 * Used across Home tab, Profile tab, and User profile pages
 */
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { UserList, ListEntry } from '@/types/library';
import {
  getUserLists,
  createList,
  deleteList,
  addEntryToList,
  removeEntryFromList,
  updateListMetadata,
  reorderListEntries,
  getEndorsementList,
  ensureEndorsementList,
  resolveList,
  getList,
} from '@/services/firebase/listService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ===== Types =====

interface LibraryState {
  // Data
  userLists: UserList[];
  endorsementList: UserList | null;

  // UI State
  expandedListId: string | null;
  selectedListId: string | null;
  isLoading: boolean;
  error: string | null;

  // Edit Mode
  isEditMode: boolean;
  isReorderMode: boolean;

  // First-time user experience
  hasSetDefaultExpansion: boolean;
}

type LibraryAction =
  | { type: 'SET_LISTS'; payload: UserList[] }
  | { type: 'SET_ENDORSEMENT_LIST'; payload: UserList | null }
  | { type: 'ADD_LIST'; payload: UserList }
  | { type: 'UPDATE_LIST'; payload: { listId: string; updates: Partial<UserList> } }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SET_EXPANDED_LIST'; payload: string | null }
  | { type: 'SET_SELECTED_LIST'; payload: string | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_EDIT_MODE'; payload: boolean }
  | { type: 'SET_REORDER_MODE'; payload: boolean }
  | { type: 'SET_DEFAULT_EXPANSION'; payload: boolean }
  | { type: 'TOGGLE_LIST_EXPANSION'; payload: string }
  | { type: 'ADD_ENTRY_TO_LIST'; payload: { listId: string; entry: ListEntry } }
  | { type: 'REMOVE_ENTRY_FROM_LIST'; payload: { listId: string; entryId: string } }
  | { type: 'REORDER_ENTRIES'; payload: { listId: string; entries: ListEntry[] } };

interface LibraryContextValue {
  state: LibraryState;

  // Data operations
  loadUserLists: (userId: string, forceRefresh?: boolean) => Promise<void>;
  createNewList: (userId: string, name: string, description?: string, creatorName?: string, isEndorsed?: boolean, originalListId?: string, originalCreatorName?: string, creatorImage?: string, originalCreatorImage?: string) => Promise<UserList>;
  updateList: (listId: string, updates: Partial<UserList>) => Promise<void>;
  removeList: (listId: string) => Promise<void>;

  // Entry operations
  addEntry: (listId: string, entry: Omit<ListEntry, 'id'>) => Promise<void>;
  removeEntry: (listId: string, entryId: string) => Promise<void>;
  reorderEntries: (listId: string, entries: ListEntry[]) => Promise<void>;

  // UI operations
  toggleListExpansion: (listId: string) => void;
  setExpandedList: (listId: string | null) => void;
  setSelectedList: (listId: string | null) => void;
  setEditMode: (enabled: boolean) => void;
  setReorderMode: (enabled: boolean) => void;

  // Utility
  getListById: (listId: string) => UserList | null;
  clearError: () => void;
}

// ===== Reducer =====

const initialState: LibraryState = {
  userLists: [],
  endorsementList: null,
  expandedListId: null,
  selectedListId: null,
  isLoading: false,
  error: null,
  isEditMode: false,
  isReorderMode: false,
  hasSetDefaultExpansion: false,
};

function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  switch (action.type) {
    case 'SET_LISTS':
      return { ...state, userLists: action.payload, isLoading: false };

    case 'SET_ENDORSEMENT_LIST':
      return { ...state, endorsementList: action.payload };

    case 'ADD_LIST':
      return { ...state, userLists: [...state.userLists, action.payload] };

    case 'UPDATE_LIST':
      return {
        ...state,
        userLists: state.userLists.map(list =>
          list.id === action.payload.listId
            ? { ...list, ...action.payload.updates }
            : list
        ),
        endorsementList:
          state.endorsementList?.id === action.payload.listId
            ? { ...state.endorsementList, ...action.payload.updates }
            : state.endorsementList,
      };

    case 'DELETE_LIST':
      return {
        ...state,
        userLists: state.userLists.filter(list => list.id !== action.payload),
        expandedListId: state.expandedListId === action.payload ? null : state.expandedListId,
        selectedListId: state.selectedListId === action.payload ? null : state.selectedListId,
      };

    case 'SET_EXPANDED_LIST':
      return { ...state, expandedListId: action.payload };

    case 'SET_SELECTED_LIST':
      return { ...state, selectedListId: action.payload };

    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'SET_EDIT_MODE':
      return { ...state, isEditMode: action.payload };

    case 'SET_REORDER_MODE':
      return { ...state, isReorderMode: action.payload };

    case 'SET_DEFAULT_EXPANSION':
      return { ...state, hasSetDefaultExpansion: action.payload };

    case 'TOGGLE_LIST_EXPANSION':
      return {
        ...state,
        selectedListId: action.payload,
        expandedListId: state.expandedListId === action.payload ? null : action.payload,
      };

    case 'ADD_ENTRY_TO_LIST':
      return {
        ...state,
        userLists: state.userLists.map(list =>
          list.id === action.payload.listId
            ? { ...list, entries: [...list.entries, action.payload.entry] }
            : list
        ),
        endorsementList:
          state.endorsementList?.id === action.payload.listId
            ? {
                ...state.endorsementList,
                entries: [...state.endorsementList.entries, action.payload.entry],
              }
            : state.endorsementList,
      };

    case 'REMOVE_ENTRY_FROM_LIST':
      return {
        ...state,
        userLists: state.userLists.map(list =>
          list.id === action.payload.listId
            ? {
                ...list,
                entries: list.entries.filter(e => e && e.id !== action.payload.entryId),
              }
            : list
        ),
        endorsementList:
          state.endorsementList?.id === action.payload.listId
            ? {
                ...state.endorsementList,
                entries: state.endorsementList.entries.filter(
                  e => e && e.id !== action.payload.entryId
                ),
              }
            : state.endorsementList,
      };

    case 'REORDER_ENTRIES':
      return {
        ...state,
        userLists: state.userLists.map(list =>
          list.id === action.payload.listId
            ? { ...list, entries: action.payload.entries }
            : list
        ),
        endorsementList:
          state.endorsementList?.id === action.payload.listId
            ? { ...state.endorsementList, entries: action.payload.entries }
            : state.endorsementList,
      };

    default:
      return state;
  }
}

// ===== Context =====

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

// ===== Provider =====

interface LibraryProviderProps {
  children: React.ReactNode;
  userId: string | undefined;
  userName?: string; // User's name for endorsement list creation
  autoLoad?: boolean; // Automatically load lists when userId changes
}

export function LibraryProvider({ children, userId, userName, autoLoad = true }: LibraryProviderProps) {
  const [state, dispatch] = useReducer(libraryReducer, initialState);

  // Load user lists when userId changes
  useEffect(() => {
    if (autoLoad && userId) {
      loadUserLists(userId);
    }
  }, [userId, autoLoad]);

  // ===== Data Operations =====

  const loadUserLists = useCallback(async (uid: string, forceRefresh = false) => {
    if (!uid) return;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Load all user lists
      const lists = await getUserLists(uid);

      // Resolve all lists - if any are references (have originalListId),
      // fetch the current data from the original list
      const resolvedLists = await Promise.all(
        lists.map(list => resolveList(list))
      );

      dispatch({ type: 'SET_LISTS', payload: resolvedLists });

      // Get or create endorsement list
      let endorsementList = await getEndorsementList(uid);
      if (!endorsementList && userName) {
        // ensureEndorsementList returns a list ID (string), so we need to fetch the full list
        const listId = await ensureEndorsementList(uid, userName);
        endorsementList = await getList(listId);
      }
      dispatch({ type: 'SET_ENDORSEMENT_LIST', payload: endorsementList });

      // Set default expansion for first-time users
      if (!state.hasSetDefaultExpansion && endorsementList) {
        const firstTimeKey = `firstTimeLibraryVisit_${uid}`;
        const isFirstTime = await AsyncStorage.getItem(firstTimeKey);

        if (isFirstTime === null) {
          // First time: expand aligned list
          dispatch({ type: 'SET_EXPANDED_LIST', payload: 'aligned' });
          dispatch({ type: 'SET_SELECTED_LIST', payload: 'aligned' });
          await AsyncStorage.setItem(firstTimeKey, 'false');
        } else {
          // Not first time: select endorsed list but keep collapsed
          dispatch({ type: 'SET_EXPANDED_LIST', payload: null });
          dispatch({ type: 'SET_SELECTED_LIST', payload: 'endorsement' });
        }
        dispatch({ type: 'SET_DEFAULT_EXPANSION', payload: true });
      }
    } catch (error) {
      console.error('[LibraryContext] Error loading user lists:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load library' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [state.hasSetDefaultExpansion, userName]);

  const createNewList = useCallback(async (
    uid: string,
    name: string,
    description?: string,
    creatorName?: string,
    isEndorsed?: boolean,
    originalListId?: string,
    originalCreatorName?: string,
    creatorImage?: string,
    originalCreatorImage?: string
  ): Promise<UserList> => {
    if (!uid) throw new Error('User ID is required');

    try {
      const newList = await createList(uid, name, description, creatorName, isEndorsed, originalListId, originalCreatorName, creatorImage, originalCreatorImage);
      dispatch({ type: 'ADD_LIST', payload: newList });
      return newList;
    } catch (error) {
      console.error('[LibraryContext] Error creating list:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to create list' });
      throw error;
    }
  }, []);

  const updateList = useCallback(async (listId: string, updates: Partial<UserList>) => {
    try {
      await updateListMetadata(listId, updates);
      dispatch({ type: 'UPDATE_LIST', payload: { listId, updates } });
    } catch (error) {
      console.error('[LibraryContext] Error updating list:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to update list' });
      throw error;
    }
  }, []);

  const removeList = useCallback(async (listId: string) => {
    try {
      await deleteList(listId);
      dispatch({ type: 'DELETE_LIST', payload: listId });
    } catch (error) {
      console.error('[LibraryContext] Error deleting list:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to delete list' });
      throw error;
    }
  }, []);

  // ===== Entry Operations =====

  const addEntry = useCallback(async (listId: string, entry: Omit<ListEntry, 'id'>) => {
    try {
      const newEntry = await addEntryToList(listId, entry);
      dispatch({ type: 'ADD_ENTRY_TO_LIST', payload: { listId, entry: newEntry } });
    } catch (error) {
      console.error('[LibraryContext] Error adding entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to add item' });
      throw error;
    }
  }, []);

  const removeEntry = useCallback(async (listId: string, entryId: string) => {
    try {
      await removeEntryFromList(listId, entryId);
      dispatch({ type: 'REMOVE_ENTRY_FROM_LIST', payload: { listId, entryId } });
    } catch (error) {
      console.error('[LibraryContext] Error removing entry:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to remove item' });
      throw error;
    }
  }, []);

  const reorderEntries = useCallback(async (listId: string, entries: ListEntry[]) => {
    try {
      await reorderListEntries(listId, entries);
      dispatch({ type: 'REORDER_ENTRIES', payload: { listId, entries } });
    } catch (error) {
      console.error('[LibraryContext] Error reordering entries:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to reorder items' });
      throw error;
    }
  }, []);

  // ===== UI Operations =====

  const toggleListExpansion = useCallback((listId: string) => {
    dispatch({ type: 'TOGGLE_LIST_EXPANSION', payload: listId });
  }, []);

  const setExpandedList = useCallback((listId: string | null) => {
    dispatch({ type: 'SET_EXPANDED_LIST', payload: listId });
  }, []);

  const setSelectedList = useCallback((listId: string | null) => {
    dispatch({ type: 'SET_SELECTED_LIST', payload: listId });
  }, []);

  const setEditMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_EDIT_MODE', payload: enabled });
  }, []);

  const setReorderMode = useCallback((enabled: boolean) => {
    dispatch({ type: 'SET_REORDER_MODE', payload: enabled });
  }, []);

  // ===== Utility =====

  const getListById = useCallback((listId: string): UserList | null => {
    if (listId === 'endorsement') return state.endorsementList;
    return state.userLists.find(list => list.id === listId) || null;
  }, [state.userLists, state.endorsementList]);

  const clearError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const value: LibraryContextValue = {
    state,
    loadUserLists,
    createNewList,
    updateList,
    removeList,
    addEntry,
    removeEntry,
    reorderEntries,
    toggleListExpansion,
    setExpandedList,
    setSelectedList,
    setEditMode,
    setReorderMode,
    getListById,
    clearError,
  };

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

// ===== Hook =====

export function useLibrary() {
  const context = useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}
