import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  firstName: string
  lastName: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeMap: Record<NonNullable<AvatarProps['size']>, { px: number; class: string }> = {
  sm: { px: 32, class: 'w-8 h-8 text-xs' },
  md: { px: 40, class: 'w-10 h-10 text-sm' },
  lg: { px: 56, class: 'w-14 h-14 text-base' },
}

export function Avatar({ src, firstName, lastName, size = 'md' }: AvatarProps) {
  const { px, class: sizeClass } = sizeMap[size]
  const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase()

  if (src) {
    return (
      <Image
        src={src}
        alt={`${firstName} ${lastName}`}
        width={px}
        height={px}
        className={`${sizeClass} rounded-full object-cover`}
      />
    )
  }

  return (
    <div
      className={`${sizeClass} rounded-full bg-primary-container text-on-primary flex items-center justify-center font-medium`}
    >
      {initials}
    </div>
  )
}
