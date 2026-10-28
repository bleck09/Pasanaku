// Guarda los archivos de la app en el celular para que abra rápido. Los datos (Firebase) nunca se guardan aquí.
const CACHE = "pasanaku-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  const url = new URL(request.url);
  // Solo los archivos de este mismo sitio; Firebase, fuentes y demás van directo a internet
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // La página: siempre la versión nueva si hay internet; si no, la guardada
  if (request.mode === "navigate") {
    e.respondWith(
      fetch(request)
        .then((r) => { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(request, copia)); return r; })
        .catch(() => caches.match(request).then((r) => r || caches.match(self.registration.scope))),
    );
    return;
  }

  // Archivos de la app: salen de la bodega al instante y se refrescan por detrás
  e.respondWith(
    caches.match(request).then((guardado) => {
      const red = fetch(request)
        .then((r) => { if (r.ok) { const copia = r.clone(); caches.open(CACHE).then((c) => c.put(request, copia)); } return r; })
        .catch(() => guardado);
      return guardado || red;
    }),
  );
});
