import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })

  it('applies rounded-full class', () => {
    render(<Button>Test</Button>)
    expect(screen.getByRole('button')).toHaveClass('rounded-full')
  })

  it('applies primary variant classes by default', () => {
    render(<Button>Primary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-primary')
    expect(btn).toHaveClass('text-on-primary')
  })

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-surface-container')
    expect(btn).toHaveClass('text-on-surface')
  })

  it('applies ghost variant classes', () => {
    render(<Button variant="ghost">Ghost</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveClass('bg-transparent')
    expect(btn).toHaveClass('text-on-surface-variant')
  })

  it('disables the button and shows spinner when loading=true', () => {
    render(<Button loading>Save</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toBeDisabled()
    const spinner = btn.querySelector('[aria-hidden="true"]')
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass('animate-spin')
  })

  it('calls onClick when clicked and not disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button disabled onClick={onClick}>Click</Button>)
    await user.click(screen.getByRole('button'))
    expect(onClick).not.toHaveBeenCalled()
  })

  it('passes through standard HTML button attributes', () => {
    render(<Button type="submit" aria-label="submit form">Submit</Button>)
    const btn = screen.getByRole('button')
    expect(btn).toHaveAttribute('type', 'submit')
    expect(btn).toHaveAttribute('aria-label', 'submit form')
  })
})
