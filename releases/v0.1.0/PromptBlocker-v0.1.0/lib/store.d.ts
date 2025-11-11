/**
 * Zustand Store - Global state management for v2
 * Manages profiles, config, and activity log across extension contexts
 * Using vanilla Zustand (no React dependency)
 */
import { AliasProfile, UserConfig, ActivityLogEntry, DocumentAlias } from './types';
import { User } from 'firebase/auth';
import { FirestoreUser } from './firebaseService';
interface AppState {
    profiles: AliasProfile[];
    config: UserConfig | null;
    activityLog: ActivityLogEntry[];
    isLoading: boolean;
    firestoreUser: FirestoreUser | null;
    documentAliases: DocumentAlias[];
    isLoadingDocuments: boolean;
    hasLoadedDocuments: boolean;
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
    loadConfig: () => Promise<void>;
    updateConfig: (updates: Partial<UserConfig>) => Promise<void>;
    updateSettings: (updates: Partial<UserConfig['settings']>) => Promise<void>;
    updateAccount: (updates: Partial<UserConfig['account']>) => Promise<void>;
    syncUserToFirestore: (user: User) => Promise<void>;
    loadUserTier: () => Promise<void>;
    clearAuthState: () => Promise<void>;
    addActivityLog: (entry: Omit<ActivityLogEntry, 'id' | 'timestamp'>) => void;
    clearActivityLog: () => void;
    incrementStats: (data: {
        service: 'chatgpt' | 'claude' | 'gemini';
        substitutions: number;
    }) => Promise<void>;
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
    initialize: () => Promise<void>;
}
export declare const useAppStore: import("zustand/vanilla").StoreApi<AppState>;
export declare const getProfiles: () => AliasProfile[];
export declare const getConfig: () => UserConfig | null;
export declare const getActivityLog: () => ActivityLogEntry[];
export declare const getIsLoading: () => boolean;
export {};
//# sourceMappingURL=store.d.ts.map