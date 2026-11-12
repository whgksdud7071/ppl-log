// 오프라인용: 헬스장에서 신호가 약해도 앱이 열리게 한다.
// 페이지는 네트워크 우선(업데이트가 바로 반영), 나머지는 캐시 우선.
const CACHE = 'ppl-v2';
const SHELL = ['./', 'index.html', 'manifest.webmanifest', 'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate') {
    e.respondWith(
      // GitHub Pages가 10분 캐시를 걸어서, 브라우저 캐시를 건너뛰고 서버에 확인한다
      fetch(req, { cache: 'no-cache' })
        .then(res => { const copy = res.clone(); caches.open(CACHE).then(c => c.put('./', copy)); return res; })
        .catch(() => caches.match('./'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok || res.type === 'opaque') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }))
  );
});
