import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  id: string;
  prompt: string;
  imageUrl: string;
  timestamp: number;
  seed: number;
  engine: string;
  aspectRatio: string;
}

interface WorkspaceState {
  currentEngine: 'puter' | 'pollinations' | 'perchance' | 'openai';
  activePrompt: string;
  negativePrompt: string;
  seed: number;
  aspectRatio: 'square' | 'portrait' | 'landscape';
  guidanceScale: number;
  memoryChips: string[];
  history: HistoryItem[];
  canvasConfig: {
    brushColor: string;
    brushSize: number;
    currentFilter: 'none' | 'grayscale' | 'sepia' | 'vintage' | 'saturation' | 'blur' | 'contrast';
  };
  // Personalisation states
  highContrast: boolean;
  fontSizeMultiplier: 'small' | 'normal' | 'large' | 'huge';
  dyslexicFriendlyFont: boolean;

  setEngine: (engine: 'puter' | 'pollinations' | 'perchance' | 'openai') => void;
  setPrompt: (prompt: string) => void;
  setNegativePrompt: (negativePrompt: string) => void;
  setSeed: (seed: number) => void;
  setAspectRatio: (aspectRatio: 'square' | 'portrait' | 'landscape') => void;
  setGuidanceScale: (guidanceScale: number) => void;
  addMemoryChip: (keyword: string) => void;
  removeMemoryChip: (keyword: string) => void;
  clearMemoryChips: () => void;
  addToHistory: (item: HistoryItem) => void;
  clearHistory: () => void;
  updateCanvasConfig: (config: Partial<WorkspaceState['canvasConfig']>) => void;
  
  // Personalisation actions
  setHighContrast: (contrast: boolean) => void;
  setFontSizeMultiplier: (size: 'small' | 'normal' | 'large' | 'huge') => void;
  setDyslexicFriendlyFont: (dyslexic: boolean) => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      currentEngine: 'puter',
      activePrompt: '',
      negativePrompt: '',
      seed: -1,
      aspectRatio: 'square',
      guidanceScale: 7.0,
      memoryChips: [],
      history: [],
      canvasConfig: {
        brushColor: '#7c4dff',
        brushSize: 8,
        currentFilter: 'none',
      },
      // Personalisation defaults
      highContrast: false,
      fontSizeMultiplier: 'normal',
      dyslexicFriendlyFont: false,

      setEngine: (engine) => set({ currentEngine: engine }),
      setPrompt: (prompt) => set({ activePrompt: prompt }),
      setNegativePrompt: (negativePrompt) => set({ negativePrompt }),
      setSeed: (seed) => set({ seed }),
      setAspectRatio: (aspectRatio) => set({ aspectRatio }),
      setGuidanceScale: (guidanceScale) => set({ guidanceScale }),
      addMemoryChip: (keyword) => set((state) => ({
        memoryChips: state.memoryChips.includes(keyword) ? state.memoryChips : [...state.memoryChips, keyword]
      })),
      removeMemoryChip: (keyword) => set((state) => ({
        memoryChips: state.memoryChips.filter((c) => c !== keyword)
      })),
      clearMemoryChips: () => set({ memoryChips: [] }),
      addToHistory: (item) => set((state) => ({ history: [item, ...state.history] })),
      clearHistory: () => set({ history: [] }),
      updateCanvasConfig: (config) => set((state) => ({
        canvasConfig: { ...state.canvasConfig, ...config }
      })),
      setHighContrast: (contrast) => set({ highContrast: contrast }),
      setFontSizeMultiplier: (size) => set({ fontSizeMultiplier: size }),
      setDyslexicFriendlyFont: (dyslexic) => set({ dyslexicFriendlyFont: dyslexic }),
    }),
    { name: 'aetherimage-workspace-storage' }
  )
);
