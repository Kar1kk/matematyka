// Mały silnik 3D na <canvas> (bez bibliotek) do demo ze stereometrii.
// Dołączanie: <script defer src="../assets/bryly3d.js"></script>  (po wykres.js, przed site.js)
//
// Układ: punkty to tablice [x, y, z], oś z w GÓRĘ. Obrót przeciąganiem myszą/palcem.
//   const s = new Scena3D(canvas, {
//     zakres: 3,            // promień sceny (w jednostkach), który mieści się w canvasie
//     kat: [-0.35, 0.4],     // [azymut, elewacja] w radianach (obrót wokół z, pochylenie)
//     srodek: [0, 0, 0],    // punkt sceny w środku canvasu
//     perspektywa: 0,       // 0 = rzut równoległy; np. 12 = odległość kamery (w jednostkach)
//     obrot: true,          // obracanie przeciąganiem
//     auto: 0 });           // samoczynny obrót (rad/s), zatrzymuje się po dotknięciu
//   s.rysuj(g => { ... });  // cała klatka; wywoływana ponownie po obrocie, resize, zmianie motywu
//
// W funkcji rysującej (g === s); nr koloru 1..4 → --plot-1..4 (jak w wykres.js):
//   g.odcinek(p1, p2, nr, { przerywana, grubosc })       // UWAGA: domyślnie ciągły
//   g.prosta(p1, p2, nr, { przerywana, dl: 6 })            // prosta przez p1,p2 (odcinek wydłużony)
//   g.strzalka(p1, p2, nr, etykieta)
//   g.punkt(p, "A", nr = 2, { r })                         // kropka z etykietą
//   g.tekst(p, "napis", nr, { dx, dy, rozmiar, gruby, wyrownanie })
//   g.wielokat([p, ...], nr, { wypelnij: 0.2, przerywana, bezObrysu, zamknij })
//   g.krzywa([p, ...], nr, opcje)                          // łamana (zamknij: false)
//   g.okrag(srodek, normalna, r, nr, { wypelnij, przerywana, od, do })  // okrąg/łuk w płaszczyźnie ⟂ normalna
//   g.kula(srodek, r, nr, { wypelnij })                    // kontur kuli
//   g.kat(W, A, B, r, nr, { prosty, wypelnij })           // znacznik kąta AWB (łuk lub kwadracik)
//   g.bryla(wierzcholki, sciany, nr, { wypelnij, ukryte: true })
//        // wielościan WYPUKŁY: sciany = [[i, j, k, ...], ...]; krawędzie niewidoczne rysuje przerywane
//   g.zwrocona([p, ...], wnetrze)  // czy ściana (o punkcie wewnętrznym bryły `wnetrze`) jest widoczna
//   g.rzut(p) → [px, py, glebokosc]                        // piksele na canvasie
//   g.punktOkregu(srodek, normalna, r, t) → [x, y, z]
// Sterowanie: s.ustawKat(az, el), s.az, s.el, s.zakres(n) (zmiana skali), s.odswiez()
// Wektory: V3.dod(a,b), V3.odj(a,b), V3.razy(a,k), V3.il(a,b) (skalarny), V3.wek(a,b) (wektorowy),
//   V3.dl(a), V3.norm(a), V3.lerp(a,b,t), V3.sr(...punkty) (środek ciężkości)

const V3 = {
  dod: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]],
  odj: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]],
  razy: (a, k) => [a[0] * k, a[1] * k, a[2] * k],
  il: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2],
  wek: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  dl: a => Math.hypot(a[0], a[1], a[2]),
  norm: a => { const d = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / d, a[1] / d, a[2] / d]; },
  lerp: (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t],
  sr: (...p) => V3.razy(p.reduce((s, q) => V3.dod(s, q), [0, 0, 0]), 1 / p.length),
};

class Scena3D {
  constructor(canvas, opcje = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext("2d");
    this.o = Object.assign({ zakres: 3, kat: [-0.35, 0.4], srodek: [0, 0, 0], perspektywa: 0, obrot: true, auto: 0 }, opcje);
    this.az = this.o.kat[0]; this.el = this.o.kat[1];
    this.w = 0; this.h = 0; this._fn = null;
    if (typeof ResizeObserver !== "undefined") new ResizeObserver(() => this.odswiez()).observe(canvas);
    document.addEventListener("zmiana-motywu", () => this.odswiez());
    if (typeof matchMedia !== "undefined") matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => this.odswiez());
    if (this.o.obrot) this._myszka();
    if (this.o.auto) this._autoObrot();
  }

  // ---------- kamera ----------
  ustawKat(az, el) { this.az = az; this.el = Math.max(-1.45, Math.min(1.45, el)); this.odswiez(); }
  zakres(n) { this.o.zakres = n; this.odswiez(); }
  get jednostka() { return Math.min(this.w, this.h) / (2 * this.o.zakres); }

  // współrzędne kamery: X w prawo, Y w górę, D do widza
  _kam(p) {
    const s = this.o.srodek, x = p[0] - s[0], y = p[1] - s[1], z = p[2] - s[2];
    const ca = Math.cos(this.az), sa = Math.sin(this.az), ce = Math.cos(this.el), se = Math.sin(this.el);
    const X = x * ca - y * sa, Yp = x * sa + y * ca;
    return [X, z * ce + Yp * se, -Yp * ce + z * se];
  }
  rzut(p) {
    const [X, Y, D] = this._kam(p), u = this.jednostka, P = this.o.perspektywa;
    const f = P ? P / Math.max(P - D, P * 0.1) : 1;
    return [this.w / 2 + X * u * f, this.h / 2 - Y * u * f, D];
  }

  // ---------- kolory (jak wykres.js) ----------
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

  // ---------- klatka ----------
  rysuj(fn) { this._fn = fn; this.odswiez(); }
  odswiez() {
    const dpr = window.devicePixelRatio || 1;
    const r = this.c.getBoundingClientRect();
    if (!r.width) return;
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.ctx.clearRect(0, 0, this.w, this.h);
    if (this._fn) this._fn(this);
  }

  _linia(nr, o = {}) {
    const { ctx } = this;
    ctx.strokeStyle = this.kolor(nr);
    ctx.lineWidth = o.grubosc || (o.przerywana ? 1.5 : 2.5);
    ctx.setLineDash(o.przerywana ? [6, 5] : []);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
  }
  _sciezka(pts, zamknij) {
    const { ctx } = this;
    ctx.beginPath();
    pts.forEach((p, i) => { const [x, y] = this.rzut(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    if (zamknij) ctx.closePath();
  }

  // ---------- rysowanie ----------
  odcinek(p1, p2, nr = 1, o = {}) {
    if (typeof o === "boolean") o = { przerywana: o };
    this._linia(nr, o); this._sciezka([p1, p2], false); this.ctx.stroke(); this.ctx.setLineDash([]);
  }
  prosta(p1, p2, nr = 1, o = {}) {
    const d = V3.razy(V3.norm(V3.odj(p2, p1)), o.dl || this.o.zakres * 2);
    this.odcinek(V3.odj(p1, d), V3.dod(p1, d), nr, o);
  }
  strzalka(p1, p2, nr = 1, etykieta = "") {
    const { ctx } = this;
    const [X1, Y1] = this.rzut(p1), [X2, Y2] = this.rzut(p2);
    const kat = Math.atan2(Y2 - Y1, X2 - X1), g = Math.min(11, Math.hypot(X2 - X1, Y2 - Y1) / 2);
    this._linia(nr);
    ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2 - g * 0.8 * Math.cos(kat), Y2 - g * 0.8 * Math.sin(kat)); ctx.stroke();
    ctx.fillStyle = this.kolor(nr); ctx.beginPath(); ctx.moveTo(X2, Y2);
    ctx.lineTo(X2 - g * Math.cos(kat - 0.4), Y2 - g * Math.sin(kat - 0.4));
    ctx.lineTo(X2 - g * Math.cos(kat + 0.4), Y2 - g * Math.sin(kat + 0.4)); ctx.fill();
    if (etykieta) this.tekst(V3.lerp(p1, p2, 0.5), etykieta, nr, { dx: 6, dy: -6 });
  }
  punkt(p, etykieta = "", nr = 2, o = {}) {
    const { ctx } = this, [x, y] = this.rzut(p);
    ctx.fillStyle = this.kolor(nr);
    ctx.beginPath(); ctx.arc(x, y, o.r || 4, 0, 2 * Math.PI); ctx.fill();
    if (etykieta) this.tekst(p, etykieta, nr, { dx: o.dx ?? 7, dy: o.dy ?? -7, gruby: true });
  }
  tekst(p, s, nr = 1, o = {}) {
    const { ctx } = this, [x, y] = this.rzut(p);
    ctx.fillStyle = this.kolor(typeof nr === "number" || String(nr).startsWith("--") ? nr : 1);
    ctx.font = `${o.gruby ? "600 " : ""}${o.rozmiar || 13}px Segoe UI, sans-serif`;
    ctx.textAlign = o.wyrownanie || "left";
    ctx.fillText(s, x + (o.dx || 0), y + (o.dy || 0));
    ctx.textAlign = "left";
  }
  wielokat(pts, nr = 1, o = {}) {
    if (pts.length < 2) return;
    const { ctx } = this;
    this._sciezka(pts, o.zamknij !== false);
    if (o.wypelnij) { ctx.fillStyle = this.kolorA(nr, o.wypelnij); ctx.fill(); }
    if (!o.bezObrysu) { this._linia(nr, { grubosc: 2, ...o }); ctx.stroke(); ctx.setLineDash([]); }
  }
  krzywa(pts, nr = 1, o = {}) { this.wielokat(pts, nr, { zamknij: false, ...o }); }

  punktOkregu(s, n, r, t) {
    const nn = V3.norm(n);
    const pom = Math.abs(nn[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
    const u = V3.norm(V3.wek(nn, pom)), v = V3.wek(nn, u);
    return V3.dod(s, V3.dod(V3.razy(u, r * Math.cos(t)), V3.razy(v, r * Math.sin(t))));
  }
  okrag(s, n, r, nr = 1, o = {}) {
    const od = o.od ?? 0, d = o.do ?? 2 * Math.PI, k = 72, pts = [];
    for (let i = 0; i <= k; i++) pts.push(this.punktOkregu(s, n, r, od + (d - od) * i / k));
    this.wielokat(pts, nr, { zamknij: o.od === undefined && o.do === undefined, ...o });
  }
  kula(s, r, nr = 1, o = {}) {
    const { ctx } = this, [x, y, D] = this.rzut(s), P = this.o.perspektywa;
    const f = P ? P / Math.max(P - D, P * 0.1) : 1;
    ctx.beginPath(); ctx.arc(x, y, Math.abs(r) * this.jednostka * f, 0, 2 * Math.PI);
    if (o.wypelnij) { ctx.fillStyle = this.kolorA(nr, o.wypelnij); ctx.fill(); }
    this._linia(nr, { grubosc: 2, ...o }); ctx.stroke(); ctx.setLineDash([]);
  }
  // znacznik kąta AWB: łuk o promieniu r (jednostki) albo kwadracik dla kąta prostego
  kat(W, A, B, r = 0.4, nr = 2, o = {}) {
    const a = V3.norm(V3.odj(A, W)), b0 = V3.odj(B, W);
    const cos = Math.max(-1, Math.min(1, V3.il(a, V3.norm(b0))));
    if (o.prosty) {
      const b = V3.norm(b0), q = r * 0.7;
      this.wielokat([V3.dod(W, V3.razy(a, q)), V3.dod(W, V3.dod(V3.razy(a, q), V3.razy(b, q))), V3.dod(W, V3.razy(b, q))],
        nr, { zamknij: false, grubosc: 1.5, ...o });
      return;
    }
    const kt = Math.acos(cos), pr = V3.odj(b0, V3.razy(a, V3.il(b0, a)));
    if (V3.dl(pr) < 1e-9) return;
    const v = V3.norm(pr), pts = [];
    for (let i = 0; i <= 30; i++) { const t = kt * i / 30; pts.push(V3.dod(W, V3.dod(V3.razy(a, r * Math.cos(t)), V3.razy(v, r * Math.sin(t))))); }
    if (o.wypelnij) this.wielokat([W, ...pts], nr, { wypelnij: o.wypelnij, bezObrysu: true });
    this.wielokat(pts, nr, { zamknij: false, grubosc: 1.8, ...o, wypelnij: 0 });
  }

  // czy ściana (wielokąt płaski) jest zwrócona do widza; wnetrze — dowolny punkt wewnątrz bryły
  zwrocona(pts, wnetrze) {
    const k = pts.map(p => this._kam(p)), sr = V3.sr(...k);
    let n = V3.wek(V3.odj(k[1], k[0]), V3.odj(k[2], k[0]));
    if (V3.dl(n) < 1e-12 && k.length > 3) n = V3.wek(V3.odj(k[2], k[0]), V3.odj(k[3], k[0]));
    if (V3.il(n, V3.odj(sr, this._kam(wnetrze))) < 0) n = V3.razy(n, -1);
    const P = this.o.perspektywa, do_widza = P ? V3.odj([0, 0, P], sr) : [0, 0, 1];
    return V3.il(n, do_widza) > 1e-9;
  }
  bryla(W, sciany, nr = 1, o = {}) {
    const wn = V3.sr(...W), wid = sciany.map(s => this.zwrocona(s.map(i => W[i]), wn));
    if (o.wypelnij) sciany.forEach((s, j) => { if (wid[j]) this.wielokat(s.map(i => W[i]), nr, { wypelnij: o.wypelnij, bezObrysu: true }); });
    const kr = new Map();
    sciany.forEach((s, j) => s.forEach((a, i) => {
      const b = s[(i + 1) % s.length], kl = a < b ? a + "," + b : b + "," + a;
      kr.set(kl, (kr.get(kl) || false) || wid[j]);
    }));
    kr.forEach((v, kl) => {
      const [a, b] = kl.split(",").map(Number);
      if (v) this.odcinek(W[a], W[b], nr, { grubosc: o.grubosc });
      else if (o.ukryte !== false) this.odcinek(W[a], W[b], nr, { przerywana: true });
    });
  }

  // ---------- interakcja ----------
  _myszka() {
    let start = null;
    this.c.style.touchAction = "none";
    this.c.style.cursor = "grab";
    this.c.addEventListener("pointerdown", e => {
      this._stopAuto = true;
      start = [e.clientX, e.clientY, this.az, this.el];
      this.c.setPointerCapture(e.pointerId); this.c.style.cursor = "grabbing";
    });
    this.c.addEventListener("pointermove", e => {
      if (!start) return;
      this.ustawKat(start[2] + (e.clientX - start[0]) * 0.01, start[3] + (e.clientY - start[1]) * 0.01);
    });
    const koniec = () => { start = null; this.c.style.cursor = "grab"; };
    this.c.addEventListener("pointerup", koniec);
    this.c.addEventListener("pointercancel", koniec);
  }
  _autoObrot() {
    let t0 = null;
    const krok = t => {
      if (this._stopAuto) return;
      if (t0 !== null) { this.az += this.o.auto * (t - t0) / 1000; this.odswiez(); }
      t0 = t; requestAnimationFrame(krok);
    };
    requestAnimationFrame(krok);
  }
}
