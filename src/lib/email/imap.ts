import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import type { EmailMessage, EmailMessageDetail } from '@/types/email'

const IMAP_HOST = process.env.OVH_IMAP_HOST ?? 'ssl0.ovh.net'
const IMAP_PORT = Number(process.env.OVH_IMAP_PORT ?? '993')

function makeClient(email: string, password: string): ImapFlow {
  return new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
    connectionTimeout: 8000,
    greetingTimeout: 5000,
  })
}

export async function fetchMessages(
  email: string,
  password: string,
  folder = 'INBOX',
  page = 1,
): Promise<EmailMessage[]> {
  const client = makeClient(email, password)
  await client.connect()
  const lock = await client.getMailboxLock(folder)
  try {
    const total = (client.mailbox as { exists: number }).exists
    if (total === 0) return []
    const pageSize = 20
    const to = Math.max(1, total - (page - 1) * pageSize)
    const from = Math.max(1, to - pageSize + 1)
    const messages: EmailMessage[] = []
    for await (const msg of client.fetch(`${from}:${to}`, {
      uid: true,
      envelope: true,
      flags: true,
    })) {
      const envelope = msg.envelope as NonNullable<typeof msg.envelope>
      const flags = msg.flags as NonNullable<typeof msg.flags>
      messages.push({
        uid: msg.uid,
        subject: envelope.subject ?? '(sans objet)',
        from: envelope.from?.[0]?.address ?? '',
        fromName: envelope.from?.[0]?.name ?? '',
        date: envelope.date?.toISOString() ?? '',
        seen: flags.has('\\Seen'),
      })
    }
    return messages.reverse()
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function fetchMessageDetail(
  email: string,
  password: string,
  uid: number,
  folder = 'INBOX',
): Promise<EmailMessageDetail | null> {
  const client = makeClient(email, password)
  await client.connect()
  const lock = await client.getMailboxLock(folder)
  try {
    let result: EmailMessageDetail | null = null
    for await (const msg of client.fetch(
      { uid: String(uid) },
      { uid: true, envelope: true, source: true, flags: true },
      { uid: true },
    )) {
      const source = msg.source as NonNullable<typeof msg.source>
      const envelope = msg.envelope as NonNullable<typeof msg.envelope>
      const flags = msg.flags as NonNullable<typeof msg.flags>
      const parsed = await simpleParser(source)
      result = {
        uid: msg.uid,
        subject: envelope.subject ?? '(sans objet)',
        from: envelope.from?.[0]?.address ?? '',
        fromName: envelope.from?.[0]?.name ?? '',
        to: (envelope.to as { address?: string }[])?.[0]?.address ?? '',
        date: envelope.date?.toISOString() ?? '',
        seen: flags.has('\\Seen'),
        body: (parsed as { text?: string }).text ?? '',
        html: (parsed as { html?: string | false }).html || null,
      }
      await client.messageFlagsAdd({ uid: String(uid) }, ['\\Seen'], { uid: true })
    }
    return result
  } finally {
    lock.release()
    await client.logout()
  }
}

export async function deleteMessage(
  email: string,
  password: string,
  uid: number,
  folder = 'INBOX',
): Promise<void> {
  const client = makeClient(email, password)
  await client.connect()
  const lock = await client.getMailboxLock(folder)
  try {
    await client.messageDelete({ uid: String(uid) }, { uid: true })
  } finally {
    lock.release()
    await client.logout()
  }
}
