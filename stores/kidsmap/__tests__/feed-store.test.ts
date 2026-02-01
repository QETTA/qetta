import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useFeedStore } from '../feed-store'

describe('KidsMap FeedStore', () => {
  beforeEach(() => {
    // Force full state reset including isLoading
    useFeedStore.setState({
      items: [],
      page: 1,
      hasMore: false,
      total: 0,
      mode: 'grid',
      sort: 'recent',
      sourceFilter: null,
      keyword: '',
      isLoading: false,
      error: null,
    })
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('should have default values', () => {
    const state = useFeedStore.getState()
    expect(state.items).toEqual([])
    expect(state.page).toBe(1)
    expect(state.hasMore).toBe(false)
    expect(state.mode).toBe('grid')
    expect(state.sort).toBe('recent')
    expect(state.sourceFilter).toBeNull()
    expect(state.keyword).toBe('')
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
  })

  it('should set mode', () => {
    useFeedStore.getState().setMode('shorts')
    expect(useFeedStore.getState().mode).toBe('shorts')
  })

  it('should set sort and trigger fetch', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { items: [], hasMore: false, total: 0 } }),
    }))
    useFeedStore.getState().setSort('popular')
    expect(useFeedStore.getState().sort).toBe('popular')
    // Wait for the background fetch to complete
    await new Promise((r) => setTimeout(r, 10))
  })

  it('should set source filter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { items: [], hasMore: false, total: 0 } }),
    }))
    useFeedStore.getState().setSourceFilter('YOUTUBE')
    expect(useFeedStore.getState().sourceFilter).toBe('YOUTUBE')
    await new Promise((r) => setTimeout(r, 10))
  })

  it('should set keyword', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { items: [], hasMore: false, total: 0 } }),
    }))
    useFeedStore.getState().setKeyword('에버랜드')
    expect(useFeedStore.getState().keyword).toBe('에버랜드')
    await new Promise((r) => setTimeout(r, 10))
  })

  it('should reset to initial state', () => {
    useFeedStore.setState({
      mode: 'shorts',
      sort: 'popular',
      keyword: 'test',
      sourceFilter: 'YOUTUBE',
      items: [{ id: '1' } as never],
    })
    useFeedStore.getState().reset()

    const state = useFeedStore.getState()
    expect(state.mode).toBe('grid')
    expect(state.sort).toBe('recent')
    expect(state.keyword).toBe('')
    expect(state.items).toEqual([])
  })

  it('should not loadMore when no hasMore', async () => {
    useFeedStore.setState({ hasMore: false })
    const fetchSpy = vi.spyOn(useFeedStore.getState(), 'fetchFeed')
    await useFeedStore.getState().loadMore()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should not loadMore when loading', async () => {
    useFeedStore.setState({ hasMore: true, isLoading: true })
    const fetchSpy = vi.spyOn(useFeedStore.getState(), 'fetchFeed')
    await useFeedStore.getState().loadMore()
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('should handle fetch error gracefully', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))
    await useFeedStore.getState().fetchFeed(true)

    const state = useFeedStore.getState()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBe('Network error')
  })

  it('should handle successful fetch', async () => {
    const mockItems = [
      { id: '1', title: 'Test', source: 'YOUTUBE', type: 'video' },
      { id: '2', title: 'Test 2', source: 'NAVER_CLIP', type: 'short_video' },
    ]
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { items: mockItems, hasMore: true, total: 10 },
      }),
    })
    vi.stubGlobal('fetch', mockFetch)

    await useFeedStore.getState().fetchFeed(true)

    expect(mockFetch).toHaveBeenCalledTimes(1)
    const state = useFeedStore.getState()
    expect(state.items).toEqual(mockItems)
    expect(state.hasMore).toBe(true)
    expect(state.total).toBe(10)
    expect(state.page).toBe(2)
    expect(state.isLoading).toBe(false)
  })

  it('should append items on sequential fetches', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { items: [{ id: '0', title: 'First' }], hasMore: true, total: 2 },
      }),
    }))
    await useFeedStore.getState().fetchFeed(true)
    expect(useFeedStore.getState().items).toHaveLength(1)

    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { items: [{ id: '1', title: 'Second' }], hasMore: false, total: 2 },
      }),
    }))
    await useFeedStore.getState().fetchFeed(false)
    expect(useFeedStore.getState().items).toHaveLength(2)
  })
})
