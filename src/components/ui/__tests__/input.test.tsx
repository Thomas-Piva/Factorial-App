import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { Input } from '@/components/ui/input'

describe('Input', () => {
  it('renders without label (just the input)', () => {
    render(<Input placeholder="Enter text" />)
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument()
    expect(screen.queryByRole('label')).not.toBeInTheDocument()
  })

  it('renders with label associated via htmlFor and id', () => {
    render(<Input label="Email" id="email" />)
    const label = screen.getByText('Email')
    expect(label.tagName).toBe('LABEL')
    expect(label).toHaveAttribute('for', 'email')
    expect(screen.getByRole('textbox')).toHaveAttribute('id', 'email')
  })

  it('shows error message with role="alert" when error prop set', () => {
    render(<Input error="This field is required" />)
    const alert = screen.getByRole('alert')
    expect(alert).toBeInTheDocument()
    expect(alert).toHaveTextContent('This field is required')
    expect(alert).toHaveClass('text-error')
  })

  it('does not show error element when error not provided', () => {
    render(<Input />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('passes through standard input attributes', () => {
    render(<Input type="email" placeholder="you@example.com" defaultValue="test" />)
    const input = screen.getByPlaceholderText('you@example.com')
    expect(input).toHaveAttribute('type', 'email')
  })

  it('applies rounded-full class to the input', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toHaveClass('rounded-full')
  })

  it('applies outline-none class to the input', () => {
    render(<Input />)
    expect(screen.getByRole('textbox')).toHaveClass('outline-none')
  })
})
