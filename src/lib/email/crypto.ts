import { createCipheriv, createDecipheriv, createHmac, randomBytes } from 'crypto'

function deriveKey(userId: string): Buffer {
  const secret = process.env.EMAIL_ENCRYPTION_SECRET
  if (!secret) throw new Error('EMAIL_ENCRYPTION_SECRET manquant')
  if (secret.length < 32) throw new Error('EMAIL_ENCRYPTION_SECRET trop court (min 32 caractères)')
  return createHmac('sha256', secret).update(userId).digest()
}

export function encryptPassword(plaintext: string, userId: string): string {
  const key = deriveKey(userId)
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptPassword(ciphertext: string, userId: string): string {
  const key = deriveKey(userId)
  const buf = Buffer.from(ciphertext, 'base64')
  if (buf.length < 28) throw new Error('Données chiffrées corrompues ou invalides')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const encrypted = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', key, iv)
  decipher.setAuthTag(tag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}
