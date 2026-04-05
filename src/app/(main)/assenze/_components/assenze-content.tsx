"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { useCurrentUser } from "@/lib/queries/users";
import { useMyStores } from "@/lib/queries/stores";
import { useAbsencesByStoreMonth } from "@/lib/queries/shifts";
import { SHIFT_TYPE_LABELS } from "@/lib/constants/shift-types";

// ── Italian month names ───────────────────────────────────────────────────────
const MONTHS_IT = [
  "Gennaio",
  "Febbraio",
  "Marzo",
  "Aprile",
  "Maggio",
  "Giugno",
  "Luglio",
  "Agosto",
  "Settembre",
  "Ottobre",
  "Novembre",
  "Dicembre",
];

// ── Format date as DD/MM/YYYY ─────────────────────────────────────────────────
function formatDate(iso: string): string {
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function AssenzeContent() {
  const today = new Date();

  const [currentMonth, setCurrentMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-indexed
  });

  // ── Month navigation ────────────────────────────────────────────────────────
  function goToPrevMonth() {
    setCurrentMonth(({ year, month }) => {
      const newYear = month === 0 ? year - 1 : year;
      const newMonth = month === 0 ? 11 : month - 1;
      return { year: newYear, month: newMonth };
    });
  }

  function goToNextMonth() {
    setCurrentMonth(({ year, month }) => {
      const newYear = month === 11 ? year + 1 : year;
      const newMonth = month === 11 ? 0 : month + 1;
      return { year: newYear, month: newMonth };
    });
  }

  const { year, month } = currentMonth;
  const monthLabel = `${MONTHS_IT[month]} ${year}`;
  const monthKey = `${String(year)}-${String(month + 1).padStart(2, "0")}`;

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: currentUser } = useCurrentUser();
  const { data: stores = [] } = useMyStores(currentUser?.id);
  const storeId: string | undefined =
    stores.find((s) => s.is_primary)?.id ?? stores[0]?.id;

  const { data: absences = [], isLoading } = useAbsencesByStoreMonth(
    storeId,
    monthKey,
  );

  return (
    <div data-testid="assenze-page" className="px-6 pt-8 pb-6 max-w-lg mx-auto">
      {/* Heading */}
      <h1 className="text-3xl font-extrabold text-primary tracking-tighter mb-6">
        Assenze
      </h1>

      {/* Month navigator */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-primary">{monthLabel}</h2>
        <div className="flex gap-3">
          <button
            aria-label="Mese precedente"
            onClick={goToPrevMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-secondary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            aria-label="Mese successivo"
            onClick={goToNextMonth}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-low text-secondary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : absences.length === 0 ? (
        <div data-testid="assenze-empty">
          <EmptyState icon="event_busy" title="Nessuna assenza questo mese" />
        </div>
      ) : (
        <ul data-testid="assenze-list" className="flex flex-col gap-3">
          {absences.map((absence) => {
            const userName = absence.user
              ? `${absence.user.first_name} ${absence.user.last_name}`
              : "—";
            const typeLabel =
              SHIFT_TYPE_LABELS[absence.shift_type] ?? absence.shift_type;
            return (
              <li
                key={absence.id}
                className="flex items-center gap-3 bg-surface-container-lowest rounded-3xl px-4 py-3 shadow-sm"
              >
                {/* Color chip */}
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: absence.color }}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-on-surface">
                    {userName}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {typeLabel} · {formatDate(absence.date)}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
