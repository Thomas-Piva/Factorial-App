"use client";

import { useState, useMemo } from "react";
import { EmptyState } from "@/components/ui/empty-state";
import { ShiftBlock } from "@/components/ui/shift-block";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useCurrentUser } from "@/lib/queries/users";
import { useShiftsByUserMonth } from "@/lib/queries/shifts";
import { toISODate, getMonthRange, eachDayOfInterval } from "@/lib/utils/date";

// ── Italian locale constants ──────────────────────────────────────────────────

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

const DAY_HEADERS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// ── Helper: 0=Sunday ... 6=Saturday → Mon-first index 0-6 ────────────────────
function dayOfWeekMonFirst(date: Date): number {
  return (date.getDay() + 6) % 7;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function CalendarioPage() {
  const today = new Date();
  const todayISO = toISODate(today);

  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState({
    year: today.getFullYear(),
    month: today.getMonth(), // 0-indexed
  });

  // ── Month navigation ────────────────────────────────────────────────────────
  // Compute the new month synchronously so both setters receive the same value,
  // avoiding the stale-closure bug that arises with React's automatic batching.
  function goToPrevMonth() {
    const { year, month } = currentMonth;
    const newYear = month === 0 ? year - 1 : year;
    const newMonth = month === 0 ? 11 : month - 1;
    setCurrentMonth({ year: newYear, month: newMonth });
    setSelectedDate(new Date(newYear, newMonth, 1));
  }

  function goToNextMonth() {
    const { year, month } = currentMonth;
    const newYear = month === 11 ? year + 1 : year;
    const newMonth = month === 11 ? 0 : month + 1;
    setCurrentMonth({ year: newYear, month: newMonth });
    setSelectedDate(new Date(newYear, newMonth, 1));
  }

  // ── Calendar grid computation ───────────────────────────────────────────────
  const { year, month } = currentMonth;
  const monthLabel = `${MONTHS_IT[month]} ${year}`;

  const { start: monthStart, end: monthEnd } = getMonthRange(year, month);
  const allDays = eachDayOfInterval(monthStart, monthEnd);

  // Leading empty cells so the first day lands on the right column
  const leadingBlanks = dayOfWeekMonFirst(monthStart);

  // ── TanStack Query for shifts ───────────────────────────────────────────────
  const { data: currentUser } = useCurrentUser();
  const monthKey = `${String(year)}-${String(month + 1).padStart(2, "0")}`;

  const { data: shifts = [], isLoading: shiftsLoading } = useShiftsByUserMonth(
    currentUser?.id,
    monthKey,
  );

  // ── Shifts for selected day ─────────────────────────────────────────────────
  const selectedISO = toISODate(selectedDate);
  const shiftsForDay = useMemo(
    () => shifts.filter((s) => s.date === selectedISO),
    [shifts, selectedISO],
  );

  return (
    <div
      data-testid="calendario-page"
      className="px-6 pt-8 pb-6 max-w-md mx-auto"
    >
      {/* Heading */}
      <h1 className="text-3xl font-extrabold text-primary tracking-tighter mb-8">
        Calendario
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

      {/* 7-column grid */}
      <section className="mb-8">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_HEADERS.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7 gap-1">
          {/* Leading blanks */}
          {Array.from({ length: leadingBlanks }).map((_, i) => (
            <div key={`blank-${i}`} />
          ))}

          {/* Actual days */}
          {allDays.map((day) => {
            const iso = toISODate(day);
            const isSelected = iso === selectedISO;
            const isToday = iso === todayISO;
            // allDays only contains days of currentMonth — no adjacent-month filler.

            return (
              <button
                key={iso}
                aria-label={String(day.getDate())}
                data-selected={isSelected ? "true" : undefined}
                onClick={() => setSelectedDate(day)}
                className={[
                  "aspect-square flex items-center justify-center rounded-full text-sm font-bold transition-all",
                  isSelected
                    ? "bg-primary text-white shadow-md"
                    : isToday
                      ? "bg-primary-fixed text-primary"
                      : "bg-surface-container-low text-on-surface hover:bg-surface-container-high",
                ].join(" ")}
              >
                {day.getDate()}
              </button>
            );
          })}
        </div>
      </section>

      {/* Shift detail card for selected day */}
      <section data-testid="shift-detail-section">
        <h3 className="text-lg font-extrabold text-primary mb-3 tracking-tight">
          Turni — {selectedISO}
        </h3>
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm">
          {shiftsLoading ? (
            <LoadingSpinner />
          ) : shiftsForDay.length === 0 ? (
            <EmptyState icon="calendar_today" title="Nessun turno" />
          ) : (
            <div className="flex flex-col gap-3">
              {shiftsForDay.map((shift) => (
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
    </div>
  );
}
