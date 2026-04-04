'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/home', icon: 'home', label: 'Home' },
  { href: '/calendario', icon: 'calendar_today', label: 'Calendario' },
  { href: '/hub', icon: 'storefront', label: 'Hub' },
] as const

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 inset-x-0 backdrop-blur-md bg-surface/80 pb-safe">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
          const linkClass = `flex flex-col items-center gap-1 py-1 px-3 ${isActive ? 'text-primary' : 'text-on-surface-variant'}`
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={linkClass}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="material-symbols-outlined text-2xl">{tab.icon}</span>
              <span className="text-xs font-medium">{tab.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
