'use client'

import { useCurrentUser } from '@/lib/queries/users'
import { useColleaguesToday } from '@/lib/queries/users'
import { useMyShiftsToday } from '@/lib/queries/shifts'
import { getDisplayName } from '@/lib/utils/initials'
import GreetingSection from './greeting-section'
import TurnoOggiCard from './turno-oggi-card'
import ColleghiOggiCard from './colleghi-oggi-card'
import ComunicazioniCard from './comunicazioni-card'

export default function HomeContent() {
  const { data: user, isLoading: userLoading } = useCurrentUser()

  // Use primary store from user's store memberships — for now we look up storeId from shift context
  // The store_membership query would give us storeId; for simplicity we use the first store
  // found in today's shifts, or fall back to undefined.
  const storeId: string | undefined = undefined // Will be populated via store-membership query in Phase 4

  const { data: shifts = [], isLoading: shiftsLoading } = useMyShiftsToday(user?.id, storeId)
  const { data: colleagues = [], isLoading: colleaguesLoading } = useColleaguesToday(storeId)

  const displayName = user
    ? getDisplayName(user.first_name, user.preferred_name)
    : '…'

  return (
    <div className="px-6 pt-8 pb-6 max-w-md mx-auto">
      <GreetingSection
        displayName={displayName}
        firstName={user?.first_name ?? ''}
        lastName={user?.last_name ?? ''}
        avatarUrl={user?.avatar_url}
      />
      <TurnoOggiCard
        userId={user?.id}
        storeId={storeId}
        shifts={shifts}
        isLoading={userLoading || shiftsLoading}
      />
      <ColleghiOggiCard
        storeId={storeId}
        colleagues={colleagues}
        isLoading={userLoading || colleaguesLoading}
      />
      <ComunicazioniCard />
    </div>
  )
}
