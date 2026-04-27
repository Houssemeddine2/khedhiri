'use client'

import { useEffect } from 'react'
import { saveSubscription } from '@/app/actions/push'

export default function PushRegistrar() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

    async function inscrire() {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js')

        // Ne pas re-demander si déjà abonné
        const existing = await reg.pushManager.getSubscription()
        if (existing) return

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(
            process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
          ),
        })

        // toJSON() retourne endpoint + keys (p256dh + auth) en base64url
        const subJSON = sub.toJSON() as {
          endpoint: string
          keys: { p256dh: string; auth: string }
        }

        await saveSubscription({ endpoint: subJSON.endpoint, keys: subJSON.keys })
      } catch (err) {
        console.error('Erreur inscription push:', err)
      }
    }

    inscrire()
  }, [])

  return null
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const bytes = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
  return bytes.buffer
}
