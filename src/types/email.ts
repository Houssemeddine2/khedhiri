export interface EmailMessage {
  uid: number
  subject: string
  from: string
  fromName: string
  date: string
  seen: boolean
}

export interface EmailMessageDetail {
  uid: number
  subject: string
  from: string
  fromName: string
  to: string
  date: string
  seen: boolean
  body: string
  html: string | null
}

export interface SendEmailParams {
  to: string
  subject: string
  body: string
  replyToSubject?: string
}
