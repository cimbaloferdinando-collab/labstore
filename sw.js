const CACHE = 'labstore-v5';

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(['/index.html', '/']))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))
    ).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls: network only, mai cache
  if(url.hostname.includes('supabase.co')||url.hostname.includes('anthropic.com')){
    e.respondWith(fetch(e.request).catch(()=>new Response('[]',{headers:{'Content-Type':'application/json'}})));
    return;
  }

  // App shell: cache-first, aggiorna in background
  e.respondWith(
    caches.open(CACHE).then(cache =>
      cache.match(e.request).then(cached => {
        const network = fetch(e.request).then(res => {
          if(res.ok) cache.put(e.request, res.clone());
          return res;
        }).catch(()=>cached||new Response('Offline', {status:503}));
        return cached || network;
      })
    )
  );
});
