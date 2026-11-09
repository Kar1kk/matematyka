// Service worker: cała strona działa offline po pierwszej wizycie.
// Strategia: przy instalacji pobiera wszystkie strony i zasoby; potem „najpierw z pamięci,
// w tle odśwież” — nowa wersja pliku pojawia się przy kolejnym otwarciu.
// Przy większej zmianie struktury podbij WERSJA (stara pamięć zostanie usunięta).
const WERSJA = "v5";
const PAMIEC = "matematyka-" + WERSJA;

importScripts("assets/dzialy.js"); // DZIALY_MATURA → lista stron tematów

const KATEX_FONTY = ["AMS-Regular", "Caligraphic-Bold", "Caligraphic-Regular", "Fraktur-Bold", "Fraktur-Regular",
  "Main-Bold", "Main-BoldItalic", "Main-Italic", "Main-Regular", "Math-BoldItalic", "Math-Italic",
  "SansSerif-Bold", "SansSerif-Italic", "SansSerif-Regular", "Script-Regular", "Size1-Regular", "Size2-Regular",
  "Size3-Regular", "Size4-Regular", "Typewriter-Regular"].map(f => `assets/katex/fonts/KaTeX_${f}.woff2`);

const PLIKI = [
  "./", "index.html", "manifest.webmanifest",
  "assets/style.css", "assets/site.js", "assets/dzialy.js", "assets/wykres.js", "assets/bryly3d.js",
  "assets/odpowiedzi.js", "assets/indeks.js", "assets/katex/katex.min.css", "assets/katex/katex.min.js", "assets/katex/contrib/auto-render.min.js",
  "assets/ikony/ikona-192.png",
  "matura/index.html", "matura/usuniete.html", "matura/sciaga.html",
  ...new Set(DZIALY_MATURA.flatMap(d => d.tematy.filter(t => t.plik).map(t => "matura/" + t.plik))),
  ...KATEX_FONTY,
];

self.addEventListener("install", e => {
  // pojedyncze błędy (np. brak fontu) nie blokują instalacji
  e.waitUntil(caches.open(PAMIEC).then(c => Promise.allSettled(PLIKI.map(p => c.add(p)))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n.startsWith("matematyka-") && n !== PAMIEC).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  e.respondWith(caches.open(PAMIEC).then(async c => {
    const zPamieci = await c.match(r, { ignoreSearch: true });
    const zSieci = fetch(r).then(odp => { if (odp.ok) c.put(r, odp.clone()); return odp; }).catch(() => null);
    if (zPamieci) { e.waitUntil(zSieci); return zPamieci; }
    return (await zSieci) || new Response("Brak połączenia, a tej strony nie ma jeszcze w pamięci.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }));
});
