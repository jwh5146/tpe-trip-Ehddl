/* 타이베이 가족여행 가이드 - 오프라인 보기용 서비스워커
   index.html과 같은 폴더(저장소 맨 위)에 올려야 합니다. */
var CACHE = 'tpe-guide-v1';
var PAGE = './index.html';

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return fetch(PAGE, { cache: 'reload' }).then(function (res) {
        if (res && res.ok) return cache.put(PAGE, res);
      });
    }).catch(function () {})
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  var isPage = req.mode === 'navigate' || url.pathname.endsWith('/index.html') || url.pathname.endsWith('/');
  if (!isPage) return;

  // 온라인이면 최신 페이지를 받아 저장하고, 오프라인이면 저장해 둔 페이지를 보여준다
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (cache) { cache.put(PAGE, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(PAGE, { ignoreSearch: true });
    })
  );
});
