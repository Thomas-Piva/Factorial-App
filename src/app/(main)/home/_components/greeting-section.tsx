'use client'

import { Avatar } from '@/components/ui/avatar'

interface GreetingSectionProps {
  displayName: string
  firstName?: string
  lastName?: string
  avatarUrl?: string | null
}

export default function GreetingSection({
  displayName,
  firstName = '',
  lastName = '',
  avatarUrl,
}: GreetingSectionProps) {
  return (
    <section className="mb-8 flex items-center gap-4">
      <Avatar
        src={avatarUrl}
        firstName={firstName}
        lastName={lastName}
        size="lg"
      />
      <div>
        <p className="text-secondary font-medium tracking-wide text-sm mb-1">
          Bentornato
        </p>
        <h2 className="text-2xl font-extrabold tracking-tight text-primary leading-tight">
          Buongiorno, {displayName}!
        </h2>
      </div>
    </section>
  )
}
