import type { CSSProperties } from "react";

interface BadgeProps {
  label: string;
  color?: CSSProperties["backgroundColor"];
  variant?: "default" | "outline";
}

export function Badge({ label, color, variant = "default" }: BadgeProps) {
  const base = "rounded-full px-3 py-1 text-xs font-medium inline-block";
  const outlineClass = variant === "outline" ? " ring-1 ring-current" : "";

  if (color) {
    return (
      <span
        className={`${base}${outlineClass} text-white`}
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`${base} bg-surface-container text-on-surface-variant${outlineClass}`}
    >
      {label}
    </span>
  );
}
