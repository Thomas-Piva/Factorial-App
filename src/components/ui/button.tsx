"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  children: React.ReactNode;
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-primary text-on-primary",
  secondary: "bg-surface-container text-on-surface",
  ghost: "bg-transparent text-on-surface-variant",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-base",
  lg: "px-8 py-3 text-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className,
  ...rest
}: ButtonProps) {
  const base =
    "rounded-full font-medium inline-flex items-center justify-center gap-2 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed";
  const classes = `${base} ${variantClasses[variant]} ${sizeClasses[size]}${className ? ` ${className}` : ""}`;

  return (
    <button className={classes} disabled={loading || disabled} {...rest}>
      {loading && (
        <span
          aria-hidden="true"
          className="animate-spin border-2 border-current border-t-transparent rounded-full w-4 h-4 shrink-0"
        />
      )}
      {children}
    </button>
  );
}
