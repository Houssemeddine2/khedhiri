'use client'

import { useState } from 'react'
import EmailSetup from './EmailSetup'
import EmailInbox from './EmailInbox'

interface EmailSetupWrapperProps {
  isPapa: boolean
}

export default function EmailSetupWrapper({ isPapa }: EmailSetupWrapperProps) {
  const [configured, setConfigured] = useState(false)
  if (configured) return <EmailInbox isPapa={isPapa} />
  return <EmailSetup onConfigured={() => setConfigured(true)} />
}
