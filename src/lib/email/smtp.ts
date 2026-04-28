import nodemailer from 'nodemailer'

const SMTP_HOST = process.env.OVH_SMTP_HOST ?? 'ssl0.ovh.net'
const SMTP_PORT = Number(process.env.OVH_SMTP_PORT ?? '465')

export async function sendEmail(params: {
  fromEmail: string
  password: string
  to: string
  subject: string
  body: string
}): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: true,
    auth: { user: params.fromEmail, pass: params.password },
  })
  await transporter.sendMail({
    from: params.fromEmail,
    to: params.to,
    subject: params.subject,
    text: params.body,
  })
}
