'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useMonitorDataStore } from '@/stores/monitor-data-store'

/**
 * Equipment Selection Context
 *
 * Synchronizes selected equipment state across all 3 columns:
 * - Equipment List (left)
 * - Widget Dashboard (center)
 * - Detail Panel (right)
 *
 * This ensures when user selects equipment in Equipment List,
 * both Widget Dashboard and Detail Panel update immediately.
 */

interface EquipmentSelectionContextValue {
  selectedEquipmentId: string | null
  setSelectedEquipment: (equipmentId: string | null) => void
}

const EquipmentSelectionContext =
  createContext<EquipmentSelectionContextValue | null>(null)

export function EquipmentSelectionProvider({
  children,
}: {
  children: ReactNode
}) {
  // Subscribe to Zustand store
  const selectedEquipmentId = useMonitorDataStore(
    (state) => state.selectedEquipmentId
  )
  const setSelectedEquipment = useMonitorDataStore(
    (state) => state.setSelectedEquipment
  )

  return (
    <EquipmentSelectionContext.Provider
      value={{ selectedEquipmentId, setSelectedEquipment }}
    >
      {children}
    </EquipmentSelectionContext.Provider>
  )
}

/**
 * Hook to access equipment selection state
 * Must be used within EquipmentSelectionProvider
 */
export function useEquipmentSelection() {
  const context = useContext(EquipmentSelectionContext)
  if (!context) {
    throw new Error(
      'useEquipmentSelection must be used within EquipmentSelectionProvider'
    )
  }
  return context
}
