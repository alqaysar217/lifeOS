
self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
});

self.addEventListener('fetch', (event) => {
  // أساسي للسماح بالتثبيت وعمل التطبيق في وضع عدم الاتصال مستقبلاً
  event.respondWith(fetch(event.request));
});
