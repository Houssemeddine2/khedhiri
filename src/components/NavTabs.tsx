'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const TABS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/album',
    label: 'Album',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    href: '/atelier',
    label: 'Atelier',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    ),
  },
  {
    href: '/defis',
    label: 'Défis',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    href: '/tuteur',
    label: 'Tuteur',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
]

export default function NavTabs() {
  const pathname = usePathname()

  return (
    <nav
      className="hidden md:flex items-stretch h-14 flex-1 justify-center max-w-xl"
      aria-label="Navigation principale"
    >
      {TABS.map(tab => {
        const isActive = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href)

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? 'page' : undefined}
            className={`relative flex items-center justify-center w-[88px] h-full transition-colors rounded-lg mx-0.5 group ${
              isActive
                ? 'text-terracotta'
                : 'text-ink-soft hover:bg-sand hover:text-ink'
            }`}
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-xl group-hover:bg-sand-warm/60 transition-colors">
              {tab.icon}
            </span>
            {isActive && (
              <span
                className="absolute bottom-0 left-2 right-2 h-[3px] bg-terracotta rounded-t-full"
                aria-hidden="true"
              />
            )}
            <span className="sr-only">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
