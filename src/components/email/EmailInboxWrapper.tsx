'use client'

import EmailInbox from './EmailInbox'

interface EmailInboxWrapperProps {
  isPapa: boolean
}

export default function EmailInboxWrapper({ isPapa }: EmailInboxWrapperProps) {
  return <EmailInbox isPapa={isPapa} />
}
