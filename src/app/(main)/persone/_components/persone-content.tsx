'use client'

import { useState } from 'react'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { EmptyState } from '@/components/ui/empty-state'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useUsers } from '@/lib/queries/users'
import type { User } from '@/types/database'

// ── Role label mapping ────────────────────────────────────────────────────────
const ROLE_LABELS: Record<User['role'], string> = {
  employee: 'Dipendente',
  manager: 'Manager',
  admin: 'Admin',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function PersoneContent() {
  const [search, setSearch] = useState('')

  const { data: users = [], isLoading } = useUsers()

  const filtered = search.trim()
    ? users.filter((u) => {
        const q = search.trim().toLowerCase()
        return (
          u.first_name.toLowerCase().includes(q) ||
          u.last_name.toLowerCase().includes(q) ||
          (u.preferred_name?.toLowerCase().includes(q) ?? false)
        )
      })
    : users

  return (
    <div data-testid="persone-page" className="px-6 pt-8 pb-6 max-w-lg mx-auto">
      {/* Heading */}
      <h1 className="text-3xl font-extrabold text-primary tracking-tighter mb-6">
        Persone
      </h1>

      {/* Search */}
      <div className="mb-6">
        <input
          role="searchbox"
          type="search"
          placeholder="Cerca per nome…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-2xl border border-outline-variant bg-surface-container-low px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : filtered.length === 0 ? (
        <div data-testid="persone-empty">
          <EmptyState icon="person_off" title="Nessuna persona trovata" />
        </div>
      ) : (
        <ul data-testid="persone-list" className="flex flex-col gap-3">
          {filtered.map((user) => (
            <li
              key={user.id}
              className="flex items-center gap-3 bg-surface-container-lowest rounded-3xl px-4 py-3 shadow-sm"
            >
              <Avatar
                firstName={user.first_name}
                lastName={user.last_name}
                src={user.avatar_url}
                size="md"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-on-surface truncate">
                  {user.first_name} {user.last_name}
                </p>
              </div>
              <Badge label={ROLE_LABELS[user.role]} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
