interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const sizeClasses: Record<NonNullable<LoadingSpinnerProps['size']>, string> = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12',
}

export function LoadingSpinner({ size = 'md', label }: LoadingSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label ?? 'Caricamento…'}
      className={`${sizeClasses[size]} animate-spin border-4 border-primary border-t-transparent rounded-full`}
    />
  )
}
