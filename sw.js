+const CACHE_VERSION = 'v3';
+const CACHE_NAME = `soundboard-cache-${CACHE_VERSION}`;
+const VERSION_SUFFIX = `?v=${CACHE_VERSION}`;
+const ASSETS = [
+  '/',
+  '/index.html',
+  `/index.html${VERSION_SUFFIX}`,
+  `/css/styles.css${VERSION_SUFFIX}`,
+  `/css/spinner.css${VERSION_SUFFIX}`,
+  '/img/mlg-favicon.png',
+  `/loader.js${VERSION_SUFFIX}`,
+  '/sounds.json',
+];
+
+self.addEventListener('install', (event) => {
+  console.log('SW installing...');
+  self.skipWaiting();
+  event.waitUntil(
+    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
+  );
+});
+
+self.addEventListener('activate', (event) => {
+  console.log('SW activating...');
+  event.waitUntil(
+    caches
+      .keys()
+      .then((keys) =>
+        Promise.all(
+          keys
+            .filter((key) =>
+              key.startsWith('soundboard-cache-') && key !== CACHE_NAME
+            )
+            .map((key) => caches.delete(key))
+        )
+      )
+      .then(() => self.clients.claim())
+  );
+});
+
+self.addEventListener('fetch', (event) => {
+  const { request } = event;
+  if (request.method !== 'GET') return;
+
+  const requestURL = new URL(request.url);
+
+  if (requestURL.origin === self.location.origin) {
+    if (
+      request.mode === 'navigate' ||
+      requestURL.pathname === '/' ||
+      requestURL.pathname.endsWith('.html')
+    ) {
+      event.respondWith(
+        fetch(request)
+          .then((response) => {
+            const clone = response.clone();
+            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
+            return response;
+          })
+          .catch(() => caches.match(request))
+      );
+      return;
+    }
+
+    event.respondWith(
+      caches.match(request).then((cached) => {
+        if (cached) return cached;
+
+        return fetch(request).then((response) => {
+          const clone = response.clone();
+          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
+          return response;
+        });
+      })
+    );
+  }
+});
