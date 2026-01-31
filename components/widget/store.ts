/**
 * QETTA Widget v2.0 Store
 *
 * Zustand store for wizard state management
 */

import { create } from 'zustand'
import type {
  WizardState,
  WidgetDocumentType,
  ProgressPhase,
  ProgressState,
  GeneratedWidgetDocument,
  PartnerConfig,
} from './types'
import type { EnginePresetType } from '@/lib/document-generator/types'

// ============================================
// Wizard Store
// ============================================

interface WizardStore extends WizardState {
  // Actions
  setDocumentType: (type: WidgetDocumentType, preset: EnginePresetType) => void
  setInputData: (data: Record<string, unknown>) => void
  updateInputField: (field: string, value: unknown) => void
  nextStep: () => void
  prevStep: () => void
  setDocument: (doc: GeneratedWidgetDocument) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialWizardState: WizardState = {
  currentStep: 1,
  totalSteps: 4,
  documentType: null,
  enginePreset: null,
  inputData: {},
  document: null,
  error: null,
}

export const useWizardStore = create<WizardStore>((set) => ({
  ...initialWizardState,

  setDocumentType: (type, preset) =>
    set({ documentType: type, enginePreset: preset, error: null }),

  setInputData: (data) =>
    set({ inputData: data }),

  updateInputField: (field, value) =>
    set((state) => ({
      inputData: { ...state.inputData, [field]: value },
    })),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, state.totalSteps),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  setDocument: (doc) =>
    set({ document: doc, currentStep: 4 }),

  setError: (error) =>
    set({ error }),

  reset: () =>
    set(initialWizardState),
}))

// ============================================
// Progress Store
// ============================================

interface ProgressStore extends ProgressState {
  // Actions
  startProgress: () => void
  setPhase: (phase: ProgressPhase, message: string) => void
  setProgress: (progress: number) => void
  complete: () => void
  reset: () => void
}

const initialProgressState: ProgressState = {
  phase: 'validating',
  progress: 0,
  message: '준비 중...',
  estimatedTimeRemaining: 0,
  startedAt: 0,
}

export const useProgressStore = create<ProgressStore>((set) => ({
  ...initialProgressState,

  startProgress: () =>
    set({
      phase: 'validating',
      progress: 0,
      message: '데이터 검증 중...',
      startedAt: Date.now(),
      estimatedTimeRemaining: 60,
    }),

  setPhase: (phase, message) =>
    set((state) => {
      const phaseProgress: Record<ProgressPhase, number> = {
        validating: 10,
        analyzing: 30,
        generating: 60,
        rendering: 85,
        complete: 100,
      }
      return {
        phase,
        message,
        progress: phaseProgress[phase],
        estimatedTimeRemaining: Math.max(
          0,
          state.estimatedTimeRemaining - (Date.now() - state.startedAt) / 1000
        ),
      }
    }),

  setProgress: (progress) =>
    set({ progress }),

  complete: () =>
    set({
      phase: 'complete',
      progress: 100,
      message: '완료!',
      estimatedTimeRemaining: 0,
    }),

  reset: () =>
    set(initialProgressState),
}))

// ============================================
// Theme Store (Whitelabel)
// ============================================

interface ThemeStore {
  partnerId: string | null
  partnerName: string
  logoUrl: string | null
  colors: {
    primary: string
    secondary: string
    accent: string
  }
  setPartnerConfig: (config: PartnerConfig) => void
  reset: () => void
}

const defaultColors = {
  primary: '#8B5CF6',    // Violet
  secondary: '#6366F1',  // Indigo
  accent: '#EC4899',     // Pink
}

export const useThemeStore = create<ThemeStore>((set) => ({
  partnerId: null,
  partnerName: 'QETTA',
  logoUrl: null,
  colors: defaultColors,

  setPartnerConfig: (config) =>
    set({
      partnerId: config.partnerId,
      partnerName: config.partnerName,
      logoUrl: config.logoUrl || null,
      colors: {
        primary: config.brandColor,
        secondary: config.secondaryColor || config.brandColor,
        accent: config.secondaryColor || defaultColors.accent,
      },
    }),

  reset: () =>
    set({
      partnerId: null,
      partnerName: 'QETTA',
      logoUrl: null,
      colors: defaultColors,
    }),
}))
