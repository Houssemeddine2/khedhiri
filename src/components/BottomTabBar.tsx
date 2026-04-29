'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState } from 'react'

interface BottomTabBarProps {
  isPapa: boolean
  lettresBadge: number
  calinsBadge: number
}

const MAIN_TABS = [
  {
    href: '/',
    label: 'Accueil',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
  {
    href: '/album',
    label: 'Album',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
  },
  {
    href: '/atelier',
    label: 'Créer',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
        <path d="M2 2l7.586 7.586"/>
        <circle cx="11" cy="11" r="2"/>
      </svg>
    ),
  },
  {
    href: '/tuteur',
    label: 'Tuteur',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
      </svg>
    ),
  },
]

const MORE_ITEMS_BASE = [
  { href: '/agenda',     label: 'Agenda',       icon: '📅' },
  { href: '/decouverte', label: 'Villes',        icon: '🌍' },
  { href: '/defis',      label: 'Défis',         icon: '⭐' },
  { href: '/lectures',   label: 'Lectures',      icon: '📚' },
  { href: '/jeux',       label: 'Jeux',          icon: '🎮' },
  { href: '/famille',    label: 'Famille',       icon: '👨‍👧' },
  { href: '/email',      label: 'Email',         icon: '📧' },
  { href: '/lettres',    label: 'Lettres',       icon: '💌' },
  { href: '/calin',      label: 'Câlins',        icon: '🤗' },
  { href: '/memoire',    label: 'Souvenirs',     icon: '🎁' },
  { href: '/journal',    label: 'Journal',       icon: '📓' },
  { href: '/profil',     label: 'Mon profil',    icon: '👤' },
]

export default function BottomTabBar({ isPapa, lettresBadge, calinsBadge }: BottomTabBarProps) {
  const pathname = usePathname()
  const [moreOpen, setMoreOpen] = useState(false)

  const moreItems = isPapa
    ? MORE_ITEMS_BASE.filter(i => i.href !== '/journal')
    : MORE_ITEMS_BASE

  return (
    <>
      {/* Overlay du drawer */}
      {moreOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/30 md:hidden animate-fade-in"
          onClick={() => setMoreOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer "Plus" */}
      {moreOpen && (
        <div
          className="fixed bottom-16 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl md:hidden animate-slide-up"
          role="dialog"
          aria-label="Toutes les sections"
        >
          <div className="w-10 h-1 bg-sand-warm rounded-full mx-auto mt-3 mb-2" aria-hidden="true" />
          <p className="text-center text-xs font-semibold text-ink-soft uppercase tracking-widest pb-3">
            Navigation
          </p>
          <div className="grid grid-cols-4 gap-1 px-3 pb-6">
            {moreItems.map(item => {
              const hasBadge =
                (item.href === '/lettres' && lettresBadge > 0) ||
                (item.href === '/calin' && calinsBadge > 0)
              const badgeCount =
                item.href === '/lettres' ? lettresBadge : calinsBadge

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="relative flex flex-col items-center gap-1.5 p-3 rounded-xl hover:bg-sand active:bg-sand-warm transition-colors min-h-[72px] justify-center"
                >
                  <span className="text-2xl leading-none" aria-hidden="true">{item.icon}</span>
                  <span className="text-[11px] text-ink-soft font-medium text-center leading-tight">
                    {item.label}
                  </span>
                  {hasBadge && (
                    <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-terracotta text-white text-[9px] font-bold flex items-center justify-center">
                      {badgeCount}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Barre du bas */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-sand shadow-[0_-1px_3px_rgba(42,31,24,0.08)] md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigation principale"
      >
        <div className="flex items-stretch h-14">
          {MAIN_TABS.map(tab => {
            const isActive = tab.href === '/'
              ? pathname === '/'
              : pathname.startsWith(tab.href)

            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px] ${
                  isActive ? 'text-terracotta' : 'text-ink-soft'
                }`}
              >
                <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
                  {tab.icon}
                </span>
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            )
          })}

          {/* Bouton Plus */}
          <button
            onClick={() => setMoreOpen(v => !v)}
            aria-label="Plus de sections"
            aria-expanded={moreOpen}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px] ${
              moreOpen ? 'text-terracotta' : 'text-ink-soft'
            }`}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="5" cy="12" r="1"/>
              <circle cx="12" cy="12" r="1"/>
              <circle cx="19" cy="12" r="1"/>
            </svg>
            <span className="text-[10px] font-medium">Plus</span>
          </button>
        </div>
      </nav>

    </>
  )
}
