/**
 * Zustand Store - Global state management for v2
 * Manages profiles, config, and activity log across extension contexts
 * Using vanilla Zustand (no React dependency)
 */

import { createStore } from 'zustand/vanilla';
import { AliasProfile, UserConfig, ActivityLogEntry } from './types';
import { StorageManager } from './storage';

interface AppState {
  // State
  profiles: AliasProfile[];
  config: UserConfig | null;
  activityLog: ActivityLogEntry[];
  isLoading: boolean;

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

  // Actions - Activity Log
  addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
  clearActivityLog: () => void;

  // Actions - Stats
  incrementStats: (data: {
    service: 'chatgpt' | 'claude' | 'gemini';
    substitutions: number;
  }) => Promise<void>;

  // Initialization
  initialize: () => Promise<void>;
}

export const useAppStore = createStore<AppState>((set, get) => ({
  // Initial state
  profiles: [],
  config: null,
  activityLog: [],
  isLoading: false,

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

    // Notify background script to reload profiles
    chrome.runtime.sendMessage({ type: 'RELOAD_PROFILES', payload: {} });
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

    // Notify background script to reload profiles
    chrome.runtime.sendMessage({ type: 'RELOAD_PROFILES', payload: {} });
  },

  deleteProfile: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.deleteProfile(id);
    set((state) => ({
      profiles: state.profiles.filter((p) => p.id !== id),
    }));

    // Notify background script to reload profiles
    chrome.runtime.sendMessage({ type: 'RELOAD_PROFILES', payload: {} });
  },

  toggleProfile: async (id) => {
    const storage = StorageManager.getInstance();
    await storage.toggleProfile(id);
    set((state) => ({
      profiles: state.profiles.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p
      ),
    }));

    // Notify background script to reload profiles
    chrome.runtime.sendMessage({ type: 'RELOAD_PROFILES', payload: {} });
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
    if (!currentConfig) return;

    const newConfig = {
      ...currentConfig,
      settings: { ...currentConfig.settings, ...updates },
    };

    const storage = StorageManager.getInstance();
    await storage.saveConfig(newConfig);
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
      const updatedConfig = {
        ...currentConfig,
        stats: {
          ...currentConfig.stats,
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

  // Initialization
  initialize: async () => {
    set({ isLoading: true });

    const storage = StorageManager.getInstance();
    await storage.initialize();

    const [profiles, config] = await Promise.all([
      storage.loadProfiles(),
      storage.loadConfig(),
    ]);

    set({
      profiles,
      config,
      activityLog: config?.stats.activityLog || [],
      isLoading: false,
    });

    console.log('[Store] Initialized with', profiles.length, 'profiles');
  },
}));

// Export typed selectors
export const getProfiles = () => useAppStore.getState().profiles;
export const getConfig = () => useAppStore.getState().config;
export const getActivityLog = () => useAppStore.getState().activityLog;
export const getIsLoading = () => useAppStore.getState().isLoading;
