import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ShiftBlock } from '@/components/ui/shift-block'

describe('ShiftBlock', () => {
  it('renders label', () => {
    render(<ShiftBlock label="Morning" color="#234428" />)
    expect(screen.getByText('Morning')).toBeInTheDocument()
  })

  it('renders time when startTime and endTime provided', () => {
    render(<ShiftBlock label="Morning" startTime="08:30" endTime="14:30" color="#234428" />)
    expect(screen.getByText(/08:30/)).toBeInTheDocument()
    expect(screen.getByText(/14:30/)).toBeInTheDocument()
  })

  it('hides time when compact=true', () => {
    render(
      <ShiftBlock label="Morning" startTime="08:30" endTime="14:30" color="#234428" compact />
    )
    expect(screen.queryByText(/08:30/)).not.toBeInTheDocument()
    expect(screen.queryByText(/14:30/)).not.toBeInTheDocument()
  })

  it('renders time when compact is false', () => {
    render(
      <ShiftBlock label="Evening" startTime="18:00" endTime="23:00" color="#234428" compact={false} />
    )
    expect(screen.getByText(/18:00/)).toBeInTheDocument()
    expect(screen.getByText(/23:00/)).toBeInTheDocument()
  })

  it('renders time when compact is not set', () => {
    render(<ShiftBlock label="Night" startTime="22:00" endTime="06:00" color="#234428" />)
    expect(screen.getByText(/22:00/)).toBeInTheDocument()
    expect(screen.getByText(/06:00/)).toBeInTheDocument()
  })

  it('does not render time when startTime is null', () => {
    render(<ShiftBlock label="Rest" startTime={null} endTime={null} color="#234428" />)
    expect(screen.queryByText(/:/)).not.toBeInTheDocument()
  })

  it('applies rounded-xl class to container', () => {
    const { container } = render(<ShiftBlock label="Test" color="#234428" />)
    expect(container.firstChild).toHaveClass('rounded-xl')
  })

  it('applies border-l-4 with inline borderColor style', () => {
    const { container } = render(<ShiftBlock label="Test" color="#ff5733" />)
    const el = container.firstChild as HTMLElement
    expect(el).toHaveClass('border-l-4')
    // jsdom normalizes hex to rgb, so check that a non-empty borderColor is set
    expect(el.style.borderColor).not.toBe('')
    // Verify the rendered color matches the rgb equivalent of #ff5733
    expect(el.style.borderColor).toBe('rgb(255, 87, 51)')
  })
})
