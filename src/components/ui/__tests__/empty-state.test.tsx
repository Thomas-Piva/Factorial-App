import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { EmptyState } from '@/components/ui/empty-state'

describe('EmptyState', () => {
  it('renders icon name', () => {
    render(<EmptyState icon="calendar_today" title="No shifts" />)
    expect(screen.getByText('calendar_today')).toBeInTheDocument()
  })

  it('renders title', () => {
    render(<EmptyState icon="calendar_today" title="No shifts found" />)
    expect(screen.getByText('No shifts found')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <EmptyState
        icon="calendar_today"
        title="No shifts"
        description="You have no shifts scheduled"
      />
    )
    expect(screen.getByText('You have no shifts scheduled')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<EmptyState icon="calendar_today" title="No shifts" />)
    // Only title and icon text should be present, no description paragraph
    expect(screen.queryByTestId('empty-state-description')).not.toBeInTheDocument()
  })

  it('renders action when provided', () => {
    render(
      <EmptyState
        icon="calendar_today"
        title="No shifts"
        action={<button>Add Shift</button>}
      />
    )
    expect(screen.getByRole('button', { name: 'Add Shift' })).toBeInTheDocument()
  })

  it('does not render action slot when action not provided', () => {
    render(<EmptyState icon="calendar_today" title="No shifts" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('icon span has material-symbols-outlined class', () => {
    render(<EmptyState icon="storefront" title="No stores" />)
    const iconEl = screen.getByText('storefront')
    expect(iconEl).toHaveClass('material-symbols-outlined')
  })
})
