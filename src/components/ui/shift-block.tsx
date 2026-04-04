import React from 'react'

interface ShiftBlockProps {
  label: string
  startTime?: string | null
  endTime?: string | null
  color: string
  compact?: boolean
}

export function ShiftBlock({ label, startTime, endTime, color, compact = false }: ShiftBlockProps) {
  const showTime = !compact && startTime && endTime

  return (
    <div
      className="rounded-xl border-l-4 bg-surface-container p-2"
      style={{ borderColor: color }}
    >
      <p className={`font-bold${compact ? ' text-xs' : ' text-sm'}`}>{label}</p>
      {showTime && (
        <p className="text-xs text-on-surface-variant">
          {startTime} – {endTime}
        </p>
      )}
    </div>
  )
}
