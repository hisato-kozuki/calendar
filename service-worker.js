// キャッシュファイルの指定
var CACHE_NAME = 'pwa-mycalendar-caches-25-11-26';
var urlsToCache = [
    '/calendar/index.html',
    '/calendar/main.js',
    '/calendar/function.js',
    '/calendar/class.js',
    '/calendar/style.css',
    '/calendar/style_pc.css',
    '/calendar/style_sm_land.css',
    '/calendar/style_sm_port.css',
];

// インストール処理
self.addEventListener('install', function(event) {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then(function(cache) {
                return cache.addAll(urlsToCache);
            })
    );
});

// リソースフェッチ時のキャッシュロード処理
self.addEventListener('fetch', function(event) {
    event.respondWith(
        caches
            .match(event.request)
            .then(function(response) {
                return response ? response : fetch(event.request);
            })
    );
});