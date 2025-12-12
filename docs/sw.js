// Service Worker for performance optimization
const CACHE_NAME = 'uromm-cache-v1';
const MANIFEST_CACHE = 'manifest-cache-v1';

// Cache critical resources with instant priority
const INSTANT_CACHE = [
    './assets/css/main.css',
    './assets/css/transitions.css'
];

const CRITICAL_RESOURCES = [
    './assets/css/performance.css',
    './assets/js/modules/library-app.js',
    './assets/js/modules/ui.js',
    './assets/js/modules/search.js',
    './assets/js/modules/cache.js',
    './assets/js/utils/page-transitions.js'
];

// Install event - cache critical resources
self.addEventListener('install', event => {
    event.waitUntil(
        Promise.all([
            caches.open(CACHE_NAME).then(cache => cache.addAll([...INSTANT_CACHE, ...CRITICAL_RESOURCES])),
            caches.open('instant-cache-v1').then(cache => cache.addAll(INSTANT_CACHE))
        ]).then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME && cacheName !== MANIFEST_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    
    // Manifest.json - Network first with cache fallback
    if (url.pathname.includes('manifest.json')) {
        event.respondWith(
            fetch(event.request).catch(() => 
                caches.match(event.request).then(cached => 
                    cached || new Response('[]', { 
                        status: 200, 
                        headers: { 'Content-Type': 'application/json' } 
                    })
                )
            )
        );
        return;
    }
    
    // Instant cache resources - Immediate response
    if (INSTANT_CACHE.some(resource => url.pathname.includes(resource))) {
        event.respondWith(instantCache(event.request));
        return;
    }
    
    // Critical resources - Cache first
    if (CRITICAL_RESOURCES.some(resource => url.pathname.includes(resource))) {
        event.respondWith(cacheFirst(event.request));
        return;
    }
    
    // Images - Cache first with fallback
    if (event.request.destination === 'image') {
        event.respondWith(cacheFirstImage(event.request));
        return;
    }
    
    // Other requests - Network first
    event.respondWith(networkFirst(event.request));
});

// Cache first strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        return new Response('Offline', { status: 503 });
    }
}

// Cache first with TTL for manifest
async function cacheFirstWithTTL(request, cacheName, ttl) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    
    if (cached) {
        const cachedDate = cached.headers.get('sw-cache-date');
        if (cachedDate && (Date.now() - parseInt(cachedDate)) < ttl) {
            return cached;
        }
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            const responseToCache = response.clone();
            responseToCache.headers.set('sw-cache-date', Date.now().toString());
            cache.put(request, responseToCache);
        }
        return response;
    } catch (error) {
        return cached || new Response('Offline', { status: 503 });
    }
}

// Network first strategy
async function networkFirst(request) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(request);
        return cached || new Response('Offline', { status: 503 });
    }
}

// Instant cache for critical CSS
async function instantCache(request) {
    const cache = await caches.open('instant-cache-v1');
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    // Fallback to network if not in instant cache
    return cacheFirst(request);
}

// Cache first for images with fallback
async function cacheFirstImage(request) {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    
    if (cached) {
        return cached;
    }
    
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    } catch (error) {
        // Return placeholder image for failed loads
        return new Response(
            '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"><rect width="300" height="200" fill="#f0f0f0"/><text x="150" y="100" text-anchor="middle" fill="#999">Image unavailable</text></svg>',
            { headers: { 'Content-Type': 'image/svg+xml' } }
        );
    }
}