"use client";

import { useId } from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  id: externalId,
  className,
  ...rest
}: InputProps) {
  const generatedId = useId();
  const id = externalId ?? generatedId;
  const errorId = `${id}-error`;

  const inputClasses = `rounded-full bg-surface-container px-5 py-3 outline-none focus:bg-surface-lowest transition-colors w-full${className ? ` ${className}` : ""}`;

  const inputEl = (
    <input
      id={id}
      className={inputClasses}
      aria-describedby={error ? errorId : undefined}
      {...rest}
    />
  );

  if (label || error) {
    return (
      <div>
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-on-surface-variant mb-1"
          >
            {label}
          </label>
        )}
        {inputEl}
        {error && (
          <p id={errorId} role="alert" className="text-error text-sm mt-1">
            {error}
          </p>
        )}
      </div>
    );
  }

  return inputEl;
}
