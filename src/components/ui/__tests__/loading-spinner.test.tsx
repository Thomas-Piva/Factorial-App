import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

describe('LoadingSpinner', () => {
  it('renders with role="status" for accessibility', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders with default size (md)', () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-8')
    expect(spinner).toHaveClass('h-8')
  })

  it('renders sm size', () => {
    render(<LoadingSpinner size="sm" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-4')
    expect(spinner).toHaveClass('h-4')
  })

  it('renders md size explicitly', () => {
    render(<LoadingSpinner size="md" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-8')
    expect(spinner).toHaveClass('h-8')
  })

  it('renders lg size', () => {
    render(<LoadingSpinner size="lg" />)
    const spinner = screen.getByRole('status')
    expect(spinner).toHaveClass('w-12')
    expect(spinner).toHaveClass('h-12')
  })

  it('has animate-spin class', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toHaveClass('animate-spin')
  })

  it('has rounded-full class', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toHaveClass('rounded-full')
  })

  it('has default aria-label when no label provided', () => {
    render(<LoadingSpinner />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Caricamento…')
  })

  it('uses provided label as aria-label', () => {
    render(<LoadingSpinner label="Loading data" />)
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading data')
  })
})
