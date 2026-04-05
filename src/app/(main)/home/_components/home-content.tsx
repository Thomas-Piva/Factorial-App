'use client'

import { useCurrentUser } from '@/lib/queries/users'
import { useColleaguesToday } from '@/lib/queries/users'
import { useMyShiftsToday } from '@/lib/queries/shifts'
import { useMyStores } from '@/lib/queries/stores'
import { getDisplayName } from '@/lib/utils/initials'
import GreetingSection from './greeting-section'
import TurnoOggiCard from './turno-oggi-card'
import ColleghiOggiCard from './colleghi-oggi-card'
import ComunicazioniCard from './comunicazioni-card'

export default function HomeContent() {
  const { data: user, isLoading: userLoading } = useCurrentUser()

  // Resolve the user's primary store (or fall back to first store in membership list)
  const { data: stores = [] } = useMyStores(user?.id)
  const storeId: string | undefined =
    stores.find((s) => s.is_primary)?.id ?? stores[0]?.id

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
