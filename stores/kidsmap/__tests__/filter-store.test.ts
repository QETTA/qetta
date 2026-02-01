import { describe, it, expect, beforeEach } from 'vitest'
import { useFilterStore } from '../filter-store'

describe('KidsMap FilterStore', () => {
  beforeEach(() => {
    useFilterStore.getState().reset()
  })

  it('should have default filter values', () => {
    const state = useFilterStore.getState()
    expect(state.filterCategory).toBeNull()
    expect(state.ageGroups).toEqual([])
    expect(state.openNow).toBe(false)
    expect(state.sortBy).toBe('distance')
  })

  it('should set filter category with corresponding place categories', () => {
    useFilterStore.getState().setFilterCategory('outdoor')
    const state = useFilterStore.getState()
    expect(state.filterCategory).toBe('outdoor')
    expect(state.placeCategories).toEqual(['amusement_park', 'zoo_aquarium', 'nature_park'])
  })

  it('should clear filter category when set to null', () => {
    useFilterStore.getState().setFilterCategory('indoor')
    useFilterStore.getState().setFilterCategory(null)
    expect(useFilterStore.getState().filterCategory).toBeNull()
  })

  it('should toggle age groups on and off', () => {
    useFilterStore.getState().toggleAgeGroup('toddler')
    expect(useFilterStore.getState().ageGroups).toContain('toddler')

    useFilterStore.getState().toggleAgeGroup('toddler')
    expect(useFilterStore.getState().ageGroups).not.toContain('toddler')
  })

  it('should support multiple age groups', () => {
    useFilterStore.getState().toggleAgeGroup('toddler')
    useFilterStore.getState().toggleAgeGroup('child')
    expect(useFilterStore.getState().ageGroups).toEqual(['toddler', 'child'])
  })

  it('should toggle place categories', () => {
    useFilterStore.getState().togglePlaceCategory('kids_cafe')
    expect(useFilterStore.getState().placeCategories).toContain('kids_cafe')

    useFilterStore.getState().togglePlaceCategory('kids_cafe')
    expect(useFilterStore.getState().placeCategories).not.toContain('kids_cafe')
  })

  it('should reset all filters', () => {
    useFilterStore.getState().setFilterCategory('indoor')
    useFilterStore.getState().toggleAgeGroup('child')
    useFilterStore.getState().setOpenNow(true)
    useFilterStore.getState().reset()

    const state = useFilterStore.getState()
    expect(state.filterCategory).toBeNull()
    expect(state.ageGroups).toEqual([])
    expect(state.openNow).toBe(false)
  })

  it('should report correct isFiltered state', () => {
    expect(useFilterStore.getState().isFiltered()).toBe(false)

    useFilterStore.getState().setFilterCategory('restaurant')
    expect(useFilterStore.getState().isFiltered()).toBe(true)
  })

  it('should count active filters correctly', () => {
    expect(useFilterStore.getState().getActiveFilterCount()).toBe(0)

    useFilterStore.getState().setFilterCategory('outdoor')
    useFilterStore.getState().toggleAgeGroup('infant')
    useFilterStore.getState().setOpenNow(true)
    // filterCategory=1, placeCategories=1 (set by resetToQuickFilter), ageGroups=1, openNow=1
    expect(useFilterStore.getState().getActiveFilterCount()).toBe(4)
  })

  it('should set restaurant-specific quick filter', () => {
    useFilterStore.getState().setFilterCategory('restaurant')
    const state = useFilterStore.getState()
    expect(state.filterCategory).toBe('restaurant')
    expect(state.placeCategories).toEqual(['restaurant'])
  })
})
