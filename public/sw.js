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
