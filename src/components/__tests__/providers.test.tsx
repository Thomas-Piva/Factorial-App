import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { useQueryClient } from '@tanstack/react-query'
import { Providers } from '@/components/providers'

// Helper component to verify QueryClient is accessible in the tree
function QueryClientConsumer() {
  const client = useQueryClient()
  return <div data-testid="query-client-available">{client ? 'yes' : 'no'}</div>
}

describe('Providers', () => {
  it('renders children', () => {
    render(
      <Providers>
        <span data-testid="child">hello</span>
      </Providers>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toHaveTextContent('hello')
  })

  it('makes QueryClient available to children via useQueryClient()', () => {
    render(
      <Providers>
        <QueryClientConsumer />
      </Providers>
    )
    expect(screen.getByTestId('query-client-available')).toHaveTextContent('yes')
  })

  it('renders multiple children without errors', () => {
    render(
      <Providers>
        <div data-testid="child-1">first</div>
        <div data-testid="child-2">second</div>
      </Providers>
    )
    expect(screen.getByTestId('child-1')).toBeInTheDocument()
    expect(screen.getByTestId('child-2')).toBeInTheDocument()
  })
})
