import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('@/components/layout/bottom-nav', () => ({
  default: () => <nav data-testid="bottom-nav" />,
}))

import MainLayout from '@/components/layout/main-layout'

describe('MainLayout', () => {
  it('renders children inside main element', () => {
    render(<MainLayout><div data-testid="child">Content</div></MainLayout>)
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('main element has min-h-screen and bg-surface', () => {
    render(<MainLayout><span>Child</span></MainLayout>)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('min-h-screen')
    expect(main).toHaveClass('bg-surface')
  })

  it('main element has pb-20 for bottom nav clearance', () => {
    render(<MainLayout><span>Child</span></MainLayout>)
    const main = screen.getByRole('main')
    expect(main).toHaveClass('pb-20')
  })

  it('renders BottomNav', () => {
    render(<MainLayout><span>Child</span></MainLayout>)
    expect(screen.getByTestId('bottom-nav')).toBeInTheDocument()
  })
})
