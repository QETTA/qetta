import { describe, it, expect, beforeEach } from 'vitest'
import { useBookmarkStore } from '../bookmark-store'
import type { FeedItem } from '../feed-store'

const mockItem: FeedItem = {
  id: 'test-1',
  source: 'YOUTUBE',
  type: 'video',
  sourceUrl: 'https://youtube.com/watch?v=test',
  title: 'Test Video',
  author: 'Test Channel',
  publishedAt: '2026-01-01T00:00:00Z',
}

const mockItem2: FeedItem = {
  id: 'test-2',
  source: 'NAVER_CLIP',
  type: 'short_video',
  sourceUrl: 'https://clip.naver.com/test',
  title: 'Test Clip',
  author: 'Test Author',
  publishedAt: '2026-01-02T00:00:00Z',
}

describe('KidsMap BookmarkStore', () => {
  beforeEach(() => {
    useBookmarkStore.getState().clear()
  })

  it('should start empty', () => {
    expect(useBookmarkStore.getState().bookmarks).toEqual([])
  })

  it('should add bookmark', () => {
    useBookmarkStore.getState().addBookmark(mockItem)
    expect(useBookmarkStore.getState().bookmarks).toHaveLength(1)
    expect(useBookmarkStore.getState().isBookmarked('test-1')).toBe(true)
  })

  it('should not add duplicate', () => {
    useBookmarkStore.getState().addBookmark(mockItem)
    useBookmarkStore.getState().addBookmark(mockItem)
    expect(useBookmarkStore.getState().bookmarks).toHaveLength(1)
  })

  it('should remove bookmark', () => {
    useBookmarkStore.getState().addBookmark(mockItem)
    useBookmarkStore.getState().removeBookmark('test-1')
    expect(useBookmarkStore.getState().bookmarks).toHaveLength(0)
    expect(useBookmarkStore.getState().isBookmarked('test-1')).toBe(false)
  })

  it('should toggle bookmark on/off', () => {
    useBookmarkStore.getState().toggleBookmark(mockItem)
    expect(useBookmarkStore.getState().isBookmarked('test-1')).toBe(true)

    useBookmarkStore.getState().toggleBookmark(mockItem)
    expect(useBookmarkStore.getState().isBookmarked('test-1')).toBe(false)
  })

  it('should maintain order (newest first)', () => {
    useBookmarkStore.getState().addBookmark(mockItem)
    useBookmarkStore.getState().addBookmark(mockItem2)

    const bookmarks = useBookmarkStore.getState().getBookmarks()
    expect(bookmarks[0].id).toBe('test-2')
    expect(bookmarks[1].id).toBe('test-1')
  })

  it('should clear all bookmarks', () => {
    useBookmarkStore.getState().addBookmark(mockItem)
    useBookmarkStore.getState().addBookmark(mockItem2)
    useBookmarkStore.getState().clear()

    expect(useBookmarkStore.getState().bookmarks).toHaveLength(0)
  })
})
