// Crypto côté client uniquement — Web Crypto API (browser)
// Aucune donnée en clair ne quitte jamais le navigateur.

const CHECK_PLAINTEXT = 'khedhiri-journal-ok'
const PBKDF2_ITERATIONS = 250_000

function toB64(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
}

function fromB64(b64: string): Uint8Array<ArrayBuffer> {
  const raw = atob(b64)
  const buf = new ArrayBuffer(raw.length)
  const view = new Uint8Array(buf)
  for (let i = 0; i < raw.length; i++) view[i] = raw.charCodeAt(i)
  return view
}

export function generateSalt(): string {
  const salt = new Uint8Array(16)
  crypto.getRandomValues(salt)
  return toB64(salt.buffer)
}

export async function deriveKey(password: string, saltB64: string): Promise<CryptoKey> {
  const enc = new TextEncoder()
  const baseKey = await crypto.subtle.importKey(
    'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
  )
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(saltB64), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = new Uint8Array(12)
  crypto.getRandomValues(iv)
  const enc = new TextEncoder()
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
  return JSON.stringify({ iv: toB64(iv.buffer), data: toB64(data) })
}

export async function decrypt(key: CryptoKey, cipher: string): Promise<string> {
  const { iv, data } = JSON.parse(cipher) as { iv: string; data: string }
  const dec = new TextDecoder()
  const plain = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromB64(iv) },
    key,
    fromB64(data)
  )
  return dec.decode(plain)
}

export async function buildCheckCipher(key: CryptoKey): Promise<string> {
  return encrypt(key, CHECK_PLAINTEXT)
}

export async function verifyKey(key: CryptoKey, checkCipher: string): Promise<boolean> {
  try {
    const result = await decrypt(key, checkCipher)
    return result === CHECK_PLAINTEXT
  } catch {
    return false
  }
}
