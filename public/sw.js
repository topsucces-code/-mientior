// Mientior Service Worker
const STATIC_CACHE = 'mientior-static-v1';
const DYNAMIC_CACHE = 'mientior-dynamic-v1';
const IMAGE_CACHE = 'mientior-images-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
];

// Cache strategies
const CACHE_STRATEGIES = {
  // Network first, fallback to cache
  networkFirst: async (request, cacheName) => {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || caches.match('/offline');
    }
  },

  // Cache first, fallback to network
  cacheFirst: async (request, cacheName) => {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return caches.match('/offline');
    }
  },

  // Stale while revalidate
  staleWhileRevalidate: async (request, cacheName) => {
    const cachedResponse = await caches.match(request);
    const fetchPromise = fetch(request)
      .then(async (networkResponse) => {
        if (networkResponse && networkResponse.ok) {
          try {
            const responseToCache = networkResponse.clone();
            const cache = await caches.open(cacheName);
            await cache.put(request, responseToCache);
          } catch (error) {
            // Ignore caching errors (e.g. Response body already used)
          }
        }
        return networkResponse;
      })
      .catch(() => cachedResponse);

    return cachedResponse || fetchPromise;
  },
};

// Install event - cache static assets
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('[SW] Caching static assets');
        // Cache assets individually to avoid failing on missing files
        return Promise.allSettled(
          STATIC_ASSETS.map(asset => 
            cache.add(asset).catch(err => {
              console.warn(`[SW] Failed to cache ${asset}:`, err.message);
            })
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => {
            return name.startsWith('mientior-') && 
                   name !== STATIC_CACHE && 
                   name !== DYNAMIC_CACHE && 
                   name !== IMAGE_CACHE;
          })
          .map(name => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests (except images)
  if (url.origin !== location.origin && !request.url.includes('images')) {
    return;
  }

  // Skip API requests (except for specific endpoints)
  if (url.pathname.startsWith('/api/')) {
    // Cache product data for offline browsing
    if (url.pathname.includes('/products') && request.method === 'GET') {
      event.respondWith(CACHE_STRATEGIES.networkFirst(request, DYNAMIC_CACHE));
      return;
    }
    return;
  }

  // Handle different request types
  if (request.destination === 'image' || url.pathname.match(/\.(jpg|jpeg|png|gif|webp|svg|ico)$/i)) {
    // Images - cache first
    event.respondWith(CACHE_STRATEGIES.cacheFirst(request, IMAGE_CACHE));
    return;
  }

  if (request.destination === 'style' || request.destination === 'script' || 
      url.pathname.match(/\.(css|js)$/i)) {
    // Static assets - stale while revalidate
    event.respondWith(CACHE_STRATEGIES.staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  if (request.destination === 'document' || request.mode === 'navigate') {
    // HTML pages - network first
    event.respondWith(CACHE_STRATEGIES.networkFirst(request, DYNAMIC_CACHE));
    return;
  }

  // Default - network first
  event.respondWith(CACHE_STRATEGIES.networkFirst(request, DYNAMIC_CACHE));
});

// Push notification event
self.addEventListener('push', event => {
  console.log('[SW] Push notification received');
  
  let data = {
    title: 'Mientior',
    body: 'Vous avez une nouvelle notification',
    icon: '/images/placeholder.svg',
    badge: '/images/placeholder.svg',
    tag: 'default',
    data: { url: '/' }
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon,
    badge: data.badge,
    tag: data.tag,
    data: data.data,
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click event
self.addEventListener('notificationclick', event => {
  console.log('[SW] Notification clicked');
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(windowClients => {
        // Check if there's already a window open
        for (const client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync event
self.addEventListener('sync', event => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-cart') {
    event.waitUntil(syncCart());
  }

  if (event.tag === 'sync-wishlist') {
    event.waitUntil(syncWishlist());
  }
});

// Sync cart data
async function syncCart() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cartData = await cache.match('/api/cart/pending');
    
    if (cartData) {
      const data = await cartData.json();
      await fetch('/api/cart/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await cache.delete('/api/cart/pending');
    }
  } catch (error) {
    console.error('[SW] Cart sync failed:', error);
  }
}

// Sync wishlist data
async function syncWishlist() {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);
    const wishlistData = await cache.match('/api/wishlist/pending');
    
    if (wishlistData) {
      const data = await wishlistData.json();
      await fetch('/api/wishlist/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      await cache.delete('/api/wishlist/pending');
    }
  } catch (error) {
    console.error('[SW] Wishlist sync failed:', error);
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-products') {
    event.waitUntil(updateProductCache());
  }
});

// Update product cache
async function updateProductCache() {
  try {
    const response = await fetch('/api/products/featured');
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      await cache.put('/api/products/featured', response);
    }
  } catch (error) {
    console.error('[SW] Product cache update failed:', error);
  }
}

// Message event - communication with main thread
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then(names => 
        Promise.all(names.map(name => caches.delete(name)))
      )
    );
  }

  if (event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DYNAMIC_CACHE).then(cache => 
        cache.addAll(event.data.urls)
      )
    );
  }
});

console.log('[SW] Service worker loaded');
