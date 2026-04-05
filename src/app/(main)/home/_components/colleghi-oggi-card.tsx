'use client'

import type { User } from '@/types/database'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

interface ColleghiOggiCardProps {
  storeId: string | undefined
  colleagues: User[]
  isLoading: boolean
}

export default function ColleghiOggiCard({ colleagues, isLoading }: ColleghiOggiCardProps) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-extrabold text-primary mb-3 tracking-tight">
        Colleghi oggi
      </h3>
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm">
        {isLoading ? (
          <LoadingSpinner />
        ) : colleagues.length === 0 ? (
          <EmptyState
            icon="group"
            title="Nessun collega in servizio oggi"
          />
        ) : (
          <div className="flex flex-wrap gap-3 items-center">
            {colleagues.map((colleague) => (
              <div key={colleague.id} className="flex flex-col items-center gap-1">
                <Avatar
                  src={colleague.avatar_url}
                  firstName={colleague.first_name}
                  lastName={colleague.last_name}
                  size="sm"
                />
                <span className="text-xs text-on-surface-variant font-medium">
                  {colleague.preferred_name ?? colleague.first_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
