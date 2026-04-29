import type { Metadata, Viewport } from 'next'
import { Fraunces, Manrope, Caveat } from 'next/font/google'
import PushRegistrar from '@/components/PushRegistrar'
import TuteurWidgetWrapper from '@/components/tutor-widget/TuteurWidgetWrapper'
import PresenceTracker from '@/components/PresenceTracker'
import { ChatProvider } from '@/contexts/ChatContext'
import { CallProvider } from '@/contexts/CallContext'
import ChatPanel from '@/components/chat/ChatPanel'
import IncomingCallAlert from '@/components/call/IncomingCallAlert'
import ActiveCallBar from '@/components/call/ActiveCallBar'
import VideoCallOverlay from '@/components/call/VideoCallOverlay'
import LeftSidebar from '@/components/LeftSidebar'
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
        <CallProvider>
          <ChatProvider>
            <PushRegistrar />
            <PresenceTracker />
            {/* Sidebar gauche fixe — desktop uniquement */}
            <aside className="hidden md:flex flex-col fixed top-14 left-0 w-[260px] bg-cream border-r border-sand/60 z-40" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>
              <LeftSidebar />
            </aside>
            {/* Contenu décalé de la largeur de la sidebar */}
            <div className="hidden md:block" style={{ paddingLeft: '260px' }}>
              {children}
            </div>
            <div className="md:hidden">
              {children}
            </div>
            <TuteurWidgetWrapper />
            <ChatPanel />
            <IncomingCallAlert />
            <ActiveCallBar />
            <VideoCallOverlay />
          </ChatProvider>
        </CallProvider>
      </body>
    </html>
  )
}
