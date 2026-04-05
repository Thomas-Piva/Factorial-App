"use client";

import type { ShiftAssignment } from "@/types/database";
import { ShiftBlock } from "@/components/ui/shift-block";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

interface TurnoOggiCardProps {
  userId: string | undefined;
  storeId: string | undefined;
  shifts: ShiftAssignment[];
  isLoading: boolean;
}

export default function TurnoOggiCard({
  shifts,
  isLoading,
}: TurnoOggiCardProps) {
  return (
    <section className="mb-6">
      <h3 className="text-lg font-extrabold text-primary mb-3 tracking-tight">
        Il tuo turno oggi
      </h3>
      <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm">
        {isLoading ? (
          <LoadingSpinner />
        ) : shifts.length === 0 ? (
          <EmptyState icon="calendar_today" title="Nessun turno oggi" />
        ) : (
          <div className="flex flex-col gap-3">
            {shifts.map((shift) => (
              <ShiftBlock
                key={shift.id}
                label={shift.label}
                startTime={shift.start_time}
                endTime={shift.end_time}
                color={shift.color}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
