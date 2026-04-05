"use client";

import { useState } from "react";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { EmptyState } from "@/components/ui/empty-state";
import { ShiftBlock } from "@/components/ui/shift-block";
import { useCurrentUser } from "@/lib/queries/users";
import { useUsers } from "@/lib/queries/users";
import { useMyStores } from "@/lib/queries/stores";
import { useShiftsByStoreWeek } from "@/lib/queries/shifts";
import { buildShiftGrid } from "@/lib/utils/shift-grid";
import {
  getWeekRange,
  addDays,
  toISODate,
  eachDayOfInterval,
} from "@/lib/utils/date";
import { exportShiftsPdf } from "@/lib/utils/export-pdf";

// ── Day-of-week short labels (Mon-first) ──────────────────────────────────────
const DAY_LABELS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

// ── Component ─────────────────────────────────────────────────────────────────

export default function TurniContent() {
  const today = new Date();

  const [weekStart, setWeekStart] = useState<Date>(
    () => getWeekRange(today).start,
  );

  const weekRange = getWeekRange(weekStart);
  const weekStartISO = toISODate(weekStart);

  // Week days (7 days from Monday)
  const weekDays = eachDayOfInterval(weekRange.start, weekRange.end).map(
    toISODate,
  );

  // ── Navigation ──────────────────────────────────────────────────────────────
  function goToPrevWeek() {
    setWeekStart((prev) => addDays(prev, -7));
  }

  function goToNextWeek() {
    setWeekStart((prev) => addDays(prev, 7));
  }

  // ── Data queries ────────────────────────────────────────────────────────────
  const { data: currentUser } = useCurrentUser();
  const { data: stores = [] } = useMyStores(currentUser?.id);
  const storeId: string | undefined =
    stores.find((s) => s.is_primary)?.id ?? stores[0]?.id;

  const { data: assignments = [], isLoading: assignmentsLoading } =
    useShiftsByStoreWeek(storeId, weekStartISO);

  const { data: users = [], isLoading: usersLoading } = useUsers();

  const isLoading = assignmentsLoading || usersLoading;

  // ── Build grid ──────────────────────────────────────────────────────────────
  const gridRows = buildShiftGrid(assignments, users);

  return (
    <div data-testid="turni-page" className="px-4 pt-8 pb-6">
      {/* Heading */}
      <h1 className="text-3xl font-extrabold text-primary tracking-tighter mb-6">
        Turni
      </h1>

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-6">
        <span
          data-testid="week-label"
          className="text-base font-bold text-primary"
        >
          {weekRange.label}
        </span>
        <div className="flex gap-2">
          <button
            aria-label="Settimana precedente"
            onClick={goToPrevWeek}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-low text-secondary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button
            aria-label="Settimana successiva"
            onClick={goToNextWeek}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-container-low text-secondary hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <LoadingSpinner />
      ) : gridRows.length === 0 ? (
        <div data-testid="turni-empty">
          <EmptyState
            icon="calendar_month"
            title="Nessun turno questa settimana"
          />
        </div>
      ) : (
        <div data-testid="turni-grid" className="overflow-x-auto">
          {/* Export PDF button */}
          <div className="flex justify-end mb-3">
            <button
              data-testid="export-pdf-btn"
              onClick={() => {
                const dayLabels = DAY_LABELS.map((label, i) => {
                  const dateISO = weekDays[i];
                  const dayNum = new Date(dateISO).getDate();
                  return `${label} ${dayNum}`;
                });
                const rows = gridRows.map((row) => {
                  const exportRow: { userName: string; [key: string]: string } =
                    {
                      userName: row.user.displayName,
                    };
                  for (const dateISO of weekDays) {
                    const cell = row.cells[dateISO];
                    exportRow[dateISO] =
                      cell?.blocks.map((b) => b.label).join(", ") ?? "";
                  }
                  return exportRow;
                });
                exportShiftsPdf({
                  weekLabel: weekRange.label,
                  days: weekDays,
                  dayLabels,
                  rows,
                });
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-base">
                picture_as_pdf
              </span>
              Esporta PDF
            </button>
          </div>
          {/* Column headers */}
          <div className="min-w-[600px]">
            <div className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 mb-2">
              <div /> {/* empty header for user name column */}
              {DAY_LABELS.map((label, i) => {
                const dateISO = weekDays[i];
                const dayNum = new Date(dateISO).getDate();
                return (
                  <div
                    key={label}
                    className="text-center text-xs font-bold text-on-surface-variant uppercase tracking-wide"
                  >
                    {label} {dayNum}
                  </div>
                );
              })}
            </div>

            {/* Grid rows */}
            {gridRows.map((row) => (
              <div
                key={row.user.id}
                className="grid grid-cols-[140px_repeat(7,1fr)] gap-1 mb-1"
              >
                {/* User name */}
                <div className="flex items-center px-1">
                  <span className="text-sm font-semibold text-on-surface truncate">
                    {row.user.displayName}
                  </span>
                </div>

                {/* Day cells */}
                {weekDays.map((dateISO) => {
                  const cell = row.cells[dateISO];
                  return (
                    <div
                      key={dateISO}
                      className="min-h-[48px] flex flex-col gap-1 p-0.5"
                    >
                      {cell?.blocks.map((block) => (
                        <ShiftBlock
                          key={block.id}
                          label={block.label}
                          startTime={block.start_time}
                          endTime={block.end_time}
                          color={block.color}
                          compact
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
