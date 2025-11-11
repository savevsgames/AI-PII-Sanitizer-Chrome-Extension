/**
 * Zustand Store - Global state management for v2
 * Manages profiles, config, and activity log across extension contexts
 * Using vanilla Zustand (no React dependency)
 */

import { createStore } from 'zustand/vanilla';
import { AliasProfile, UserConfig, ActivityLogEntry, DocumentAlias } from './types';
import { StorageManager } from './storage';
import { User } from 'firebase/auth';
import {
  syncUserToFirestore,
  getUserTier,
  getUserData,
  FirestoreUser,
} from './firebaseService';

interface AppState {
  // State
  profiles: AliasProfile[];
  config: UserConfig | null;
  activityLog: ActivityLogEntry[];
  isLoading: boolean;
  firestoreUser: FirestoreUser | null;
  documentAliases: DocumentAlias[];
  isLoadingDocuments: boolean;
  hasLoadedDocuments: boolean;

  // Actions - Profiles
  loadProfiles: () => Promise<void>;
  addProfile: (profileData: {
    profileName: string;
    description?: string;
    real: AliasProfile['real'];
    alias: AliasProfile['alias'];
    enabled?: boolean;
  }) => Promise<void>;
  updateProfile: (id: string, updates: Partial<AliasProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  toggleProfile: (id: string) => Promise<void>;

  // Actions - Config
  loadConfig: () => Promise<void>;
  updateConfig: (updates: Partial<UserConfig>) => Promise<void>;
  updateSettings: (updates: Partial<UserConfig['settings']>) => Promise<void>;
  updateAccount: (updates: Partial<UserConfig['account']>) => Promise<void>;

  // Actions - Firebase Auth
  syncUserToFirestore: (user: User) => Promise<void>;
  loadUserTier: () => Promise<void>;
  clearAuthState: () => Promise<void>;

  // Actions - Activity Log
  addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearActivityLog: () => void;

  // Actions - Stats
  incrementStats: (data: {
    service: 'chatgpt' | 'claude' | 'gemini';
    substitutions: number;
  }) => Promise<void>;

  // Actions - Prompt Templates
  addPromptTemplate: (templateData: {
    name: string;
    content: string;
    description?: string;
    category?: string;
    tags?: string[];
    profileId?: string;
  }) => Promise<void>;
  updatePromptTemplate: (id: string, updates: Partial<import('./types').PromptTemplate>) => Promise<void>;
  deletePromptTemplate: (id: string) => Promise<void>;
  incrementTemplateUsage: (id: string) => Promise<void>;

  // Actions - Document Analysis
  loadDocumentAliases: () => Promise<void>;
  addDocumentAlias: (documentData: Omit<DocumentAlias, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  deleteDocumentAlias: (id: string) => Promise<void>;
  incrementDocumentUsage: (id: string) => Promise<void>;
  getStorageQuota: () => Promise<{
    used: number;
    quota: number;
    percentage: number;
    hasUnlimitedStorage: boolean;
  }>;

  // Initialization
  initialize: () => Promise<void>;
}

export const useAppStore = createStore<AppState>((set, get) => ({
  // Initial state
  profiles: [],
  config: null,
  activityLog: [],
  isLoading: false,
  firestoreUser: null,
  documentAliases: [],
  isLoadingDocuments: false,
  hasLoadedDocuments: false,

  // Profile actions
  loadProfiles: async () => {
    const storage = StorageManager.getInstance();
    const profiles = await storage.loadProfiles();
    set({ profiles });
  },

  addProfile: async (profileData) => {
    const storage = StorageManager.getInstance();
    const newProfile = await storage.createProfile(profileData);
    set((state) => ({
      profiles: [...state.profiles, newProfile],
    }));

    // Send updated profiles to background worker
    const updatedProfiles = get().profiles;
    chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
  },

  updateProfile: async (id, updates) => {
    const storage = StorageManager.getInstance();
    await storage.updateProfile(id, updates);
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === id
          ? { ...p, ...updates, metadata: { ...p.metadata, updatedAt: Date.now() } }
          : p
      ),
    }));

    // Send updated profiles to background worker
    const updatedProfiles = get().profiles;
    chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
  },

  deleteProfile: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.deleteProfile(id);
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
    }));

    // Send updated profiles to background worker
    const updatedProfiles = get().profiles;
    chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
  },

  toggleProfile: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.toggleProfile(id);
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    }));

    // Send updated profiles to background worker
    const updatedProfiles = get().profiles;
    chrome.runtime.sendMessage({ type: 'SET_PROFILES', payload: updatedProfiles });
  },

  // Config actions
  loadConfig: async () => {
    const storage = StorageManager.getInstance();
    const config = await storage.loadConfig();
    set({
      config,
      activityLog: config?.stats.activityLog || [],
    });
  },

  updateConfig: async (updates) => {
    const storage = StorageManager.getInstance();
    const currentConfig = get().config;
    if (!currentConfig) return;

    const newConfig = { ...currentConfig, ...updates };
    await storage.saveConfig(newConfig);
    set({ config: newConfig });
  },

  updateSettings: async (updates) => {
    const currentConfig = get().config;
    if (!currentConfig) {
      console.error('[Theme Debug] ❌ Cannot update settings: no config loaded');
      return;
    }

    console.log('[Theme Debug] 💾 Updating settings in store:', updates);

    const newConfig = {
      ...currentConfig,
      settings: { ...currentConfig.settings, ...updates },
    };

    const storage = StorageManager.getInstance();
    await storage.saveConfig(newConfig);

    console.log('[Theme Debug] ✅ Settings saved to chrome.storage.local:', {
      theme: newConfig.settings.theme
    });

    set({ config: newConfig });
  },

  updateAccount: async (updates) => {
    const currentConfig = get().config;
    if (!currentConfig) return;

    const newConfig = {
      ...currentConfig,
      account: { ...currentConfig.account, ...updates } as UserConfig['account'],
    };

    const storage = StorageManager.getInstance();
    await storage.saveConfig(newConfig);
    set({ config: newConfig });
  },

  // Firebase Auth actions
  syncUserToFirestore: async (user) => {
    try {
      const firestoreUser = await syncUserToFirestore(user);
      set({ firestoreUser });

      // Update local config with Firebase user info
      await get().updateAccount({
        email: user.email || undefined,
        firebaseUid: user.uid,
        displayName: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
        tier: firestoreUser.tier,
      });

      console.log('[Store] User synced to Firestore:', user.uid);
    } catch (error) {
      console.error('[Store] Error syncing user to Firestore:', error);
      throw error;
    }
  },

  loadUserTier: async () => {
    const currentConfig = get().config;
    const firebaseUid = currentConfig?.account?.firebaseUid;

    if (!firebaseUid) {
      console.warn('[Store] No Firebase UID found, cannot load tier');
      return;
    }

    try {
      const [tier, userData] = await Promise.all([
        getUserTier(firebaseUid),
        getUserData(firebaseUid),
      ]);

      if (userData) {
        set({ firestoreUser: userData });
      }

      await get().updateAccount({ tier });

      console.log('[Store] User tier loaded:', tier);
    } catch (error) {
      console.error('[Store] Error loading user tier:', error);
    }
  },

  clearAuthState: async () => {
    set({ firestoreUser: null });

    await get().updateAccount({
      email: undefined,
      firebaseUid: undefined,
      displayName: undefined,
      photoURL: undefined,
      tier: 'free',
    });

    console.log('[Store] Auth state cleared');
  },

  // Activity log actions
  addActivityLog: (entry) => {
    const newEntry: ActivityLogEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    set((state) => ({
      activityLog: [newEntry, ...state.activityLog].slice(0, 100), // Keep last 100
    }));

    // Also save to config.stats.activityLog
    const currentConfig = get().config;
    if (currentConfig) {
      const updatedStats = { ...currentConfig.stats };

      // Auto-increment totals for substitution entries
      if (entry.type === 'substitution') {
        const substitutionCount = entry.details?.substitutionCount || 0;
        updatedStats.totalSubstitutions += substitutionCount;
        updatedStats.totalInterceptions += 1;

        // Also update by-service stats if available
        if (entry.service && updatedStats.byService[entry.service as keyof typeof updatedStats.byService]) {
          const serviceStats = updatedStats.byService[entry.service as keyof typeof updatedStats.byService];
          serviceStats.requests += 1;
          serviceStats.substitutions += substitutionCount;
        }
      }

      const updatedConfig = {
        ...currentConfig,
        stats: {
          ...updatedStats,
          activityLog: [newEntry, ...currentConfig.stats.activityLog].slice(0, 100),
        },
      };

      const storage = StorageManager.getInstance();
      storage.saveConfig(updatedConfig).then(() => {
        set({ config: updatedConfig });
      });
    }
  },

  clearActivityLog: () => {
    set({ activityLog: [] });

    // Also clear from config
    const currentConfig = get().config;
    if (currentConfig) {
      const updatedConfig = {
        ...currentConfig,
        stats: {
          ...currentConfig.stats,
          activityLog: [],
        },
      };

      const storage = StorageManager.getInstance();
      storage.saveConfig(updatedConfig).then(() => {
        set({ config: updatedConfig });
      });
    }
  },

  // Stats actions
  incrementStats: async (data) => {
    const currentConfig = get().config;
    if (!currentConfig) return;

    const updatedConfig = {
      ...currentConfig,
      stats: {
        ...currentConfig.stats,
        totalSubstitutions: currentConfig.stats.totalSubstitutions + data.substitutions,
        totalInterceptions: currentConfig.stats.totalInterceptions + 1,
        byService: {
          ...currentConfig.stats.byService,
          [data.service]: {
            requests: currentConfig.stats.byService[data.service].requests + 1,
            substitutions:
              currentConfig.stats.byService[data.service].substitutions + data.substitutions,
          },
        },
      },
    };

    const storage = StorageManager.getInstance();
    await storage.saveConfig(updatedConfig);
    set({ config: updatedConfig });
  },

  // Prompt Template actions
  addPromptTemplate: async (templateData) => {
    const storage = StorageManager.getInstance();
    try {
      const newTemplate = await storage.addPromptTemplate(templateData);
      // Reload config to get updated templates
      const config = await storage.loadConfig();
      set({ config });
      console.log('[Store] Added prompt template:', newTemplate.name);
    } catch (error: any) {
      console.error('[Store] Error adding template:', error);
      // Re-throw to let UI handle (e.g., show upgrade prompt)
      throw error;
    }
  },

  updatePromptTemplate: async (id, updates) => {
    const storage = StorageManager.getInstance();
    await storage.updatePromptTemplate(id, updates);
    // Reload config to get updated templates
    const config = await storage.loadConfig();
    set({ config });
    console.log('[Store] Updated prompt template:', id);
  },

  deletePromptTemplate: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.removePromptTemplate(id);
    // Reload config to get updated templates
    const config = await storage.loadConfig();
    set({ config });
    console.log('[Store] Deleted prompt template:', id);
  },

  incrementTemplateUsage: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.incrementTemplateUsage(id);
    // Reload config to get updated templates
    const config = await storage.loadConfig();
    set({ config });
  },

  // Document Analysis actions
  loadDocumentAliases: async () => {
    set({ isLoadingDocuments: true });
    const storage = StorageManager.getInstance();
    try {
      const documentAliases = await storage.loadDocumentAliases();
      set({ documentAliases, isLoadingDocuments: false, hasLoadedDocuments: true });
      console.log('[Store] Loaded', documentAliases.length, 'document aliases');
    } catch (error) {
      console.error('[Store] Error loading document aliases:', error);
      set({ documentAliases: [], isLoadingDocuments: false, hasLoadedDocuments: true });
    }
  },

  addDocumentAlias: async (documentData) => {
    const storage = StorageManager.getInstance();

    const newDocumentAlias: DocumentAlias = {
      ...documentData,
      id: `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    await storage.saveDocumentAlias(newDocumentAlias);

    set((state) => ({
      documentAliases: [newDocumentAlias, ...state.documentAliases],
    }));

    console.log('[Store] Document alias saved:', newDocumentAlias.id);
  },

  deleteDocumentAlias: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.deleteDocumentAlias(id);

    set((state) => ({
      documentAliases: state.documentAliases.filter((d) => d.id !== id),
    }));

    console.log('[Store] Document alias deleted:', id);
  },

  incrementDocumentUsage: async (id) => {
    const storage = StorageManager.getInstance();

    set((state) => {
      const updated = state.documentAliases.map((d) =>
        d.id === id
          ? { ...d, usageCount: d.usageCount + 1, lastUsed: Date.now(), updatedAt: Date.now() }
          : d
      );

      // Save updated document alias
      const document = updated.find((d) => d.id === id);
      if (document) {
        storage.updateDocumentAlias(document);
      }

      return { documentAliases: updated };
    });
  },

  getStorageQuota: async () => {
    const storage = StorageManager.getInstance();
    return await storage.getStorageQuota();
  },

  // Initialization
  initialize: async () => {
    console.log('[Theme Debug] 🚀 Store initialization starting...');
    set({ isLoading: true });

    const storage = StorageManager.getInstance();
    await storage.initialize();

    try {
      const [profiles, config] = await Promise.all([
        storage.loadProfiles(),
        storage.loadConfig(),
      ]);

      console.log('[Theme Debug] 📦 Config loaded from storage:', {
        hasConfig: !!config,
        theme: config?.settings?.theme || 'none',
        enabled: config?.settings?.enabled
      });

      set({
        profiles,
        config,
        activityLog: config?.stats.activityLog || [],
        isLoading: false,
      });

      console.log('[Theme Debug] ✅ Store state updated with loaded config');

      console.log('[Store] Initialized with', profiles.length, 'profiles');
    } catch (error) {
      // If user not authenticated, load config only (profiles require encryption)
      if (error instanceof Error && error.message.includes('ENCRYPTION_KEY_UNAVAILABLE')) {
        console.log('[Store] User not authenticated - loading config only');

        // Config is not encrypted, can still be loaded
        const config = await storage.loadConfig();

        set({
          profiles: [],  // No profiles without authentication
          config,
          activityLog: config?.stats.activityLog || [],
          isLoading: false,
        });

        console.log('[Store] Initialized with default state (user not authenticated)');
      } else {
        // Unexpected error - set safe defaults
        console.error('[Store] Unexpected error during initialization:', error);
        set({
          profiles: [],
          config: null,
          activityLog: [],
          isLoading: false,
        });
      }
    }
  },
}));

// Export typed selectors
export const getProfiles = () => useAppStore.getState().profiles;
export const getConfig = () => useAppStore.getState().config;
export const getActivityLog = () => useAppStore.getState().activityLog;
export const getIsLoading = () => useAppStore.getState().isLoading;
