import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useOnlineStatus } from '../use-online-status'

describe('useOnlineStatus', () => {
  beforeEach(() => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns true when navigator.onLine is true', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)
  })

  it('returns false when navigator.onLine is false', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)
  })

  it('updates when going offline', () => {
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(true)

    act(() => {
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('updates when coming back online', () => {
    vi.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false)
    const { result } = renderHook(() => useOnlineStatus())
    expect(result.current).toBe(false)

    act(() => {
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })
})
