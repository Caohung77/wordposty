import { create } from 'zustand';
import { SourceAnalysis } from './perplexity';
import { BlogGeneration } from './claude';

export type WorkflowStatus = 'idle' | 'analyzing' | 'generating' | 'completed' | 'error';

export interface WorkflowState {
  // Status tracking
  status: WorkflowStatus;
  currentStep: 'sources' | 'analysis' | 'generation' | 'completed';
  progress: number;
  
  // Input data
  sources: string[];
  topic: string;
  wordCount: number;
  tone: string;
  targetAudience: string;
  customPrompt: string;
  
  // Analysis results
  sourceAnalysis: SourceAnalysis | null;
  analysisError: string | null;
  
  // Generation results
  blogGeneration: BlogGeneration | null;
  generationError: string | null;
  
  // Actions
  setInputs: (inputs: Partial<Pick<WorkflowState, 'sources' | 'topic' | 'wordCount' | 'tone' | 'targetAudience' | 'customPrompt'>>) => void;
  setStatus: (status: WorkflowStatus) => void;
  setCurrentStep: (step: WorkflowState['currentStep']) => void;
  setProgress: (progress: number) => void;
  setSourceAnalysis: (analysis: SourceAnalysis) => void;
  setAnalysisError: (error: string | null) => void;
  setBlogGeneration: (generation: BlogGeneration) => void;
  setGenerationError: (error: string | null) => void;
  reset: () => void;
  
  // Workflow orchestration
  canStartAnalysis: () => boolean;
  canStartGeneration: () => boolean;
  getWorkflowSummary: () => {
    hasSource: boolean;
    hasTopic: boolean;
    hasAnalysis: boolean;
    hasBlogPost: boolean;
    currentStatus: WorkflowStatus;
    currentStep: 'sources' | 'analysis' | 'generation' | 'completed';
    progress: number;
    errors: {
      analysis: string | null;
      generation: string | null;
    };
  };
}

const initialState = {
  status: 'idle' as WorkflowStatus,
  currentStep: 'sources' as const,
  progress: 0,
  sources: [],
  topic: '',
  wordCount: 800,
  tone: 'conversational',
  targetAudience: 'general audience',
  customPrompt: '',
  sourceAnalysis: null,
  analysisError: null,
  blogGeneration: null,
  generationError: null,
};

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  ...initialState,
  
  setInputs: (inputs) => set((state) => ({ ...state, ...inputs })),
  
  setStatus: (status) => set({ status }),
  
  setCurrentStep: (currentStep) => {
    const stepProgress = {
      sources: 0,
      analysis: 25,
      generation: 75,
      completed: 100,
    };
    
    set({ 
      currentStep, 
      progress: stepProgress[currentStep] 
    });
  },
  
  setProgress: (progress) => set({ progress }),
  
  setSourceAnalysis: (sourceAnalysis) => set({ 
    sourceAnalysis, 
    analysisError: null 
  }),
  
  setAnalysisError: (analysisError) => set({ 
    analysisError, 
    sourceAnalysis: null 
  }),
  
  setBlogGeneration: (blogGeneration) => set({ 
    blogGeneration, 
    generationError: null 
  }),
  
  setGenerationError: (generationError) => set({ 
    generationError, 
    blogGeneration: null 
  }),
  
  reset: () => set(initialState),

  // Workflow orchestration methods
  canStartAnalysis: () => {
    const state = get();
    return state.sources.length > 0 && 
           state.topic.trim().length > 0 && 
           state.status === 'idle';
  },

  canStartGeneration: () => {
    const state = get();
    return state.sourceAnalysis && 
           !state.analysisError && 
           (state.status === 'idle' || state.status === 'completed');
  },

  // Get workflow summary
  getWorkflowSummary: () => {
    const state = get();
    return {
      hasSource: state.sources.length > 0,
      hasTopic: state.topic.trim().length > 0,
      hasAnalysis: !!state.sourceAnalysis,
      hasBlogPost: !!state.blogGeneration,
      currentStatus: state.status,
      currentStep: state.currentStep,
      progress: state.progress,
      errors: {
        analysis: state.analysisError,
        generation: state.generationError
      }
    };
  }
}));