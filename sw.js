// SWS탄도계산기 서비스워커 — 버전 202609170625
const CACHE = 'k14-202609170625';
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
// 앱 화면(HTML)은 인터넷 우선: 연결되면 항상 최신 버전, 3초 안에 응답이 없거나 오프라인이면 저장본 사용
// 아이콘 등 나머지 파일은 저장본 우선
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  const isPage = e.request.mode === 'navigate' || url.pathname.endsWith('/') || url.pathname.endsWith('.html');
  e.respondWith(caches.open(CACHE).then(async c => {
    if (isPage) {
      const net = fetch(e.request, { cache: 'no-store' }).then(r => { if (r && r.ok) c.put('./index.html', r.clone()); return r; });
      const timeout = new Promise(res => setTimeout(() => res(null), 3000));
      try { const r = await Promise.race([net, timeout]); if (r && r.ok) return r; } catch (err) {}
      return (await c.match('./index.html')) || net;
    }
    const hit = await c.match(e.request, { ignoreSearch: true });
    return hit || fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; });
  }));
});
