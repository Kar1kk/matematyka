// Wspólne zachowania strony: motyw, wzory KaTeX, nawigacja, postęp, listy z dzialy.js.

(function motyw() {
  try {
    const t = localStorage.getItem("motyw");
    if (t) document.documentElement.dataset.theme = t;
  } catch (e) {}
})();

// PWA: manifest, ikona i service worker (katalog główny strony = katalog nad assets/)
(function pwa() {
  const skrypt = document.currentScript;
  if (!skrypt) return;
  const korzen = new URL("../", skrypt.src);
  const dodaj = (tag, atr) => { const el = document.createElement(tag); Object.assign(el, atr); document.head.appendChild(el); };
  dodaj("link", { rel: "manifest", href: new URL("manifest.webmanifest", korzen).href });
  dodaj("link", { rel: "apple-touch-icon", href: new URL("assets/ikony/apple-touch-icon.png", korzen).href });
  dodaj("link", { rel: "icon", type: "image/png", href: new URL("assets/ikony/ikona-192.png", korzen).href });
  dodaj("meta", { name: "theme-color", content: "#2f5bd3" });
  if ("serviceWorker" in navigator && location.protocol !== "file:")
    addEventListener("load", () => navigator.serviceWorker.register(new URL("sw.js", korzen).href).catch(() => {}));
})();

// Makra KaTeX: polskie oznaczenia
const TEX_MAKRA = {
  "\\tg": "\\operatorname{tg}", "\\ctg": "\\operatorname{ctg}",
  "\\R": "\\mathbb{R}", "\\N": "\\mathbb{N}", "\\Z": "\\mathbb{Z}", "\\Q": "\\mathbb{Q}",
  "\\lp": "\\langle", "\\rp": "\\rangle", // przedziały domknięte: \lp 1, 3 \rp
};

// Wstawia wzór do elementu (do dynamicznych wyników w demo)
function tex(el, s, blok = false) {
  if (typeof el === "string") el = document.getElementById(el);
  katex.render(s, el, { throwOnError: false, displayMode: blok, macros: TEX_MAKRA });
  dopasujSzerokie(el);
}

// Wzór w tekście szerszy niż jego kontener (telefon) dostaje własne przewijanie,
// zamiast rozpychać całą stronę.
function dopasujSzerokie(korzen = document) {
  korzen.querySelectorAll(".katex").forEach(k => {
    if (k.closest(".katex-display")) return;
    k.classList.remove("szeroki");
    const rodzic = k.parentElement;
    if (rodzic && k.getBoundingClientRect().width > rodzic.getBoundingClientRect().width + 1) k.classList.add("szeroki");
  });
}
let _szerTimer;
window.addEventListener("resize", () => { clearTimeout(_szerTimer); _szerTimer = setTimeout(() => dopasujSzerokie(), 200); });

const pamiec = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  // zwraca false, gdy zapis się nie udał (np. brak miejsca w pamięci przeglądarki)
  set(k, v) { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); return true; } catch (e) { return false; } },
};

// Tematy bez odsyłaczy (ten sam plik w drugim dziale liczy się raz)
function wszystkieTematy() {
  if (typeof DZIALY_MATURA === "undefined") return [];
  return DZIALY_MATURA.flatMap(d => d.tematy.filter(t => !t.odsylacz).map(t => ({ ...t, dzial: d })));
}
const opanowany = plik => !!pamiec.get("opanowane:" + plik);

// --- Powtórki rozłożone w czasie ---
// powtorka:<plik> = {"etap": n, "termin": "RRRR-MM-DD"}; po oznaczeniu jako opanowane
// temat wraca po 1, 3, 7, 21, potem co 60 dni. „Nie pamiętam” cofa do etapu 0.
const ODSTEPY = [1, 3, 7, 21, 60];
const dzis = () => new Date().toLocaleDateString("sv"); // RRRR-MM-DD w czasie lokalnym
const zaDni = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString("sv"); };
function stanPowtorki(plik) {
  try { return JSON.parse(pamiec.get("powtorka:" + plik)) || null; } catch (e) { return null; }
}
function ustawPowtorke(plik, etap) {
  etap = Math.min(etap, ODSTEPY.length - 1);
  pamiec.set("powtorka:" + plik, JSON.stringify({ etap, termin: zaDni(ODSTEPY[etap]) }));
}
// Opanowany temat bez zapisanego terminu (stary postęp) jest do powtórki od razu
const doPowtorki = plik => opanowany(plik) && (stanPowtorki(plik)?.termin || "") <= dzis();

// --- Eksport / import postępu (plik JSON) ---
const KLUCZE_POSTEPU = /^(opanowane:|powtorka:|zadanie:|brudnopis:|ostatni$)/;
function eksportujPostep() {
  const dane = {};
  try { for (let k = 0; k < localStorage.length; k++) { const n = localStorage.key(k); if (KLUCZE_POSTEPU.test(n)) dane[n] = localStorage.getItem(n); } } catch (e) {}
  const plik = new Blob([JSON.stringify({ wersja: 1, data: dzis(), dane }, null, 1)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(plik); a.download = `postep-matematyka-${dzis()}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
// Łączy z obecnym postępem: opanowane sumują się, przy powtórkach wygrywa wyższy etap
function importujPostep(tekst) {
  const { dane } = JSON.parse(tekst);
  if (!dane || typeof dane !== "object") throw new Error("To nie jest plik postępu.");
  let n = 0;
  for (const [k, v] of Object.entries(dane)) {
    if (!KLUCZE_POSTEPU.test(k) || typeof v !== "string") continue;
    if (k.startsWith("powtorka:")) {
      const stary = stanPowtorki(k.slice(9));
      try { if (stary && stary.etap >= JSON.parse(v).etap) continue; } catch (e) { continue; }
    }
    if (k === "ostatni" && pamiec.get(k)) continue;
    pamiec.set(k, v); n++;
  }
  return n;
}

// Propozycje na stronę główną: ostatni temat, następny do nauki, losowa powtórka
function propozycje() {
  const tematy = wszystkieTematy().filter(t => t.plik);
  const po = p => tematy.find(t => t.plik === p);
  const ostatni = po(pamiec.get("ostatni"));
  // Następny nieopanowany temat po ostatnio otwartym (w kolejności nauki); jeśli ma nieopanowane
  // wymagania, proponujemy najpierw je (rekurencyjnie, od najgłębszego braku).
  const najpierw = t => {
    const byly = new Set();
    while (t && !byly.has(t)) {
      byly.add(t);
      const brak = (t.wymaga || []).map(po).find(x => x && !opanowany(x.plik));
      if (!brak) return t;
      t = brak;
    }
    return t;
  };
  const start = ostatni ? tematy.indexOf(ostatni) : 0;
  const kolejka = tematy.slice(start).concat(tematy.slice(0, start)).filter(t => t !== ostatni && !opanowany(t.plik));
  let nastepny;
  for (const t of kolejka) { const n = najpierw(t); if (n && n !== ostatni) { nastepny = n; break; } }
  const opan = tematy.filter(t => opanowany(t.plik));
  const powtorki = opan.filter(t => doPowtorki(t.plik));
  return { ostatni, nastepny, powtorki, opan: opan.length, razem: tematy.length };
}

function panelKontynuuj(el, prefiks) {
  const { ostatni, nastepny, powtorki, opan, razem } = propozycje();
  const link = (t, opis) => t ? `<a class="karta" href="${prefiks}${t.plik}"><span class="znacznik">${opis}</span>
    <h3>${t.nazwa}</h3><p>${t.dzial.nr}. ${t.dzial.nazwa}</p></a>` : "";
  const naglowek = document.getElementById("podsumowanie") ? "" : `<div class="kontynuuj-naglowek"><b>Twoja nauka</b> · opanowane ${opan} z ${razem}
      <div class="pasek"><div style="width:${100 * opan / razem}%"></div></div></div>`;
  const lista = powtorki.length ? `<div class="powtorki"><b>Do powtórki dziś (${powtorki.length}):</b>
      ${powtorki.map(t => `<a href="${prefiks}${t.plik}">${t.nazwa}</a>`).join(" · ")}</div>`
    : opan ? `<div class="powtorki">Na dziś nic do powtórki ✓</div>` : "";
  el.innerHTML = naglowek + lista + `<div class="siatka">${link(ostatni, "ostatnio otwarty")}${link(nastepny, ostatni ? "proponowany następny" : "zacznij tutaj")}${link(powtorki[0], "powtórka")}</div>
    <div class="postep-plik"><button type="button" data-akcja="eksport">Zapisz postęp do pliku</button>
      <label><input type="file" accept=".json,application/json" hidden>Wczytaj postęp z pliku</label>
      <span class="info"></span></div>`;
  const info = el.querySelector(".info");
  el.querySelector("[data-akcja=eksport]").onclick = eksportujPostep;
  el.querySelector("input[type=file]").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { const n = importujPostep(t); info.textContent = `Wczytano ${n} wpisów — odświeżam…`; setTimeout(() => location.reload(), 800); })
      .catch(err => { info.textContent = "Błąd: " + (err.message || "zły plik"); });
  };
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("motyw");
  if (btn) btn.addEventListener("click", () => {
    const teraz = document.documentElement.dataset.theme
      || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const nowy = teraz === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nowy;
    pamiec.set("motyw", nowy);
    document.dispatchEvent(new Event("zmiana-motywu"));
  });

  // Spis treści z nagłówków h2[id] (każda strona z .spis[data-auto])
  const spis = document.querySelector(".spis[data-auto]");
  if (spis) {
    const h2 = [...document.querySelectorAll("main h2[id]")];
    spis.innerHTML = `<b>Na tej stronie</b><ol>${h2.map(h => `<li><a href="#${h.id}">${h.textContent.replace(/^\d+\.\s*/, "")}</a></li>`).join("")}</ol>`;
  }

  // --- Strona tematu: okruszki, sąsiedzi, opanowane ---
  let plik = decodeURIComponent(location.pathname.split("/").pop());
  if (plik && !plik.includes(".")) plik += ".html"; // GitHub Pages podaje też adresy bez .html
  const tematy = wszystkieTematy();
  const i = tematy.findIndex(t => t.plik === plik);
  if (i >= 0) {
    const t = tematy[i];
    const nav = document.querySelector("header.top nav");
    if (nav) nav.innerHTML = `› <a href="index.html">Matura rozszerzona</a> › ${t.dzial.nr}. ${t.dzial.nazwa}`;
    const main = document.querySelector("main");
    pamiec.set("ostatni", plik);

    // Zanim zaczniesz: tematy wymagane wcześniej
    if (t.wymaga && t.wymaga.length) {
      const nazwa = p => (tematy.find(x => x.plik === p) || { nazwa: p }).nazwa;
      const z = document.createElement("p");
      z.className = "wymaga";
      z.innerHTML = "<b>Zanim zaczniesz:</b> " + t.wymaga.map(p =>
        `<a href="${p}">${nazwa(p)}</a>${opanowany(p) ? ` <span class="ok" title="Opanowane">✓</span>` : ""}`).join(", ");
      const po = main.querySelector("p.wymagania") || main.querySelector("p.lead") || main.querySelector("h1");
      po.after(z);
    }

    // Opanowane
    const klucz = "opanowane:" + plik;
    const op = document.createElement("div");
    op.className = "opanowane";
    const odswiezOp = () => {
      const ok = pamiec.get(klucz);
      op.innerHTML = `<button>${ok ? "✓ Opanowane — cofnij" : "Oznacz jako opanowane"}</button>`;
      op.classList.toggle("tak", !!ok);
      op.querySelector("button").onclick = () => {
        if (ok) { pamiec.set(klucz, null); pamiec.set("powtorka:" + plik, null); }
        else { pamiec.set(klucz, dzis()); ustawPowtorke(plik, 0); }
        odswiezOp();
      };
    };
    odswiezOp();
    main.appendChild(op);

    sprawdzSie(plik);

    // Powtórka: temat opanowany, którego termin minął
    if (doPowtorki(plik)) {
      const st = stanPowtorki(plik), etap = st ? st.etap : 0;
      const pw = document.createElement("div");
      pw.className = "powtorka-temat";
      pw.innerHTML = `<b>Powtórka</b> (${etap + 1}. z kolei). Przejrzyj wzory i zrób jedno zadanie maturalne bez podglądania.
        <div><button data-o="tak">Pamiętam ✓</button> <button data-o="nie">Nie pamiętam</button></div>`;
      pw.querySelectorAll("button").forEach(b => b.onclick = () => {
        const tak = b.dataset.o === "tak";
        ustawPowtorke(plik, tak ? etap + 1 : 0);
        const st2 = stanPowtorki(plik);
        pw.innerHTML = `${tak ? "Świetnie." : "Nic straconego — wróci jutro."} Następna powtórka: <b>${st2.termin}</b>.`;
      });
      const po = main.querySelector("p.wymaga") || main.querySelector("p.wymagania") || main.querySelector("h1");
      po.after(pw);
    }

    // Poprzedni / następny gotowy temat
    const gotowe = tematy.filter(x => x.plik);
    const j = gotowe.findIndex(x => x.plik === plik);
    const poprz = gotowe[j - 1], nast = gotowe[j + 1];
    const s = document.createElement("nav");
    s.className = "sasiedzi";
    s.innerHTML = (poprz ? `<a href="${poprz.plik}">← ${poprz.nazwa}</a>` : "<span></span>")
                + (nast ? `<a href="${nast.plik}">${nast.nazwa} →</a>` : "<span></span>");
    main.appendChild(s);
  }

  // Wzory: $...$ w tekście, $$...$$ jako blok
  if (window.renderMathInElement) {
    renderMathInElement(document.body, {
      delimiters: [{ left: "$$", right: "$$", display: true }, { left: "$", right: "$", display: false }],
      throwOnError: false, macros: TEX_MAKRA,
      ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "option", "canvas"],
    });
  }
  // rozwinięcie <details> zmienia szerokości — sprawdź ponownie
  document.querySelectorAll("details").forEach(d => d.addEventListener("toggle", () => dopasujSzerokie(d)));
  dopasujSzerokie();

  // --- Listy na stronach głównych ---
  const poziomy = document.getElementById("lista-poziomow");
  if (poziomy && typeof POZIOMY !== "undefined") {
    poziomy.innerHTML = POZIOMY.map(p => p.link
      ? `<a class="karta" href="${p.link}"><h3>${p.nazwa}</h3><p>${p.opis}</p></a>`
      : `<div class="karta wylaczona"><h3>${p.nazwa}<span class="znacznik">wkrótce</span></h3><p>${p.opis}</p></div>`
    ).join("");
  }

  const dzialy = document.getElementById("lista-dzialow");
  if (dzialy && typeof DZIALY_MATURA !== "undefined") {
    const R = t => t.r ? ` <span class="znacznik r" title="Tylko zakres rozszerzony">R</span>` : "";
    const ok = t => t.plik && pamiec.get("opanowane:" + t.plik) ? ` <span class="ok" title="Opanowane">✓</span>` : "";
    let razemG = 0, razemO = 0, razem = 0;
    dzialy.innerHTML = DZIALY_MATURA.map(d => {
      const wlasne = d.tematy.filter(t => !t.odsylacz);
      const gotowe = wlasne.filter(t => t.plik).length;
      const opan = wlasne.filter(t => t.plik && opanowany(t.plik)).length;
      razemG += gotowe; razemO += opan; razem += wlasne.length;
      const li = d.tematy.map(t => t.odsylacz
        ? `<li><a href="${t.plik}">${t.nazwa}</a>${R(t)} <span class="odsylacz">→ ten sam temat co w dziale ${(DZIALY_MATURA.find(x => x !== d && x.tematy.some(y => y.plik === t.plik && !y.odsylacz)) || {}).nr}</span></li>`
        : t.plik
        ? `<li><a href="${t.plik}">${t.nazwa}</a>${R(t)}${ok(t)}</li>`
        : `<li class="brak">${t.nazwa}${R(t)}</li>`).join("");
      return `<details class="dzial"${gotowe ? " open" : ""}>
        <summary><span class="nr">${d.nr}</span>${d.nazwa}<span class="postep">${opan ? `✓ ${opan} · ` : ""}${gotowe}/${wlasne.length}</span></summary>
        <ul>${li}</ul></details>`;
    }).join("");
    const pod = document.getElementById("podsumowanie");
    if (pod) pod.innerHTML = `Gotowe tematy: <b>${razemG}</b> z ${razem} · opanowane: <b>${razemO}</b>
      <div class="pasek"><div style="width:${razemG ? 100 * razemO / razemG : 0}%"></div></div>`;
  }

  const kont = document.getElementById("kontynuuj");
  if (kont && typeof DZIALY_MATURA !== "undefined") panelKontynuuj(kont, kont.dataset.prefiks || "");

  const tw = document.getElementById("lista-twierdzen");
  if (tw && typeof TWIERDZENIA_MATURA !== "undefined") {
    tw.innerHTML = TWIERDZENIA_MATURA.map(t => {
      const nazwa = t.plik ? `<a href="${t.plik}">${t.nazwa}</a>` : t.nazwa;
      return `<li><span class="nr">${t.dzial}</span>${nazwa}${t.r ? ` <span class="znacznik r">R</span>` : ""}</li>`;
    }).join("");
  }
});

// Tryb „sprawdź się” przy zadaniach tematu.
// Wynik liczbowy (ostatnie <b> w rozwiązaniu jest pojedynczą liczbą) → pole odpowiedzi i automatyczna ocena.
// Pozostałe zadania (wyrażenia, przedziały, dowody) → po otwarciu rozwiązania samoocena „Umiałem / Nie umiałem”.
// Wyniki: localStorage „zadanie:<plik>:<nr>” = "1" | "0". Musi działać PRZED renderowaniem KaTeX (czyta surowy TeX).

// "x = \frac{5}{2}" → 2.5; null, gdy wynik nie jest jedną liczbą
function liczbaZWyniku(html) {
  let t = html.replace(/<[^>]+>/g, "").replace(/\$/g, "").replace(/\{,\}/g, ".")
    .replace(/\\[,;!]/g, "").replace(/\s+/g, " ").trim().replace(/\.$/, "");
  t = t.replace(/\s*(zł|cm\S*|m|%|°|\^\{?\\circ\}?|\\%)\s*$/, "");
  t = t.split(/=|\\approx/).pop().trim().replace(/−/g, "-");
  let m;
  if ((m = t.match(/^-?\d+(\.\d+)?$/))) return { v: +t, przybl: /\\approx/.test(html) || /\.\d{2,}$/.test(t) };
  if ((m = t.match(/^(-?)\\[dt]?frac\{(\d+)\}\{(\d+)\}$/)) || (m = t.match(/^(-?)\\[dt]?frac(\d)(\d)$/)))
    return { v: (m[1] ? -1 : 1) * m[2] / m[3], przybl: false };
  return null;
}

// Odpowiedź ucznia: "2,5", "-3", "5/2", "−1/3"
function liczbaZOdpowiedzi(s) {
  s = s.trim().replace(/−/g, "-").replace(/,/g, ".").replace(/\s/g, "");
  let m;
  if ((m = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/))) return +m[1] / +m[2];
  if (/^-?\d+(\.\d+)?$/.test(s) || /^-?\.\d+$/.test(s)) return +s;
  return NaN;
}

function zgodne(odp, wynik) {
  if (Math.abs(odp - wynik.v) <= 1e-6 * Math.max(1, Math.abs(wynik.v))) return true;
  return wynik.przybl && Math.abs(odp - wynik.v) <= 0.0051 * Math.max(1, Math.abs(wynik.v) / 100);
}

function sprawdzSie(plik) {
  const zadania = [...document.querySelectorAll("li.zadanie")];
  if (!zadania.length) return;
  if (zadania.some(li => li.dataset.odp) && typeof ocenOdpowiedz !== "function") {
    const sk = document.createElement("script"); // moduł oceny potrzebny dopiero przy kliknięciu „Sprawdź”
    sk.src = new URL("odpowiedzi.js", document.querySelector('script[src*="site.js"]').src).href;
    document.head.appendChild(sk);
  }
  const klucz = i => `zadanie:${plik}:${i}`;
  const naglowek = document.querySelector("h2#zadania");
  const wynikEl = document.createElement("span");
  wynikEl.className = "wynik-zadan";
  if (naglowek) naglowek.appendChild(wynikEl);
  const odswiezWynik = () => {
    const oc = zadania.map((_, i) => pamiec.get(klucz(i))).filter(v => v !== null);
    const dobre = oc.filter(v => v === "1").length;
    wynikEl.textContent = oc.length ? `${dobre}/${zadania.length}` : "";
    wynikEl.title = oc.length ? `Dobrze: ${dobre}, źle: ${oc.length - dobre}, nierozwiązane: ${zadania.length - oc.length}` : "";
    wynikEl.classList.toggle("komplet", dobre === zadania.length);
  };

  zadania.forEach((li, i) => {
    const rozw = li.querySelector("details.rozwin");
    if (!rozw) return;
    const b = [...rozw.querySelectorAll("b")].pop();
    // dowód kończący się liczbą (np. „= 2”) to nie zadanie z wynikiem do wpisania
    const dowod = /(^|\s)(wykaż|udowodnij|uzasadnij|pokaż, że)/i.test(li.querySelector(".tresc")?.textContent || "");
    const wynik = b && !dowod ? liczbaZWyniku(b.innerHTML) : null;
    const pasek = document.createElement("div");
    pasek.className = "sprawdz";
    const ocena = ok => {
      pamiec.set(klucz(i), ok ? "1" : "0");
      li.classList.toggle("dobrze", ok); li.classList.toggle("zle", !ok);
      odswiezWynik();
    };
    const stary = pamiec.get(klucz(i));
    if (stary !== null) li.classList.add(stary === "1" ? "dobrze" : "zle");

    const kluczOdp = li.dataset.odp;
    if (kluczOdp) {
      // jawny klucz odpowiedzi (assets/odpowiedzi.js): liczby z π, √, kilka wartości albo przedziały
      const przedz = /^przedzial:/i.test(kluczOdp);
      const opis = li.dataset.odpOpis || (przedz ? "zbiór, np. (-oo; -1) u <2; 3>" : "wynik, np. 2pi, 3sqrt(2), 1/2; 4");
      pasek.innerHTML = `<input type="text" placeholder="${opis.replace(/"/g, "&quot;")}" aria-label="Twoja odpowiedź">
        <button type="button">Sprawdź</button><span class="komunikat"></span>
        <details class="jak-wpisac"><summary>jak wpisać?</summary>π: <code>pi</code> · pierwiastek: <code>sqrt(3)</code> lub <code>√3</code> ·
        kilka wartości: <code>2; 1/2</code> · przedziały: <code>(-oo; -1) u &lt;2; 3&gt;</code> (domknięty: &lt; &gt; lub [ ]) · zbiór pusty: <code>{}</code></details>`;
      const inp = pasek.querySelector("input"), kom = pasek.querySelector(".komunikat");
      const sprawdz = () => {
        if (!inp.value.trim()) return;
        if (typeof ocenOdpowiedz !== "function") { kom.textContent = "Moduł oceny jeszcze się wczytuje…"; return; }
        const r = ocenOdpowiedz(inp.value, kluczOdp);
        if (r.blad) { kom.textContent = r.komunikat + " (zob. „jak wpisać?”)"; return; }
        kom.textContent = r.ok ? "✓ Dobrze!" : "✗ Nie. " + (r.komunikat || "Spróbuj jeszcze raz albo otwórz rozwiązanie.");
        ocena(r.ok);
      };
      pasek.querySelector("button").onclick = sprawdz;
      inp.addEventListener("keydown", e => { if (e.key === "Enter") sprawdz(); });
      li.insertBefore(pasek, rozw);
    } else if (wynik) {
      pasek.innerHTML = `<input type="text" inputmode="decimal" placeholder="Twój wynik (np. 2,5 lub 5/2)" aria-label="Twój wynik">
        <button type="button">Sprawdź</button><span class="komunikat"></span>`;
      const inp = pasek.querySelector("input"), kom = pasek.querySelector(".komunikat");
      const sprawdz = () => {
        const odp = liczbaZOdpowiedzi(inp.value);
        if (isNaN(odp)) { kom.textContent = "Wpisz liczbę, np. 2,5 albo 5/2."; return; }
        const ok = zgodne(odp, wynik);
        kom.textContent = ok ? "✓ Dobrze!" : "✗ Nie — spróbuj jeszcze raz albo otwórz rozwiązanie.";
        ocena(ok);
      };
      pasek.querySelector("button").onclick = sprawdz;
      inp.addEventListener("keydown", e => { if (e.key === "Enter") sprawdz(); });
      li.insertBefore(pasek, rozw);
    } else {
      pasek.innerHTML = `<span>Jak poszło?</span> <button type="button" data-ok="1">Umiałem ✓</button>
        <button type="button" data-ok="0">Nie umiałem</button>`;
      pasek.querySelectorAll("button").forEach(btn => btn.onclick = () => ocena(btn.dataset.ok === "1"));
      pasek.hidden = true;
      rozw.addEventListener("toggle", () => { if (rozw.open) pasek.hidden = false; });
      rozw.after(pasek);
    }
    brudnopis(li, rozw, `brudnopis:${plik}:${i}`);
  });

  // Zerowanie wyników tematu
  if (naglowek) {
    const zeruj = document.createElement("button");
    zeruj.type = "button"; zeruj.className = "zeruj-zadania"; zeruj.textContent = "wyczyść wyniki";
    zeruj.onclick = () => {
      zadania.forEach((li, i) => { pamiec.set(klucz(i), null); li.classList.remove("dobrze", "zle"); });
      document.querySelectorAll(".sprawdz .komunikat").forEach(k => k.textContent = "");
      odswiezWynik();
    };
    naglowek.after(zeruj);
  }
  odswiezWynik();
}

// --- Brudnopis przy zadaniu: kartka w kratkę do pisania palcem, rysikiem lub myszą ---
// Kreski zapisane wektorowo w localStorage „brudnopis:<plik>:<nr>”:
// [[x1,y1,x2,y2,...] | {g:1} ...], współrzędne w jednostkach 1/1000 szerokości kartki (skaluje się z ekranem).
function brudnopis(li, przed, klucz) {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "brudnopis-przycisk";
  const ma = () => !!pamiec.get(klucz);
  const opis = () => btn.textContent = (box.hidden ? "✎ Brudnopis" : "✎ Schowaj brudnopis") + (ma() && box.hidden ? " (zapisany)" : "");
  const box = document.createElement("div");
  box.className = "brudnopis"; box.hidden = true;
  box.innerHTML = `<div class="narzedzia">
      <button type="button" data-n="pioro" class="wl" title="Pióro">✎ pióro</button>
      <button type="button" data-n="gumka" title="Gumka: przeciągnij po kresce">⌫ gumka</button>
      <button type="button" data-n="cofnij" title="Cofnij ostatnią kreskę">↶ cofnij</button>
      <button type="button" data-n="wyczysc" title="Wyczyść kartkę">wyczyść</button>
      <button type="button" data-n="wyzej" title="Dłuższa kartka">+ miejsce</button>
      <span class="brudnopis-info" role="status"></span>
    </div><canvas></canvas>`;
  li.insertBefore(btn, przed); li.insertBefore(box, przed);

  const c = box.querySelector("canvas"), ctx = c.getContext("2d");
  let kreski = [], tryb = "pioro", biezaca = null, wys = 0.6; // wysokość = wys · szerokość
  try { const d = JSON.parse(pamiec.get(klucz)); if (d) { kreski = d.k || []; wys = d.h || wys; } } catch (e) {}
  const info = box.querySelector(".brudnopis-info");
  const zapisz = () => {
    const ok = pamiec.set(klucz, kreski.length ? JSON.stringify({ h: wys, k: kreski }) : null);
    info.textContent = ok ? "" : "Brak miejsca w pamięci przeglądarki — ten rysunek nie zostanie zapisany. Wyczyść stare brudnopisy.";
  };
  const kolor = n => getComputedStyle(document.documentElement).getPropertyValue(n).trim();

  function rysuj() {
    const dpr = window.devicePixelRatio || 1, W = c.clientWidth;
    if (!W) return;
    c.style.height = W * wys + "px";
    c.width = Math.round(W * dpr); c.height = Math.round(W * wys * dpr);
    ctx.setTransform(dpr * W / 1000, 0, 0, dpr * W / 1000, 0, 0); // rysujemy w jednostkach 0..1000
    ctx.clearRect(0, 0, 1000, 1000 * wys);
    ctx.strokeStyle = kolor("--plot-grid"); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let x = 25; x < 1000; x += 25) { ctx.moveTo(x, 0); ctx.lineTo(x, 1000 * wys); }
    for (let y = 25; y < 1000 * wys; y += 25) { ctx.moveTo(0, y); ctx.lineTo(1000, y); }
    ctx.stroke();
    ctx.strokeStyle = kolor("--text"); ctx.lineWidth = 3.2; ctx.lineCap = ctx.lineJoin = "round";
    for (const k of kreski) {
      ctx.beginPath(); ctx.moveTo(k[0], k[1]);
      if (k.length === 2) ctx.lineTo(k[0] + 0.1, k[1]);
      for (let j = 2; j < k.length; j += 2) ctx.lineTo(k[j], k[j + 1]);
      ctx.stroke();
    }
  }
  const punkt = e => { const r = c.getBoundingClientRect(); return [Math.round((e.clientX - r.left) * 1000 / r.width), Math.round((e.clientY - r.top) * 1000 / r.width)]; };
  const gumkuj = ([x, y]) => {
    const n = kreski.length;
    kreski = kreski.filter(k => { for (let j = 0; j < k.length; j += 2) if (Math.hypot(k[j] - x, k[j + 1] - y) < 18) return false; return true; });
    if (kreski.length !== n) rysuj();
  };
  c.addEventListener("pointerdown", e => {
    if (e.button > 0 && e.button !== 5) return; // 5 = gumka rysika
    c.setPointerCapture(e.pointerId); e.preventDefault();
    const p = punkt(e);
    if (tryb === "gumka" || e.button === 5 || (e.buttons & 32)) { biezaca = "gumka"; gumkuj(p); return; }
    biezaca = [...p]; kreski.push(biezaca); rysuj();
  });
  c.addEventListener("pointermove", e => {
    if (!biezaca) return;
    const p = punkt(e);
    if (biezaca === "gumka") { gumkuj(p); return; }
    const n = biezaca.length;
    if (Math.hypot(p[0] - biezaca[n - 2], p[1] - biezaca[n - 1]) < 2) return; // pomijaj drgania
    biezaca.push(...p);
    ctx.beginPath(); ctx.moveTo(biezaca[n - 2], biezaca[n - 1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
  });
  const koniec = () => { if (biezaca) { biezaca = null; zapisz(); } };
  c.addEventListener("pointerup", koniec); c.addEventListener("pointercancel", koniec);

  box.querySelectorAll(".narzedzia button").forEach(b => b.onclick = () => {
    const n = b.dataset.n;
    if (n === "pioro" || n === "gumka") {
      tryb = n; box.querySelectorAll("[data-n=pioro],[data-n=gumka]").forEach(x => x.classList.toggle("wl", x === b));
      c.style.cursor = n === "gumka" ? "cell" : "crosshair";
    }
    if (n === "cofnij") { kreski.pop(); zapisz(); rysuj(); }
    if (n === "wyczysc" && (!kreski.length || confirm("Wyczyścić brudnopis tego zadania?"))) { kreski = []; zapisz(); rysuj(); }
    if (n === "wyzej") { wys = Math.min(wys + 0.4, 3); zapisz(); rysuj(); }
  });
  btn.onclick = () => { box.hidden = !box.hidden; opis(); if (!box.hidden) rysuj(); };
  window.addEventListener("resize", () => { if (!box.hidden) rysuj(); });
  document.addEventListener("zmiana-motywu", () => { if (!box.hidden) rysuj(); });
  opis();
}

// --- Wyszukiwarka (🔍 w nagłówku, skrót „/”) — indeks assets/indeks.js z tools/indeks.mjs ---
const bezOgonkow = s => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ł/g, "l");
function szukaj(zapytanie) {
  const slowa = bezOgonkow(zapytanie).split(/\s+/).filter(Boolean);
  if (!slowa.length || typeof INDEKS === "undefined") return [];
  const wyniki = [];
  // premia za słowa trafione od początku wyrazu („sinusow” w „sinusów”, nie w „cosinusów”)
  const odPoczatku = t => slowa.filter(w => (" " + t).includes(" " + w)).length * 3;
  for (const s of INDEKS) {
    const tytul = bezOgonkow(s.n);
    const pasuje = t => slowa.every(w => t.includes(w));
    if (pasuje(tytul + " " + bezOgonkow(s.d))) wyniki.push({ s, kot: "", tekst: s.n, pkt: 100 - (tytul.startsWith(slowa[0]) ? 0 : 10) + odPoczatku(tytul) });
    for (const [typ, kot, tekst] of s.e) {
      const t = bezOgonkow(tekst);
      if (pasuje(t) || pasuje(t + " " + tytul)) wyniki.push({ s, kot, tekst, typ, pkt: (pasuje(t) ? 50 : 20) + (typ === "s" ? 5 : 0) + odPoczatku(t) });
    }
  }
  return wyniki.sort((a, b) => b.pkt - a.pkt).slice(0, 30);
}
function otworzSzukanie() {
  const baza = new URL("../", document.querySelector('script[src*="site.js"]').src);
  const prefiks = new URL("matura/", baza).href;
  let okno = document.getElementById("szukaj-okno");
  if (!okno) {
    okno = document.createElement("div");
    okno.id = "szukaj-okno";
    okno.innerHTML = `<div class="szukaj-panel" role="dialog" aria-label="Szukaj">
        <input type="search" placeholder="Szukaj tematu, wzoru, twierdzenia…" aria-label="Szukaj">
        <ul class="szukaj-wyniki"></ul><p class="szukaj-pusto">Wpisz np. „Viète”, „styczna”, „pole trójkąta”.</p></div>`;
    document.body.appendChild(okno);
    const inp = okno.querySelector("input"), ul = okno.querySelector("ul"), pusto = okno.querySelector(".szukaj-pusto");
    const TYP = { s: "sekcja", w: "wzór", d: "definicja", t: "twierdzenie" };
    const pokaz = () => {
      const w = szukaj(inp.value);
      pusto.hidden = !!w.length;
      if (inp.value.trim() && !w.length) pusto.textContent = "Nic nie znaleziono.";
      const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      ul.innerHTML = w.map((r, j) => `<li><a href="${prefiks}${r.s.p}${r.kot ? "#" + r.kot : ""}"${j ? "" : ' class="akt"'}>
        <b>${esc(r.tekst)}</b><span>${esc(r.typ ? TYP[r.typ] + " · " + r.s.n : r.s.d)}</span></a></li>`).join("");
    };
    inp.addEventListener("input", pokaz);
    inp.addEventListener("keydown", e => {
      const linki = [...ul.querySelectorAll("a")], j = linki.findIndex(a => a.classList.contains("akt"));
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault(); if (!linki.length) return;
        const n = (j + (e.key === "ArrowDown" ? 1 : -1) + linki.length) % linki.length;
        linki.forEach((a, k) => a.classList.toggle("akt", k === n)); linki[n].scrollIntoView({ block: "nearest" });
      }
      if (e.key === "Enter" && linki[j]) location.href = linki[j].href;
    });
    okno.addEventListener("click", e => { if (e.target === okno) okno.hidden = true; });
    if (typeof INDEKS === "undefined") {
      const sk = document.createElement("script"); sk.src = new URL("assets/indeks.js", baza).href;
      sk.onload = pokaz; document.head.appendChild(sk);
    }
  }
  okno.hidden = false;
  const inp = okno.querySelector("input"); inp.focus(); inp.select();
}
document.addEventListener("DOMContentLoaded", () => {
  const motyw = document.getElementById("motyw");
  if (!motyw) return;
  const b = document.createElement("button");
  b.id = "szukaj"; b.title = "Szukaj (/)"; b.setAttribute("aria-label", "Szukaj"); b.textContent = "🔍";
  b.onclick = otworzSzukanie;
  motyw.before(b);
  document.addEventListener("keydown", e => {
    const okno = document.getElementById("szukaj-okno");
    if (e.key === "Escape" && okno) okno.hidden = true;
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); otworzSzukanie(); }
  });
});
