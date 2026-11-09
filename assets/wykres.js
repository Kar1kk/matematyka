// Silnik wykresów na <canvas>, wspólny dla wszystkich interaktywnych demo.
// Pełny opis API: docs/PISANIE.md. Skrót:
//   const w = new Wykres(canvas, { xmin: -6, xmax: 6, ymin: -5, ymax: 7 });
//   w.rysuj(g => { g.funkcja(x => x*x, 1); g.punkt(0, 0, "W"); });
// Kolory: nr 1..4 → zmienne CSS --plot-1..4 (działają w jasnym i ciemnym motywie).

class Wykres {
  // zakres: { xmin, xmax, ymin, ymax,
  //           krokX = 1, krokY = 1          — co ile linie siatki i podpisy,
  //           formatX, formatY              — funkcja liczba → podpis (np. Wykres.pi),
  //           rowneSkale = false            — 1 jednostka w poziomie = 1 w pionie (geometria!),
  //           siatka = true, osie = true, podpisy = true }
  constructor(canvas, zakres) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.z0 = Object.assign({ krokX: 1, krokY: 1, siatka: true, osie: true, podpisy: true }, zakres);
    this.z = { ...this.z0 };
    this._ostatni = null;
    new ResizeObserver(() => this._odswiez()).observe(canvas);
    document.addEventListener("zmiana-motywu", () => this._odswiez());
    matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this._odswiez());
  }

  // ---------- układ współrzędnych ----------
  kolor(nr) {
    const nazwa = typeof nr === "number" ? `--plot-${nr}` : nr;
    return getComputedStyle(document.documentElement).getPropertyValue(nazwa).trim() || nr;
  }
  kolorA(nr, a) {
    const k = this.kolor(nr);
    if (!k.startsWith("#")) return k;
    const h = k.length === 4 ? k.slice(1).split("").map(c => c + c).join("") : k.slice(1);
    const [r, g, b] = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16));
    return `rgba(${r},${g},${b},${a})`;
  }
  sx(x) { return (x - this.z.xmin) / (this.z.xmax - this.z.xmin) * this.w; }
  sy(y) { return this.h - (y - this.z.ymin) / (this.z.ymax - this.z.ymin) * this.h; }
  wx(px) { return this.z.xmin + px / this.w * (this.z.xmax - this.z.xmin); }
  wy(py) { return this.z.ymin + (this.h - py) / this.h * (this.z.ymax - this.z.ymin); }
  get jednostka() { return this.w / (this.z.xmax - this.z.xmin); } // px na 1 jednostkę X

  rysuj(fn) { this._ostatni = fn; this._odswiez(); }

  // Zmiana zakresu osi po utworzeniu (np. przy suwaku n): w.zakres({ xmax: 20, krokX: 2 })
  zakres(zmiany) { Object.assign(this.z0, zmiany); return this; }

  _odswiez() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.c.getBoundingClientRect();
    if (!r.width) return;
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.z = { ...this.z0 };
    if (this.z.rowneSkale) {
      const sx = this.w / (this.z.xmax - this.z.xmin), sy = this.h / (this.z.ymax - this.z.ymin);
      if (sx > sy) { const s = (this.z.xmax - this.z.xmin) * (sx / sy - 1) / 2; this.z.xmin -= s; this.z.xmax += s; }
      else { const s = (this.z.ymax - this.z.ymin) * (sy / sx - 1) / 2; this.z.ymin -= s; this.z.ymax += s; }
    }
    this.ctx.clearRect(0, 0, this.w, this.h);
    this._siatka();
    if (this._ostatni) this._ostatni(this);
  }

  _kroki(min, max, krok) {
    const t = [];
    for (let v = Math.ceil(min / krok - 1e-9) * krok; v <= max + 1e-9; v += krok) t.push(Math.round(v / krok) * krok);
    return t;
  }

  _siatka() {
    const { ctx, z } = this;
    const xs = this._kroki(z.xmin, z.xmax, z.krokX), ys = this._kroki(z.ymin, z.ymax, z.krokY);
    if (z.siatka) {
      ctx.lineWidth = 1; ctx.strokeStyle = this.kolor("--plot-grid"); ctx.beginPath();
      xs.forEach(x => { ctx.moveTo(this.sx(x), 0); ctx.lineTo(this.sx(x), this.h); });
      ys.forEach(y => { ctx.moveTo(0, this.sy(y)); ctx.lineTo(this.w, this.sy(y)); });
      ctx.stroke();
    }
    if (!z.osie) return;
    const ox = Math.min(Math.max(this.sy(0), 0), this.h), oy = Math.min(Math.max(this.sx(0), 0), this.w);
    ctx.strokeStyle = this.kolor("--plot-axis"); ctx.lineWidth = 1.2; ctx.beginPath();
    ctx.moveTo(0, ox); ctx.lineTo(this.w, ox); ctx.moveTo(oy, 0); ctx.lineTo(oy, this.h); ctx.stroke();
    if (!z.podpisy) return;
    ctx.fillStyle = this.kolor("--plot-axis"); ctx.font = "12px Segoe UI, sans-serif";
    const fx = z.formatX || ladna, fy = z.formatY || ladna;
    xs.forEach(x => { if (Math.abs(x) > 1e-9) ctx.fillText(fx(x), this.sx(x) + 2, Math.min(ox + 13, this.h - 3)); });
    ys.forEach(y => { if (Math.abs(y) > 1e-9) ctx.fillText(fy(y), Math.min(oy + 4, this.w - 24), this.sy(y) - 2); });
  }

  _linia(nr, opcje = {}) {
    const { ctx } = this;
    ctx.strokeStyle = this.kolor(nr);
    ctx.lineWidth = opcje.grubosc || (opcje.przerywana ? 1.5 : 2.5);
    ctx.setLineDash(opcje.przerywana ? [6, 5] : []);
  }

  // ---------- rysowanie ----------
  // opcje: { przerywana, grubosc, od, do }  (od/do — dziedzina rysowania)
  funkcja(f, nr = 1, opcje = {}) {
    if (typeof opcje === "boolean") opcje = { przerywana: opcje };
    const { ctx } = this;
    this._linia(nr, opcje);
    const a = Math.max(opcje.od ?? -Infinity, this.z.xmin), b = Math.min(opcje.do ?? Infinity, this.z.xmax);
    const zakresY = (this.z.ymax - this.z.ymin) * 4;
    ctx.beginPath();
    let start = true, poprz = null;
    const kroki = Math.ceil((this.sx(b) - this.sx(a)) * 2);
    for (let i = 0; i <= kroki; i++) {
      const x = a + (b - a) * i / kroki, y = f(x);
      // przerwa przy asymptocie pionowej lub poza dziedziną
      if (!isFinite(y) || (poprz !== null && Math.abs(y - poprz) > zakresY)) { start = true; poprz = isFinite(y) ? y : null; continue; }
      const py = Math.max(-1e4, Math.min(1e4, this.sy(y)));
      start ? ctx.moveTo(this.sx(x), py) : ctx.lineTo(this.sx(x), py);
      start = false; poprz = y;
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  // Krzywa (x(t), y(t)) dla t ∈ [t0, t1]
  parametryczna(fx, fy, t0, t1, nr = 1, opcje = {}) {
    const { ctx } = this;
    this._linia(nr, opcje);
    ctx.beginPath();
    const n = opcje.kroki || 400;
    for (let i = 0; i <= n; i++) {
      const t = t0 + (t1 - t0) * i / n;
      i ? ctx.lineTo(this.sx(fx(t)), this.sy(fy(t))) : ctx.moveTo(this.sx(fx(t)), this.sy(fy(t)));
    }
    ctx.stroke(); ctx.setLineDash([]);
  }

  odcinek(x1, y1, x2, y2, nr = 1, przerywana = true) {
    const { ctx } = this;
    this._linia(nr, { przerywana, grubosc: przerywana ? 1.5 : 2.5 });
    ctx.beginPath(); ctx.moveTo(this.sx(x1), this.sy(y1)); ctx.lineTo(this.sx(x2), this.sy(y2)); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Prosta przez dwa punkty, rysowana przez cały widok
  prosta(x1, y1, x2, y2, nr = 1, przerywana = false) {
    const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(this.z.xmax - this.z.xmin, this.z.ymax - this.z.ymin) * 2 / Math.hypot(dx, dy);
    this.odcinek(x1 - dx * L, y1 - dy * L, x1 + dx * L, y1 + dy * L, nr, przerywana);
  }

  strzalka(x1, y1, x2, y2, nr = 1, etykieta = "") {
    const { ctx } = this;
    const X1 = this.sx(x1), Y1 = this.sy(y1), X2 = this.sx(x2), Y2 = this.sy(y2);
    const kat = Math.atan2(Y2 - Y1, X2 - X1), d = Math.hypot(X2 - X1, Y2 - Y1), g = Math.min(11, d / 2);
    this._linia(nr, { grubosc: 2.5 });
    ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2 - g * 0.8 * Math.cos(kat), Y2 - g * 0.8 * Math.sin(kat)); ctx.stroke();
    ctx.fillStyle = this.kolor(nr); ctx.beginPath();
    ctx.moveTo(X2, Y2);
    ctx.lineTo(X2 - g * Math.cos(kat - 0.4), Y2 - g * Math.sin(kat - 0.4));
    ctx.lineTo(X2 - g * Math.cos(kat + 0.4), Y2 - g * Math.sin(kat + 0.4));
    ctx.fill();
    if (etykieta) this.tekst((x1 + x2) / 2, (y1 + y2) / 2, etykieta, nr, { dx: 6, dy: -6 });
  }

  // opcje: { pusty: true } — kółko niewypełnione (np. koniec przedziału otwartego)
  punkt(x, y, etykieta = "", nr = 2, opcje = {}) {
    const { ctx } = this;
    ctx.fillStyle = this.kolor(nr); ctx.strokeStyle = this.kolor(nr); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(this.sx(x), this.sy(y), opcje.r || 5, 0, 2 * Math.PI);
    if (opcje.pusty) { ctx.fillStyle = this.kolor("--surface"); ctx.fill(); ctx.stroke(); } else ctx.fill();
    if (etykieta) this.tekst(x, y, etykieta, nr, { dx: 8, dy: -8, gruby: true });
  }

  // opcje: { dx, dy (px), wyrownanie: "left"|"center"|"right", rozmiar, gruby }
  tekst(x, y, s, nr = 1, opcje = {}) {
    const { ctx } = this;
    ctx.fillStyle = this.kolor(nr);
    ctx.font = `${opcje.gruby ? "600 " : ""}${opcje.rozmiar || 13}px Segoe UI, sans-serif`;
    ctx.textAlign = opcje.wyrownanie || "left";
    ctx.fillText(s, this.sx(x) + (opcje.dx || 0), this.sy(y) + (opcje.dy || 0));
    ctx.textAlign = "left";
  }

  // opcje: { wypelnij: 0..1 (krycie), przerywana }
  okrag(x, y, r, nr = 1, opcje = {}) {
    const { ctx } = this;
    ctx.beginPath();
    ctx.ellipse(this.sx(x), this.sy(y), Math.abs(this.sx(x + r) - this.sx(x)), Math.abs(this.sy(y + r) - this.sy(y)), 0, 0, 2 * Math.PI);
    if (opcje.wypelnij) { ctx.fillStyle = this.kolorA(nr, opcje.wypelnij); ctx.fill(); }
    this._linia(nr, opcje); ctx.stroke(); ctx.setLineDash([]);
  }

  // Łuk kąta o środku (x,y), promieniu r (w jednostkach), od kąta a1 do a2 (radiany, przeciwnie do zegara)
  luk(x, y, r, a1, a2, nr = 1, opcje = {}) {
    this.parametryczna(t => x + r * Math.cos(t), t => y + r * Math.sin(t), a1, a2, nr, { grubosc: 2, ...opcje });
    if (opcje.wypelnij) {
      const { ctx } = this;
      ctx.beginPath(); ctx.moveTo(this.sx(x), this.sy(y));
      for (let i = 0; i <= 60; i++) { const t = a1 + (a2 - a1) * i / 60; ctx.lineTo(this.sx(x + r * Math.cos(t)), this.sy(y + r * Math.sin(t))); }
      ctx.closePath(); ctx.fillStyle = this.kolorA(nr, opcje.wypelnij); ctx.fill();
    }
  }

  // punkty: [[x,y], ...]; opcje: { wypelnij: krycie, zamknij = true, przerywana, bezObrysu }
  wielokat(punkty, nr = 1, opcje = {}) {
    const { ctx } = this;
    ctx.beginPath();
    punkty.forEach(([x, y], i) => i ? ctx.lineTo(this.sx(x), this.sy(y)) : ctx.moveTo(this.sx(x), this.sy(y)));
    if (opcje.zamknij !== false) ctx.closePath();
    if (opcje.wypelnij) { ctx.fillStyle = this.kolorA(nr, opcje.wypelnij); ctx.fill(); }
    if (!opcje.bezObrysu) { this._linia(nr, { grubosc: 2, ...opcje }); ctx.stroke(); ctx.setLineDash([]); }
  }

  prostokat(x, y, szer, wys, nr = 1, opcje = {}) {
    this.wielokat([[x, y], [x + szer, y], [x + szer, y + wys], [x, y + wys]], nr, { wypelnij: 0.35, ...opcje });
  }

  // Wypełnia obszar między f i g na [a, b] (g domyślnie 0 → pole pod wykresem)
  obszar(f, g = () => 0, a, b, nr = 1, krycie = 0.25) {
    const n = 200, pts = [];
    for (let i = 0; i <= n; i++) { const x = a + (b - a) * i / n; pts.push([x, f(x)]); }
    for (let i = n; i >= 0; i--) { const x = a + (b - a) * i / n; pts.push([x, g(x)]); }
    this.wielokat(pts, nr, { wypelnij: krycie, bezObrysu: true });
  }

  // ---------- interakcja ----------
  // Przeciąganie punktów myszą/palcem. punkty: [{ x, y, ogranicz?: p => ({x,y}) }]
  // Po każdym ruchu wywołuje zmiana(punkty). Zwraca tablicę punktów.
  przeciagaj(punkty, zmiana) {
    let akt = null;
    const poz = e => { const r = this.c.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    this.c.style.touchAction = "none";
    this.c.addEventListener("pointerdown", e => {
      const [px, py] = poz(e);
      let min = 18;
      punkty.forEach(p => { const d = Math.hypot(this.sx(p.x) - px, this.sy(p.y) - py); if (d < min) { min = d; akt = p; } });
      if (akt) this.c.setPointerCapture(e.pointerId);
    });
    this.c.addEventListener("pointermove", e => {
      const [px, py] = poz(e);
      if (!akt) {
        this.c.style.cursor = punkty.some(p => Math.hypot(this.sx(p.x) - px, this.sy(p.y) - py) < 18) ? "grab" : "default";
        return;
      }
      let nowy = { x: this.wx(px), y: this.wy(py) };
      if (akt.siatka) nowy = { x: Math.round(nowy.x / akt.siatka) * akt.siatka, y: Math.round(nowy.y / akt.siatka) * akt.siatka };
      if (akt.ogranicz) nowy = akt.ogranicz(nowy);
      akt.x = nowy.x; akt.y = nowy.y;
      zmiana(punkty);
    });
    const koniec = () => { akt = null; };
    this.c.addEventListener("pointerup", koniec);
    this.c.addEventListener("pointercancel", koniec);
    return punkty;
  }

  // Podpis osi w wielokrotnościach π (do formatX): Wykres.pi(Math.PI/2) → "π/2"
  static pi(v) {
    const k = Math.round(v / (Math.PI / 12));
    if (k === 0) return "0";
    const g = (a, b) => b ? g(b, a % b) : Math.abs(a);
    const d = g(k, 12), l = k / d, m = 12 / d;
    const L = l === 1 ? "" : l === -1 ? "−" : String(l).replace("-", "−");
    return m === 1 ? `${L}π` : `${L}π/${m}`;
  }
}

// Animacja parametru t: 0 → 1 w `ms` milisekund, z wygładzeniem. Zwraca funkcję zatrzymującą.
function animuj(ms, krok, koniec) {
  const t0 = performance.now();
  let stop = false;
  const ease = t => t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
  (function klatka(teraz) {
    if (stop) return;
    const t = Math.min(1, (teraz - t0) / ms);
    krok(ease(t));
    t < 1 ? requestAnimationFrame(klatka) : koniec && koniec();
  })(t0);
  return () => { stop = true; };
}

// Ciągła animacja: krok(sekundy od startu). Zwraca { stop(), dziala }.
function petla(krok) {
  const s = { dziala: true, stop() { this.dziala = false; } };
  const t0 = performance.now();
  (function klatka(teraz) { if (!s.dziala) return; krok((teraz - t0) / 1000); requestAnimationFrame(klatka); })(t0);
  return s;
}

// Liczba w ładnym zapisie (bez -0, max 2 miejsca po przecinku, przecinek dziesiętny, minus „−”)
function ladna(x, miejsca = 2) {
  const p = 10 ** miejsca, r = Math.round(x * p) / p;
  const t = (Object.is(r, -0) ? 0 : r).toString().replace("-", "−");
  return document.documentElement.lang === "en" ? t : t.replace(".", ","); // po angielsku kropka dziesiętna
}
// To samo do wstawiania w KaTeX ({,} = przecinek dziesiętny bez odstępu, zwykły minus)
function ladnaTex(x, miejsca = 2) { return ladna(x, miejsca).replace(",", "{,}").replace("−", "-"); }
// Liczba ze znakiem do wzorów: znak(3) → "+3", znak(-2) → "-2"
function znakTex(x, miejsca = 2) { return (x >= 0 ? "+" : "") + ladnaTex(x, miejsca); }

// --- Pomocniki wspólne dla stron (wcześniej kopiowane w każdym pliku) ---
const $ = id => document.getElementById(id);
const odl = (P, Q) => Math.hypot(Q.x - P.x, Q.y - P.y);
// Kąt przy wierzchołku P między PQ i PR (radiany)
const kat = (P, Q, R) => {
  const ux = Q.x - P.x, uy = Q.y - P.y, vx = R.x - P.x, vy = R.y - P.y;
  return Math.acos(Math.max(-1, Math.min(1, (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy) || 1))));
};
// Etykieta punktu P odsunięta od środka figury S
const etykieta = (g, P, S, s, nr = 1) => {
  const d = odl(P, S) || 1;
  g.tekst(P.x, P.y, s, nr, { dx: (P.x - S.x) / d * 15, dy: -(P.y - S.y) / d * 15 + 5, wyrownanie: "center", gruby: true });
};
// Znacznik kąta prostego w P (ramiona do Q i R, bok s)
const katProsty = (g, P, Q, R, s, nr) => {
  const dq = odl(P, Q) || 1, dr = odl(P, R) || 1;
  const ux = (Q.x - P.x) / dq * s, uy = (Q.y - P.y) / dq * s, vx = (R.x - P.x) / dr * s, vy = (R.y - P.y) / dr * s;
  g.wielokat([[P.x + ux, P.y + uy], [P.x + ux + vx, P.y + uy + vy], [P.x + vx, P.y + vy]], nr, { zamknij: false, grubosc: 1.5 });
};
// Liczba jako ułamek zwykły w TeX (mianownik ≤ 12), gdy nie jest „ładnym” dziesiętnym
function ulamekTex(x) {
  if (!isFinite(x)) return x > 0 ? "+\\infty" : "-\\infty";
  if (Math.abs(x * 100 - Math.round(x * 100)) < 1e-7) return ladnaTex(x); // np. 2,5 zamiast 5/2
  for (let q = 1; q <= 12; q++) {
    const p = Math.round(x * q);
    if (Math.abs(x * q - p) < 1e-7) return q === 1 ? String(p) : (p < 0 ? "-" : "") + `\\frac{${Math.abs(p)}}{${q}}`;
  }
  return ladnaTex(x);
}
