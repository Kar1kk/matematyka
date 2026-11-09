// Service worker: cała strona działa offline po pierwszej wizycie.
// Strategia: przy instalacji pobiera wszystkie strony i zasoby; potem „najpierw sieć,
// pamięć bez internetu” — online zawsze najnowsza wersja.
// Przy większej zmianie struktury podbij WERSJA (stara pamięć zostanie usunięta).
const WERSJA = "v11";
const PAMIEC = "matematyka-" + WERSJA;

importScripts("assets/dzialy.js"); // DZIALY_MATURA → lista stron tematów

const KATEX_FONTY = ["AMS-Regular", "Caligraphic-Bold", "Caligraphic-Regular", "Fraktur-Bold", "Fraktur-Regular",
  "Main-Bold", "Main-BoldItalic", "Main-Italic", "Main-Regular", "Math-BoldItalic", "Math-Italic",
  "SansSerif-Bold", "SansSerif-Italic", "SansSerif-Regular", "Script-Regular", "Size1-Regular", "Size2-Regular",
  "Size3-Regular", "Size4-Regular", "Typewriter-Regular"].map(f => `assets/katex/fonts/KaTeX_${f}.woff2`);

const PLIKI = [
  "./", "index.html", "manifest.webmanifest",
  "assets/style.css", "assets/site.js", "assets/dzialy.js", "assets/wykres.js", "assets/bryly3d.js",
  "assets/odpowiedzi.js", "assets/indeks.js", "assets/indeks-en.js", "assets/katex/katex.min.css", "assets/katex/katex.min.js", "assets/katex/contrib/auto-render.min.js",
  "assets/ikony/ikona-192.png",
  "matura/index.html", "matura/usuniete.html", "matura/sciaga.html",
  ...new Set(DZIALY_MATURA.flatMap(d => d.tematy.filter(t => t.plik).map(t => "matura/" + t.plik))),
  // wersja angielska: te same pliki w en/
  "en/", "en/index.html", "en/matura/index.html", "en/matura/usuniete.html", "en/matura/sciaga.html",
  ...new Set(DZIALY_MATURA.flatMap(d => d.tematy.filter(t => t.plik).map(t => "en/matura/" + t.plik))),
  ...KATEX_FONTY,
];

// Zawsze pytaj serwer (z pominięciem cache przeglądarki; GitHub Pages daje max-age=600),
// inaczej nowa wersja mogłaby zapisać do pamięci stare pliki.
const zSerwera = (url, tryb = "no-cache") => fetch(new Request(url, { cache: tryb }));

self.addEventListener("install", e => {
  // pojedyncze błędy (np. brak fontu) nie blokują instalacji
  e.waitUntil(caches.open(PAMIEC).then(c => Promise.allSettled(PLIKI.map(async p => {
    const odp = await zSerwera(p, "reload");
    if (odp.ok) await c.put(p, odp);
  }))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n.startsWith("matematyka-") && n !== PAMIEC).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET" || new URL(r.url).origin !== location.origin) return;
  // Najpierw sieć (świeża wersja; serwer odpowiada szybkim 304, gdy nic się nie zmieniło),
  // pamięć tylko bez internetu albo gdy serwer nie odpowie w 3 s.
  e.respondWith(caches.open(PAMIEC).then(async c => {
    const zSieci = zSerwera(r.url).then(odp => {
      if (odp.ok && !odp.redirected) c.put(r.url.split("#")[0], odp.clone());
      return odp;
    }).catch(() => null);
    const limit = new Promise(ok => setTimeout(() => ok("limit"), 3000));
    const pierwsza = await Promise.race([zSieci, limit]);
    if (pierwsza && pierwsza !== "limit") return pierwsza;
    const zPamieci = await c.match(r, { ignoreSearch: true });
    if (zPamieci) { e.waitUntil(zSieci); return zPamieci; }
    return (await zSieci) || new Response("Brak połączenia, a tej strony nie ma jeszcze w pamięci.",
      { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }));
});
