'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = { href: string; label: string; icon: string }
type NavSection = { label: string; items: NavItem[] }

export default function SidebarNav({ sections, isPapa }: { sections: NavSection[]; isPapa: boolean }) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <nav aria-label="Navigation principale">
      {/* Accueil */}
      <div className="mb-1">
        <Link
          href="/"
          aria-current={isActive('/') ? 'page' : undefined}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[44px] group font-semibold ${
            isActive('/')
              ? 'bg-terracotta/10 text-terracotta'
              : 'text-ink-soft hover:bg-sand-warm hover:text-ink'
          }`}
        >
          <span className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
            isActive('/') ? 'bg-terracotta text-white' : 'bg-sand group-hover:bg-sand-warm text-ink-soft'
          }`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </span>
          <span className="text-sm truncate">Accueil</span>
        </Link>
      </div>

      {sections.map(section => (
        <div key={section.label} className="mb-2">
          <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-terracotta/60 uppercase tracking-[0.12em]">
            {section.label}
          </p>
          {section.items.map(item => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[44px] group ${
                  active
                    ? 'bg-terracotta/10 text-terracotta font-semibold'
                    : 'text-ink-soft hover:bg-sand-warm hover:text-ink'
                }`}
              >
                <span className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
                  active
                    ? 'bg-terracotta text-white'
                    : 'bg-sand group-hover:bg-sand-warm text-ink-soft'
                }`}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d={item.icon}/>
                  </svg>
                </span>
                <span className="text-sm truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>
      ))}

      {isPapa && (
        <div className="mb-2">
          <p className="px-3 pt-3 pb-1 text-[10px] font-bold text-terracotta/60 uppercase tracking-[0.12em]">
            Papa
          </p>
          <Link
            href="/admin"
            aria-current={isActive('/admin') ? 'page' : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all min-h-[44px] group ${
              isActive('/admin')
                ? 'bg-terracotta/10 text-terracotta font-semibold'
                : 'text-ink-soft hover:bg-sand-warm hover:text-ink'
            }`}
          >
            <span className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors flex-shrink-0 ${
              isActive('/admin') ? 'bg-terracotta text-white' : 'bg-sand group-hover:bg-sand-warm text-ink-soft'
            }`}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
              </svg>
            </span>
            <span className="text-sm truncate">Tableau de bord</span>
          </Link>
        </div>
      )}
    </nav>
  )
}
