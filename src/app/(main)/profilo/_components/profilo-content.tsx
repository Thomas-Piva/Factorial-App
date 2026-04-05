'use client'

import { useState } from 'react'
import { useCurrentUser } from '@/lib/queries/users'
import { useUpdateProfile } from '@/lib/mutations/profile'
import { Avatar } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

// ── Role label map ────────────────────────────────────────────────────────────
const ROLE_LABELS: Record<string, string> = {
  employee: 'Dipendente',
  manager: 'Manager',
  admin: 'Admin',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function ProfiloContent() {
  const { data: user, isLoading } = useCurrentUser()
  const updateProfile = useUpdateProfile()

  const [editing, setEditing] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [preferredName, setPreferredName] = useState('')
  const [pronouns, setPronouns] = useState('')

  function handleEditClick() {
    if (user) {
      setFirstName(user.first_name)
      setLastName(user.last_name)
      setPreferredName(user.preferred_name ?? '')
      setPronouns(user.pronouns ?? '')
    }
    setEditing(true)
  }

  function handleSubmit(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!user) return
    updateProfile.mutate({
      id: user.id,
      first_name: firstName,
      last_name: lastName,
      preferred_name: preferredName || null,
      pronouns: pronouns || null,
    })
    setEditing(false)
  }

  return (
    <div data-testid="profilo-page" className="px-6 pt-8 pb-6 max-w-lg mx-auto">
      {/* Heading */}
      <h1 className="text-3xl font-extrabold text-primary tracking-tighter mb-6">
        Profilo
      </h1>

      {isLoading ? (
        <LoadingSpinner />
      ) : user ? (
        <>
          {/* Avatar */}
          <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20">
              <Avatar
                firstName={user.first_name}
                lastName={user.last_name}
                src={user.avatar_url}
                size="lg"
              />
            </div>
          </div>

          {/* User info */}
          <div className="bg-surface-container-lowest rounded-3xl px-6 py-5 shadow-sm mb-4">
            <p className="text-xl font-bold text-on-surface mb-1">
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-on-surface-variant mb-3">{user.email}</p>
            <Badge label={ROLE_LABELS[user.role] ?? user.role} />
          </div>

          {/* Edit button */}
          {!editing && (
            <Button
              data-testid="profilo-edit-btn"
              variant="secondary"
              onClick={handleEditClick}
              className="w-full mb-4"
            >
              Modifica
            </Button>
          )}

          {/* Edit form */}
          {editing && (
            <form
              data-testid="profilo-form"
              onSubmit={handleSubmit}
              className="flex flex-col gap-4 bg-surface-container-lowest rounded-3xl px-6 py-5 shadow-sm"
            >
              <Input
                label="Nome"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Cognome"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
              <Input
                label="Nome preferito (opzionale)"
                value={preferredName}
                onChange={(e) => setPreferredName(e.target.value)}
              />
              <Input
                label="Pronomi (opzionale)"
                value={pronouns}
                onChange={(e) => setPronouns(e.target.value)}
              />
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setEditing(false)}
                  className="flex-1"
                >
                  Annulla
                </Button>
                <Button
                  data-testid="profilo-save-btn"
                  type="submit"
                  variant="primary"
                  loading={updateProfile.isPending}
                  className="flex-1"
                >
                  Salva
                </Button>
              </div>
            </form>
          )}
        </>
      ) : null}
    </div>
  )
}
