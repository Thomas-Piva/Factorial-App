import React from 'react'

interface EmptyStateProps {
  icon: string
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 text-center">
      <span className="material-symbols-outlined text-5xl text-on-surface-variant">{icon}</span>
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      {description && (
        <p data-testid="empty-state-description" className="text-sm text-on-surface-variant">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  )
}
