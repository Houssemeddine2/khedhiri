const CACHE_NAME = 'khedhiri-v1'
const PRECACHE_URLS = ['/', '/login']

// Installation : mise en cache de l'app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  )
  self.skipWaiting()
})

// Activation : nettoyage des anciens caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
      ),
  )
  self.clients.claim()
})

// Fetch : network-first pour les pages, cache-first pour les assets statiques
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Ignorer les requêtes non-GET et les APIs externes
  if (event.request.method !== 'GET') return
  if (!url.origin.includes('khedhiri.me') && !url.hostname === 'localhost') return
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.ok) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() => caches.match(event.request)),
  )
})

// Réception d'une notification push du serveur
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'khedhiri.me'
  const options = {
    body: data.body || '',
    icon: '/icons/192',
    badge: '/icons/192',
    data: { url: data.url || '/' },
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Clic sur une notification : focus ou ouvre l'app
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = event.notification.data?.url || '/'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ('focus' in client) {
            client.navigate(targetUrl)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(targetUrl)
        }
      }),
  )
})
