import { create } from 'zustand';
import { WordPressSiteInfo, PublishOptions } from './wordpress';

export type PublishStatus = 'idle' | 'testing' | 'publishing' | 'success' | 'error';

export interface WordPressState {
  // Site management
  defaultSite: WordPressSiteInfo | null;
  customSite: WordPressSiteInfo | null;
  useCustomSite: boolean;
  
  // Publishing state
  publishStatus: PublishStatus;
  publishError: string | null;
  publishResult: {
    postId?: number;
    url?: string;
    warnings?: string[];
  } | null;
  
  // Publishing options
  publishOptions: PublishOptions;
  
  // UI state
  showPublishModal: boolean;
  showSiteSettings: boolean;
  
  // Actions
  setDefaultSite: (site: WordPressSiteInfo | null) => void;
  setCustomSite: (site: WordPressSiteInfo | null) => void;
  setUseCustomSite: (use: boolean) => void;
  setPublishStatus: (status: PublishStatus) => void;
  setPublishError: (error: string | null) => void;
  setPublishResult: (result: WordPressState['publishResult']) => void;
  setPublishOptions: (options: Partial<PublishOptions>) => void;
  setShowPublishModal: (show: boolean) => void;
  setShowSiteSettings: (show: boolean) => void;
  reset: () => void;
  
  // Computed
  getCurrentSite: () => WordPressSiteInfo | null;
  canPublish: () => boolean;
}

const initialPublishOptions: PublishOptions = {
  status: 'draft',
  allowComments: true,
  categories: [],
  tags: []
};

const initialState = {
  defaultSite: null,
  customSite: null,
  useCustomSite: false,
  publishStatus: 'idle' as PublishStatus,
  publishError: null,
  publishResult: null,
  publishOptions: initialPublishOptions,
  showPublishModal: false,
  showSiteSettings: false,
};

export const useWordPressStore = create<WordPressState>((set, get) => ({
  ...initialState,
  
  setDefaultSite: (defaultSite) => set({ defaultSite }),
  setCustomSite: (customSite) => set({ customSite }),
  setUseCustomSite: (useCustomSite) => set({ useCustomSite }),
  setPublishStatus: (publishStatus) => set({ publishStatus }),
  setPublishError: (publishError) => set({ publishError }),
  setPublishResult: (publishResult) => set({ publishResult }),
  
  setPublishOptions: (options) => set((state) => ({
    publishOptions: { ...state.publishOptions, ...options }
  })),
  
  setShowPublishModal: (showPublishModal) => set({ showPublishModal }),
  setShowSiteSettings: (showSiteSettings) => set({ showSiteSettings }),
  
  reset: () => set(initialState),
  
  getCurrentSite: () => {
    const state = get();
    return state.useCustomSite ? state.customSite : state.defaultSite;
  },
  
  canPublish: () => {
    const state = get();
    const currentSite = state.getCurrentSite();
    return currentSite?.connected === true && state.publishStatus === 'idle';
  }
}));