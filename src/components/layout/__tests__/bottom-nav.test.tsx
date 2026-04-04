import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(() => '/home'),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: unknown; className?: string; [key: string]: unknown }) => (
    <a href={href} className={className}>{children as React.ReactNode}</a>
  ),
}))

import BottomNav from '@/components/layout/bottom-nav'

describe('BottomNav', () => {
  it('renders all 3 tabs', () => {
    render(<BottomNav />)
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Calendario')).toBeInTheDocument()
    expect(screen.getByText('Hub')).toBeInTheDocument()
  })

  it('renders correct icon names for each tab', () => {
    render(<BottomNav />)
    expect(screen.getByText('home')).toBeInTheDocument()
    expect(screen.getByText('calendar_today')).toBeInTheDocument()
    expect(screen.getByText('storefront')).toBeInTheDocument()
  })

  it('active tab (/home) has text-primary class', () => {
    render(<BottomNav />)
    const homeLink = screen.getByRole('link', { name: /home/i })
    // The link or one of its ancestors/descendants should have text-primary
    expect(homeLink.className).toContain('text-primary')
  })

  it('inactive tabs do not have text-primary class', () => {
    render(<BottomNav />)
    const calendarioLink = screen.getByRole('link', { name: /calendario/i })
    const hubLink = screen.getByRole('link', { name: /hub/i })
    expect(calendarioLink.className).not.toContain('text-primary')
    expect(hubLink.className).not.toContain('text-primary')
  })

  it('renders links with correct hrefs', () => {
    render(<BottomNav />)
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: /calendario/i })).toHaveAttribute('href', '/calendario')
    expect(screen.getByRole('link', { name: /hub/i })).toHaveAttribute('href', '/hub')
  })

  it('renders glassmorphism container with backdrop-blur-md', () => {
    const { container } = render(<BottomNav />)
    const nav = container.querySelector('nav')
    expect(nav?.className).toContain('backdrop-blur-md')
  })
})
