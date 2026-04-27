import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope, Caveat } from 'next/font/google'
import PushRegistrar from '@/components/PushRegistrar'
import TuteurWidgetWrapper from '@/components/tutor-widget/TuteurWidgetWrapper'
import './globals.css'

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces-var',
  display: 'swap',
})

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope-var',
  display: 'swap',
})

const caveat = Caveat({
  subsets: ['latin'],
  variable: '--font-caveat-var',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'khedhiri.me — Notre famille',
  description: 'Notre petit monde entre Lisbonne et Tunis',
}

export const viewport: Viewport = {
  themeColor: '#C5563D',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="fr"
      className={`${fraunces.variable} ${manrope.variable} ${caveat.variable}`}
    >
      <body className="font-manrope antialiased">
        <PushRegistrar />
        {children}
        <TuteurWidgetWrapper />
      </body>
    </html>
  )
}
