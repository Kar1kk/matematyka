// Wspólne zachowania strony: motyw, wzory KaTeX, nawigacja, postęp, listy z dzialy.js.

// Język: strony w en/ mają <html lang="en">; T("po polsku", "in English")
const EN = document.documentElement.lang === "en";
const T = (pl, en) => EN ? en : pl;

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
  dodaj("meta", { name: "theme-color", content: "#111111" });
  if ("serviceWorker" in navigator && location.protocol !== "file:")
    addEventListener("load", () => navigator.serviceWorker.register(new URL("sw.js", korzen).href, { updateViaCache: "none" }).catch(() => {}));
})();

// Zapamiętany wybór języka: polska strona startowa (też aplikacja z ekranu głównego) przechodzi na angielską
(function jezykStartowy() {
  const skrypt = document.currentScript;
  if (EN || !skrypt) return;
  const korzen = new URL("../", skrypt.src);
  const tu = decodeURIComponent(location.pathname).slice(decodeURIComponent(korzen.pathname).length);
  let jez = null;
  try { jez = localStorage.getItem("jezyk"); } catch (e) {}
  if (jez === "en" && (tu === "" || tu === "index.html")) location.replace(new URL("en/", korzen).href);
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
  set(k, v) {
    try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) { return false; }
    if (typeof syncZmiana === "function") syncZmiana(k);
    return true;
  },
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

// --- Synchronizacja postępu między urządzeniami (dobrowolna, przez prywatny gist GitHuba) ---
// Działa tylko po wklejeniu własnego tokenu (uprawnienie „gist”) w panelu „Twoja nauka”; bez tokenu nic się nie dzieje.
// Token i stan synchronizacji zostają w tej przeglądarce (klucze „sync:*” — nie trafiają do eksportu ani do gista).
// Synchronizowane: opanowane:, powtorka:, zadanie: (bez brudnopisów). Gist: plik matematyka-postep.json =
// {wersja, dane: {klucz: {v: wartość | null (usunięte), t: czas zmiany w ms}}}; przy konflikcie wygrywa nowsza zmiana.
const SYNC_KLUCZE = /^(opanowane:|powtorka:|zadanie:)/;
const SYNC_PLIK = "matematyka-postep.json";
const syncToken = () => pamiec.get("sync:token");
const syncCzasy = () => { try { return JSON.parse(pamiec.get("sync:zmiany")) || {}; } catch (e) { return {}; } };
const syncUstaw = (k, v) => { try { v === null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} };
let _syncTimer = null, _syncTrwa = null;
function syncZmiana(k) {
  if (!SYNC_KLUCZE.test(k) || !syncToken()) return;
  const z = syncCzasy(); z[k] = Date.now();
  syncUstaw("sync:zmiany", JSON.stringify(z)); syncUstaw("sync:brudne", "1");
  clearTimeout(_syncTimer); _syncTimer = setTimeout(() => synchronizuj().catch(() => {}), 2500);
}
async function syncApi(metoda, sciezka, tresc) {
  const body = tresc ? JSON.stringify(tresc) : undefined;
  const r = await fetch("https://api.github.com" + sciezka, { method: metoda, cache: "no-store", body,
    keepalive: !!body && body.length < 60000, // zdąży się wysłać także przy zamykaniu strony
    headers: { Authorization: "Bearer " + syncToken(), Accept: "application/vnd.github+json", ...(body ? { "Content-Type": "application/json" } : {}) } });
  if (r.status === 401) throw new Error(T("Token jest nieprawidłowy albo wygasł.", "The token is invalid or has expired."));
  if (r.status === 403 || r.status === 404) throw new Error(T("Brak dostępu — token musi mieć uprawnienie „gist”.", "No access — the token needs the “gist” permission."));
  if (!r.ok) throw new Error(T("Błąd GitHuba: ", "GitHub error: ") + r.status);
  return r.json();
}
// Zwraca true, gdy z drugiego urządzenia przyszły zmiany (stronę warto odświeżyć)
function synchronizuj() {
  if (!syncToken()) return Promise.resolve(false);
  if (_syncTrwa) return _syncTrwa;
  clearTimeout(_syncTimer);
  _syncTrwa = (async () => {
    let id = pamiec.get("sync:gist");
    if (!id) { // gist założony wcześniej z innego urządzenia?
      const moje = await syncApi("GET", "/gists?per_page=100");
      id = (moje.find(g => g.files && g.files[SYNC_PLIK]) || {}).id;
    }
    let zdalne = {};
    if (id) {
      const g = await syncApi("GET", "/gists/" + id), p = g.files && g.files[SYNC_PLIK];
      if (p) {
        const tekst = p.truncated ? await (await fetch(p.raw_url, { cache: "no-store" })).text() : p.content;
        try { zdalne = JSON.parse(tekst).dane || {}; } catch (e) { zdalne = {}; }
      }
    }
    syncUstaw("sync:brudne", null); // zmiany zrobione w trakcie wysyłania ustawią znacznik ponownie
    const czasy = syncCzasy(), lokalne = {};
    try { for (let k = 0; k < localStorage.length; k++) { const n = localStorage.key(k); if (SYNC_KLUCZE.test(n)) lokalne[n] = localStorage.getItem(n); } } catch (e) {}
    const wynik = {}; let pobrano = false, wyslac = false;
    for (const k of new Set([...Object.keys(zdalne), ...Object.keys(lokalne), ...Object.keys(czasy)])) {
      if (!SYNC_KLUCZE.test(k)) continue;
      const maL = k in lokalne || k in czasy, l = { v: k in lokalne ? lokalne[k] : null, t: czasy[k] || 0 };
      const r = zdalne[k] && typeof zdalne[k] === "object" ? zdalne[k] : null;
      // nowsza zmiana wygrywa; przy równych czasach (stary postęp bez dat) rozstrzyga porównanie wartości — tak samo na obu urządzeniach
      const zdalnaLepsza = r && (!maL || r.t > l.t || (r.t === l.t && String(r.v ?? "") > String(l.v ?? "")));
      if (zdalnaLepsza) {
        wynik[k] = r;
        if (r.v !== l.v) { syncUstaw(k, typeof r.v === "string" ? r.v : null); pobrano = true; }
        czasy[k] = r.t;
      } else {
        wynik[k] = l;
        if (!r || r.t !== l.t || r.v !== l.v) wyslac = true;
      }
    }
    syncUstaw("sync:zmiany", JSON.stringify(czasy));
    const pliki = { files: { [SYNC_PLIK]: { content: JSON.stringify({ wersja: 1, dane: wynik }) } } };
    if (!id) id = (await syncApi("POST", "/gists", { description: "Matematyka — postęp nauki (synchronizacja)", public: false, ...pliki })).id;
    else if (wyslac) await syncApi("PATCH", "/gists/" + id, pliki);
    syncUstaw("sync:gist", id); syncUstaw("sync:czas", String(Date.now()));
    return pobrano;
  })().catch(e => { syncUstaw("sync:brudne", "1"); throw e; }).finally(() => { _syncTrwa = null; });
  return _syncTrwa;
}
function syncWylacz() { ["sync:token", "sync:gist", "sync:zmiany", "sync:brudne", "sync:czas"].forEach(k => syncUstaw(k, null)); }
// Przy otwarciu strony: pobierz zmiany (na stronach tematów najwyżej raz na minutę, chyba że są niewysłane zmiany)
document.addEventListener("DOMContentLoaded", () => {
  if (!syncToken()) return;
  const glowna = !!document.getElementById("kontynuuj");
  if (!glowna && !pamiec.get("sync:brudne") && Date.now() - (+pamiec.get("sync:czas") || 0) < 60000) return;
  synchronizuj().then(pobrano => {
    if (!pobrano) return;
    if (glowna) { location.reload(); return; }
    const p = document.createElement("div");
    p.className = "sync-info";
    p.innerHTML = `${T("Pobrano postęp z drugiego urządzenia.", "Progress from your other device has been downloaded.")} <button type="button">${T("Odśwież", "Reload")}</button>`;
    p.querySelector("button").onclick = () => location.reload();
    document.body.appendChild(p);
  }).catch(() => {});
});
document.addEventListener("visibilitychange", () => { if (document.hidden && syncToken() && pamiec.get("sync:brudne")) synchronizuj().catch(() => {}); });

function panelSync(el) {
  const wl = !!syncToken(), czas = +pamiec.get("sync:czas") || 0;
  const kiedy = czas ? new Date(czas).toLocaleString(EN ? "en-GB" : "pl-PL", { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";
  el.innerHTML = wl
    ? `<summary>${T("Synchronizacja: włączona", "Sync: on")} ✓</summary>
       <p>${T("Ostatnia synchronizacja", "Last sync")}: <b>${kiedy}</b>. ${T("Opanowane tematy, powtórki i wyniki zadań są zapisywane w Twoim prywatnym giście na GitHubie (bez brudnopisów).", "Mastered topics, reviews and task results are stored in your private GitHub gist (scratchpads excluded).")}</p>
       <div class="postep-plik"><button type="button" data-s="teraz">${T("Synchronizuj teraz", "Sync now")}</button>
       <button type="button" data-s="wylacz">${T("Wyłącz na tym urządzeniu", "Turn off on this device")}</button><span class="info"></span></div>`
    : `<summary>${T("Synchronizacja między urządzeniami", "Sync between devices")}</summary>
       <p>${T(`Postęp (bez brudnopisów) może się sam przenosić między telefonem a komputerem przez Twój prywatny gist na GitHubie.
         <a href="https://github.com/settings/tokens/new?scopes=gist&description=Matematyka%20-%20synchronizacja" target="_blank" rel="noopener">Utwórz token</a>
         z jednym uprawnieniem <b>gist</b> i wklej go tutaj — na każdym swoim urządzeniu ten sam. Token zostaje tylko w tej przeglądarce; nie wklejaj go na cudzych urządzeniach.`,
         `Your progress (without scratchpads) can travel between your phone and computer through your private GitHub gist.
         <a href="https://github.com/settings/tokens/new?scopes=gist&description=Matematyka%20-%20sync" target="_blank" rel="noopener">Create a token</a>
         with the single <b>gist</b> permission and paste it here — the same one on each of your devices. The token stays in this browser only; do not paste it on devices that are not yours.`)}</p>
       <div class="postep-plik"><input type="password" autocomplete="off" placeholder="${T("token GitHuba (ghp_…)", "GitHub token (ghp_…)")}" aria-label="Token">
       <button type="button" data-s="wlacz">${T("Włącz", "Turn on")}</button><span class="info"></span></div>`;
  const info = el.querySelector(".info"), przycisk = s => el.querySelector(`[data-s=${s}]`);
  const uruchom = (poSukcesie) => {
    info.textContent = T("Synchronizuję…", "Syncing…");
    synchronizuj().then(pobrano => { if (pobrano || poSukcesie) location.reload(); else panelSync(el); })
      .catch(e => { if (poSukcesie) syncWylacz(); info.textContent = T("Nie udało się: ", "Failed: ") + (e.message || e); });
  };
  if (wl) {
    przycisk("teraz").onclick = () => uruchom(false);
    przycisk("wylacz").onclick = () => { syncWylacz(); panelSync(el); };
  } else przycisk("wlacz").onclick = () => {
    const t = el.querySelector("input").value.trim();
    if (!t) return;
    syncUstaw("sync:token", t);
    uruchom(true);
  };
}

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
  if (!dane || typeof dane !== "object") throw new Error(T("To nie jest plik postępu.", "This is not a progress file."));
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
  const naglowek = document.getElementById("podsumowanie") ? "" : `<div class="kontynuuj-naglowek"><b>${T("Twoja nauka", "Your progress")}</b> · ${T("opanowane", "mastered")} ${opan} ${T("z", "of")} ${razem}
      <div class="pasek"><div style="width:${100 * opan / razem}%"></div></div></div>`;
  const lista = powtorki.length ? `<div class="powtorki"><b>${T("Do powtórki dziś", "To review today")} (${powtorki.length}):</b>
      ${powtorki.map(t => `<a href="${prefiks}${t.plik}">${t.nazwa}</a>`).join(" · ")}</div>`
    : opan ? `<div class="powtorki">${T("Na dziś nic do powtórki ✓", "Nothing to review today ✓")}</div>` : "";
  // Zadania do poprawy: ocenione jako „źle” (także rozwiązane dopiero po obejrzeniu rozwiązania)
  const zle = {};
  try {
    for (let k = 0; k < localStorage.length; k++) {
      const m = /^zadanie:(.+):(\d+)$/.exec(localStorage.key(k));
      if (m && localStorage.getItem(m[0]) === "0") (zle[m[1]] = zle[m[1]] || []).push(+m[2]);
    }
  } catch (e) {}
  const tematy = wszystkieTematy();
  const zlePliki = Object.keys(zle).filter(p => tematy.some(t => t.plik === p));
  const poprawa = zlePliki.length ? `<div class="powtorki"><b>${T("Zadania do poprawy", "Tasks to redo")} (${zlePliki.reduce((n, p) => n + zle[p].length, 0)}):</b>
      ${zlePliki.map(p => `<a href="${prefiks}${p}#zadanie-${Math.min(...zle[p]) + 1}">${tematy.find(t => t.plik === p).nazwa}</a> (${zle[p].length})`).join(" · ")}</div>` : "";
  el.innerHTML = naglowek + lista + poprawa + `<div class="siatka">${link(ostatni, T("ostatnio otwarty", "last opened"))}${link(nastepny, ostatni ? T("proponowany następny", "suggested next") : T("zacznij tutaj", "start here"))}${link(powtorki[0], T("powtórka", "review"))}</div>
    <div class="postep-plik"><button type="button" data-akcja="eksport">${T("Zapisz postęp do pliku", "Save progress to a file")}</button>
      <label><input type="file" accept=".json,application/json" hidden>${T("Wczytaj postęp z pliku", "Load progress from a file")}</label>
      <span class="info"></span></div>
    <details class="sync"></details>`;
  panelSync(el.querySelector("details.sync"));
  const info = el.querySelector(".info");
  el.querySelector("[data-akcja=eksport]").onclick = eksportujPostep;
  el.querySelector("input[type=file]").onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => { const n = importujPostep(t); info.textContent = T(`Wczytano ${n} wpisów — odświeżam…`, `Loaded ${n} entries — reloading…`); setTimeout(() => location.reload(), 800); })
      .catch(err => { info.textContent = T("Błąd: ", "Error: ") + (err.message || T("zły plik", "bad file")); });
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
    spis.innerHTML = `<b>${T("Na tej stronie", "On this page")}</b><ol>${h2.map(h => `<li><a href="#${h.id}">${h.textContent.replace(/^\d+\.\s*/, "")}</a></li>`).join("")}</ol>`;
  }

  // --- Strona tematu: okruszki, sąsiedzi, opanowane ---
  let plik = decodeURIComponent(location.pathname.split("/").pop());
  if (plik && !plik.includes(".")) plik += ".html"; // GitHub Pages podaje też adresy bez .html
  const tematy = wszystkieTematy();
  const i = tematy.findIndex(t => t.plik === plik);
  if (i >= 0) {
    const t = tematy[i];
    const nav = document.querySelector("header.top nav");
    if (nav) nav.innerHTML = `› <a href="index.html">${T("Matura rozszerzona", "Matura, extended level")}</a> › ${t.dzial.nr}. ${t.dzial.nazwa}`;
    const main = document.querySelector("main");
    pamiec.set("ostatni", plik);

    // Zanim zaczniesz: tematy wymagane wcześniej
    if (t.wymaga && t.wymaga.length) {
      const nazwa = p => (tematy.find(x => x.plik === p) || { nazwa: p }).nazwa;
      const z = document.createElement("p");
      z.className = "wymaga";
      z.innerHTML = `<b>${T("Zanim zaczniesz:", "Before you start:")}</b> ` + t.wymaga.map(p =>
        `<a href="${p}">${nazwa(p)}</a>${opanowany(p) ? ` <span class="ok" title="${T("Opanowane", "Mastered")}">✓</span>` : ""}`).join(", ");
      const po = main.querySelector("p.wymagania") || main.querySelector("p.lead") || main.querySelector("h1");
      po.after(z);
    }

    // Opanowane
    const klucz = "opanowane:" + plik;
    const op = document.createElement("div");
    op.className = "opanowane";
    const odswiezOp = () => {
      const ok = pamiec.get(klucz);
      const ile = document.querySelectorAll("li.zadanie").length;
      let dobre = 0;
      for (let k = 0; k < ile; k++) if (pamiec.get(`zadanie:${plik}:${k}`) === "1") dobre++;
      const uwaga = ok || !ile ? "" : dobre === ile
        ? T("Wszystkie zadania zaliczone ✓ — możesz oznaczyć temat.", "All tasks done ✓ — you can mark the topic.")
        : T(`Zaliczone zadania: ${dobre}/${ile}. „Opanowane” znaczy: robisz je sam, bez podglądania rozwiązań.`,
            `Tasks done: ${dobre}/${ile}. “Mastered” means you can solve them yourself, without peeking.`);
      op.innerHTML = `<button>${ok ? T("✓ Opanowane — cofnij", "✓ Mastered — undo") : T("Oznacz jako opanowane", "Mark as mastered")}</button>${uwaga ? `<p class="opanowane-uwaga">${uwaga}</p>` : ""}`;
      op.classList.toggle("tak", !!ok);
      op.querySelector("button").onclick = () => {
        if (ok) { pamiec.set(klucz, null); pamiec.set("powtorka:" + plik, null); }
        else { pamiec.set(klucz, dzis()); ustawPowtorke(plik, 0); }
        odswiezOp();
      };
    };
    odswiezOp();
    main.appendChild(op);
    document.addEventListener("wynik-zadan", odswiezOp);

    sprawdzSie(plik);

    // Powtórka: temat opanowany, którego termin minął
    if (doPowtorki(plik)) {
      const st = stanPowtorki(plik), etap = st ? st.etap : 0;
      const pw = document.createElement("div");
      pw.className = "powtorka-temat";
      pw.innerHTML = T(`<b>Powtórka</b> (${etap + 1}. z kolei). Najpierw przypomnij sobie wzory (zakryj je), potem rozwiąż wylosowane zadanie bez podglądania. Dopiero wtedy oceń.`,
        `<b>Review</b> (no. ${etap + 1}). First recall the formulas (hide them), then solve a randomly drawn task without peeking. Only then rate yourself.`)
        + `<div><button data-p="wzory">${T("1. Zakryj wzory", "1. Hide formulas")}</button> <button data-p="los">${T("2. Wylosuj zadanie", "2. Draw a task")}</button></div>`
        + `<div><button data-o="tak">${T("Pamiętam ✓", "I remember ✓")}</button> <button data-o="nie">${T("Nie pamiętam", "I don't remember")}</button></div>`;
      pw.querySelector("[data-p=wzory]").onclick = () => { zakryjWzory(true); (main.querySelector("h2[id]") || main).scrollIntoView({ behavior: "smooth" }); };
      pw.querySelector("[data-p=los]").onclick = () => losujZadanie(plik);
      pw.querySelectorAll("button[data-o]").forEach(b => b.onclick = () => {
        const tak = b.dataset.o === "tak";
        ustawPowtorke(plik, tak ? etap + 1 : 0);
        const st2 = stanPowtorki(plik);
        pw.innerHTML = `${tak ? T("Świetnie.", "Great.") : T("Nic straconego — wróci jutro.", "No problem — it will come back tomorrow.")} ${T("Następna powtórka", "Next review")}: <b>${st2.termin}</b>.`;
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
  przyciskZakrywania();

  // --- Listy na stronach głównych ---
  const poziomy = document.getElementById("lista-poziomow");
  if (poziomy && typeof POZIOMY !== "undefined") {
    poziomy.innerHTML = POZIOMY.map(p => p.link
      ? `<a class="karta" href="${p.link}"><h3>${p.nazwa}</h3><p>${p.opis}</p></a>`
      : `<div class="karta wylaczona"><h3>${p.nazwa}<span class="znacznik">${T("wkrótce", "coming soon")}</span></h3><p>${p.opis}</p></div>`
    ).join("");
  }

  const dzialy = document.getElementById("lista-dzialow");
  if (dzialy && typeof DZIALY_MATURA !== "undefined") {
    const R = t => t.r ? ` <span class="znacznik r" title="${T("Tylko zakres rozszerzony", "Extended level only")}">R</span>` : "";
    const ok = t => t.plik && pamiec.get("opanowane:" + t.plik) ? ` <span class="ok" title="${T("Opanowane", "Mastered")}">✓</span>` : "";
    let razemG = 0, razemO = 0, razem = 0;
    dzialy.innerHTML = DZIALY_MATURA.map(d => {
      const wlasne = d.tematy.filter(t => !t.odsylacz);
      const gotowe = wlasne.filter(t => t.plik).length;
      const opan = wlasne.filter(t => t.plik && opanowany(t.plik)).length;
      razemG += gotowe; razemO += opan; razem += wlasne.length;
      const li = d.tematy.map(t => t.odsylacz
        ? `<li><a href="${t.plik}">${t.nazwa}</a>${R(t)} <span class="odsylacz">→ ${T("ten sam temat co w dziale", "same topic as in section")} ${(DZIALY_MATURA.find(x => x !== d && x.tematy.some(y => y.plik === t.plik && !y.odsylacz)) || {}).nr}</span></li>`
        : t.plik
        ? `<li><a href="${t.plik}">${t.nazwa}</a>${R(t)}${ok(t)}</li>`
        : `<li class="brak">${t.nazwa}${R(t)}</li>`).join("");
      return `<details class="dzial"${gotowe ? " open" : ""}>
        <summary><span class="nr">${d.nr}</span>${d.nazwa}<span class="postep">${opan ? `✓ ${opan} · ` : ""}${gotowe}/${wlasne.length}</span></summary>
        <ul>${li}</ul></details>`;
    }).join("");
    const pod = document.getElementById("podsumowanie");
    if (pod) pod.innerHTML = `${T("Gotowe tematy", "Topics ready")}: <b>${razemG}</b> ${T("z", "of")} ${razem} · ${T("opanowane", "mastered")}: <b>${razemO}</b>
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
  t = t.replace(/\s*(zł|PLN|cm\S*|m|%|°|\^\{?\\circ\}?|\\%)\s*$/, "");
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
    wynikEl.title = oc.length ? T(`Dobrze: ${dobre}, źle: ${oc.length - dobre}, nierozwiązane: ${zadania.length - oc.length}`, `Right: ${dobre}, wrong: ${oc.length - dobre}, unsolved: ${zadania.length - oc.length}`) : "";
    wynikEl.classList.toggle("komplet", dobre === zadania.length);
    document.dispatchEvent(new Event("wynik-zadan"));
  };

  zadania.forEach((li, i) => {
    const rozw = li.querySelector("details.rozwin");
    if (!rozw) return;
    const b = [...rozw.querySelectorAll("b")].pop();
    // dowód kończący się liczbą (np. „= 2”) to nie zadanie z wynikiem do wpisania
    const dowod = /(^|\s)(wykaż|udowodnij|uzasadnij|pokaż, że|prove|show that|justify|explain why)/i.test(li.querySelector(".tresc")?.textContent || "");
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
    if (!li.id) li.id = "zadanie-" + (i + 1);
    // Rozwiązanie otwarte przed poprawną odpowiedzią: wpisany potem wynik nie liczy się jako samodzielny
    let podejrzane = false;
    rozw.addEventListener("toggle", () => { if (rozw.open && pamiec.get(klucz(i)) !== "1") podejrzane = true; });
    const PO_PODGLADZIE = T("✓ Dobrze, ale po obejrzeniu rozwiązania — nie zaliczam. Zadanie trafia do poprawy: wróć do niego za kilka dni.",
      "✓ Correct, but after viewing the solution — not counted. The task goes to your redo list: come back in a few days.");

    const kluczOdp = li.dataset.odp;
    if (kluczOdp) {
      // jawny klucz odpowiedzi (assets/odpowiedzi.js): liczby z π, √, kilka wartości albo przedziały
      const przedz = /^przedzial:/i.test(kluczOdp);
      const opis = li.dataset.odpOpis || (przedz ? T("zbiór, np. (-oo; -1) u <2; 3>", "set, e.g. (-oo; -1) u [2; 3]") : T("wynik, np. 2pi, 3sqrt(2), 1/2; 4", "answer, e.g. 2pi, 3sqrt(2), 1/2; 4"));
      pasek.innerHTML = `<input type="text" placeholder="${opis.replace(/"/g, "&quot;")}" aria-label="${T("Twoja odpowiedź", "Your answer")}">
        <button type="button">${T("Sprawdź", "Check")}</button><span class="komunikat"></span>
        ${T(`<details class="jak-wpisac"><summary>jak wpisać?</summary>π: <code>pi</code> · pierwiastek: <code>sqrt(3)</code> lub <code>√3</code> ·
        kilka wartości: <code>2; 1/2</code> · przedziały: <code>(-oo; -1) u &lt;2; 3&gt;</code> (domknięty: &lt; &gt; lub [ ]) · zbiór pusty: <code>{}</code></details>`,
        `<details class="jak-wpisac"><summary>how to type?</summary>π: <code>pi</code> · root: <code>sqrt(3)</code> or <code>√3</code> ·
        several values: <code>2; 1/2</code> · intervals: <code>(-oo; -1) u [2; 3]</code> (closed: [ ]) · empty set: <code>{}</code></details>`)}`;
      const inp = pasek.querySelector("input"), kom = pasek.querySelector(".komunikat");
      const sprawdz = () => {
        if (!inp.value.trim()) return;
        if (typeof ocenOdpowiedz !== "function") { kom.textContent = T("Moduł oceny jeszcze się wczytuje…", "The checker is still loading…"); return; }
        const r = ocenOdpowiedz(inp.value, kluczOdp);
        if (r.blad) { kom.textContent = r.komunikat + T(" (zob. „jak wpisać?”)", " (see “how to type?”)"); return; }
        kom.textContent = r.ok ? (podejrzane ? PO_PODGLADZIE : T("✓ Dobrze!", "✓ Correct!")) : T("✗ Nie. ", "✗ No. ") + (r.komunikat || T("Spróbuj jeszcze raz, weź podpowiedź albo otwórz rozwiązanie.", "Try again, take a hint or open the solution."));
        ocena(r.ok && !podejrzane);
      };
      pasek.querySelector("button").onclick = sprawdz;
      inp.addEventListener("keydown", e => { if (e.key === "Enter") sprawdz(); });
      li.insertBefore(pasek, rozw);
    } else if (wynik) {
      pasek.innerHTML = `<input type="text" inputmode="decimal" placeholder="${T("Twój wynik (np. 2,5 lub 5/2)", "Your answer (e.g. 2.5 or 5/2)")}" aria-label="${T("Twój wynik", "Your answer")}">
        <button type="button">${T("Sprawdź", "Check")}</button><span class="komunikat"></span>`;
      const inp = pasek.querySelector("input"), kom = pasek.querySelector(".komunikat");
      const sprawdz = () => {
        const odp = liczbaZOdpowiedzi(inp.value);
        if (isNaN(odp)) { kom.textContent = T("Wpisz liczbę, np. 2,5 albo 5/2.", "Enter a number, e.g. 2.5 or 5/2."); return; }
        const ok = zgodne(odp, wynik);
        kom.textContent = ok ? (podejrzane ? PO_PODGLADZIE : T("✓ Dobrze!", "✓ Correct!")) : T("✗ Nie — spróbuj jeszcze raz, weź podpowiedź albo otwórz rozwiązanie.", "✗ No — try again, take a hint or open the solution.");
        ocena(ok && !podejrzane);
      };
      pasek.querySelector("button").onclick = sprawdz;
      inp.addEventListener("keydown", e => { if (e.key === "Enter") sprawdz(); });
      li.insertBefore(pasek, rozw);
    } else {
      pasek.innerHTML = `<span>${T("Jak poszło?", "How did it go?")}</span> <button type="button" data-ok="1">${T("Umiałem ✓", "Got it ✓")}</button>
        <button type="button" data-ok="0">${T("Nie umiałem", "Didn't get it")}</button>`;
      pasek.querySelectorAll("button").forEach(btn => btn.onclick = () => ocena(btn.dataset.ok === "1"));
      pasek.hidden = true;
      rozw.addEventListener("toggle", () => { if (rozw.open) pasek.hidden = false; });
      rozw.after(pasek);
    }
    brudnopis(li, rozw, `brudnopis:${plik}:${i}`);
    podpowiedzi(li, rozw);
  });
  // Odnośnik do konkretnego zadania (#zadanie-3): przewiń po wyrenderowaniu wzorów
  if (/^#zadanie-\d+$/.test(location.hash)) setTimeout(() => document.getElementById(location.hash.slice(1))?.scrollIntoView(), 0);

  // Zerowanie wyników tematu
  if (naglowek) {
    const zeruj = document.createElement("button");
    zeruj.type = "button"; zeruj.className = "zeruj-zadania"; zeruj.textContent = T("wyczyść wyniki", "clear results");
    zeruj.onclick = () => {
      zadania.forEach((li, i) => { pamiec.set(klucz(i), null); li.classList.remove("dobrze", "zle"); });
      document.querySelectorAll(".sprawdz .komunikat").forEach(k => k.textContent = "");
      odswiezWynik();
    };
    naglowek.after(zeruj);
  }
  odswiezWynik();
}

// --- Podpowiedzi: rozwiązanie odsłaniane krok po kroku (zamiast „wszystko albo nic”) ---
// Dzieli surowy HTML rozwiązania na kroki: zdania i <br> na najwyższym poziomie, poza wzorami i znacznikami.
function krokiRozwiazania(html) {
  const kroki = [], SKROT = /(^|[\s(])(np|tzn|tj|ok|wsk|por|itd|itp|e\.g|i\.e|cf|etc|resp)\.$/i;
  let b = "", gl = 0, mat = false, i = 0;
  const utnij = () => { if (b.replace(/<[^>]+>/g, "").trim()) kroki.push(b.trim()); b = ""; };
  while (i < html.length) {
    const c = html[i];
    if (c === "$") { const dl = html[i + 1] === "$" ? 2 : 1; mat = !mat; b += html.substr(i, dl); i += dl; continue; }
    if (!mat && c === "<") {
      const k = html.indexOf(">", i); if (k < 0) { b += html.slice(i); break; }
      const tag = html.slice(i, k + 1); i = k + 1;
      if (/^<br\b/i.test(tag)) { if (gl === 0) utnij(); else b += tag; continue; }
      b += tag;
      if (tag[1] === "/") { gl--; if (gl === 0 && /^<\/(p|ol|ul|div|table)>/i.test(tag)) utnij(); }
      else if (!/\/>$/.test(tag) && !/^<(img|hr|input|!)/i.test(tag)) gl++;
      continue;
    }
    b += c; i++;
    if (!mat && gl === 0 && c === "." && /^\s+(?=[A-ZĄĆĘŁŃÓŚŹŻ$<])/.test(html.slice(i, i + 40)) && !SKROT.test(b.slice(-12)) && !/\d\.$/.test(b)) utnij();
  }
  utnij();
  return kroki;
}
function podpowiedzi(li, rozw) {
  const tresc = rozw.querySelector(":scope > div");
  if (!tresc) return;
  // krok z końcowym wynikiem (ostatnie <b>) i wszystko po nim zostaje w rozwiązaniu
  const wszystkie = krokiRozwiazania(tresc.innerHTML);
  const zWynikiem = wszystkie.map(k => /<b\b/i.test(k)).lastIndexOf(true);
  const kroki = wszystkie.slice(0, zWynikiem >= 0 ? zWynikiem : -1);
  if (!kroki.length) return;
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "podpowiedz-przycisk";
  const box = document.createElement("div");
  box.className = "podpowiedz"; box.hidden = true;
  box.innerHTML = kroki.map(k => `<div class="krok" hidden>${k}</div>`).join("");
  let n = 0;
  const opis = () => {
    btn.textContent = n === 0 ? T("💡 Podpowiedź", "💡 Hint")
      : n < kroki.length ? T(`💡 Kolejny krok (${n}/${kroki.length})`, `💡 Next step (${n}/${kroki.length})`)
      : T("💡 Dalej już tylko wynik — dokończ sam", "💡 Only the result is left — finish it yourself");
    btn.disabled = n >= kroki.length;
  };
  btn.onclick = () => { box.hidden = false; box.children[n++].hidden = false; dopasujSzerokie(box); opis(); };
  li.insertBefore(btn, rozw); li.insertBefore(box, rozw);
  opis();
}

// --- Zakrywanie wzorów: przypomnij sobie wzór, zanim go odsłonisz (kliknięcie odsłania) ---
const WZORY_SEL = ":is(.wzor, .twierdzenie, .definicja) .katex-display";
function zakryjWzory(wl) {
  const main = document.querySelector("main"), btn = document.getElementById("zakryj-wzory");
  if (!main) return;
  main.classList.toggle("zakryte", wl);
  if (!wl) main.querySelectorAll(".odkryty").forEach(e => e.classList.remove("odkryty"));
  if (btn) btn.textContent = wl ? T("Pokaż wszystkie wzory", "Show all formulas") : T("Sprawdź pamięć: zakryj wzory", "Test your memory: hide formulas");
}
function przyciskZakrywania() {
  const main = document.querySelector("main");
  if (!main || !main.querySelector(WZORY_SEL)) return;
  const p = document.createElement("p");
  p.className = "zakryj-pasek";
  p.innerHTML = `<button type="button" id="zakryj-wzory"></button> <span>${T("Z nazwy wzoru odtwórz go w głowie lub na kartce, potem kliknij, żeby porównać.", "From its name, recall the formula in your head or on paper, then click to compare.")}</span>`;
  (main.querySelector(".spis") || main.querySelector("p.lead") || main.querySelector("h1")).after(p);
  p.querySelector("button").onclick = () => zakryjWzory(!main.classList.contains("zakryte"));
  main.addEventListener("click", e => {
    if (!main.classList.contains("zakryte")) return;
    const w = e.target.closest(".katex-display");
    if (w && w.matches(WZORY_SEL)) w.classList.add("odkryty");
  });
  zakryjWzory(false);
}

// --- Powtórka: losuje zadanie (najpierw wcześniej nieudane, potem z trudniejszej połowy) i zeruje jego wynik ---
function losujZadanie(plik) {
  const zadania = [...document.querySelectorAll("li.zadanie")];
  if (!zadania.length) return;
  const zle = zadania.filter((_, i) => pamiec.get(`zadanie:${plik}:${i}`) === "0");
  const pula = zle.length ? zle : zadania.slice(Math.floor(zadania.length / 2));
  const li = pula[Math.floor(Math.random() * pula.length)], i = zadania.indexOf(li);
  pamiec.set(`zadanie:${plik}:${i}`, null);
  li.classList.remove("dobrze", "zle");
  const rozw = li.querySelector("details.rozwin"); if (rozw) rozw.open = false;
  const kom = li.querySelector(".komunikat"); if (kom) kom.textContent = "";
  const inp = li.querySelector(".sprawdz input"); if (inp) inp.value = "";
  document.dispatchEvent(new Event("wynik-zadan"));
  zadania.forEach(z => z.classList.toggle("wylosowane", z === li));
  li.scrollIntoView({ behavior: "smooth", block: "center" });
}

// --- Brudnopis przy zadaniu: kartka w kratkę do pisania palcem, rysikiem lub myszą ---
// Kreski zapisane wektorowo w localStorage „brudnopis:<plik>:<nr>”:
// [[x1,y1,x2,y2,...] | {g:1} ...], współrzędne w jednostkach 1/1000 szerokości kartki (skaluje się z ekranem).
function brudnopis(li, przed, klucz) {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "brudnopis-przycisk";
  const ma = () => !!pamiec.get(klucz);
  const opis = () => btn.textContent = (box.hidden ? T("✎ Brudnopis", "✎ Scratchpad") : T("✎ Schowaj brudnopis", "✎ Hide scratchpad")) + (ma() && box.hidden ? T(" (zapisany)", " (saved)") : "");
  const box = document.createElement("div");
  box.className = "brudnopis"; box.hidden = true;
  box.innerHTML = `<div class="narzedzia">
      <button type="button" data-n="pioro" class="wl" title="${T("Pióro", "Pen")}">✎ ${T("pióro", "pen")}</button>
      <button type="button" data-n="gumka" title="${T("Gumka: przeciągnij po kresce", "Eraser: drag over a stroke")}">⌫ ${T("gumka", "eraser")}</button>
      <button type="button" data-n="cofnij" title="${T("Cofnij ostatnią kreskę", "Undo last stroke")}">↶ ${T("cofnij", "undo")}</button>
      <button type="button" data-n="wyczysc" title="${T("Wyczyść kartkę", "Clear the page")}">${T("wyczyść", "clear")}</button>
      <button type="button" data-n="wyzej" title="${T("Dłuższa kartka", "Longer page")}">+ ${T("miejsce", "space")}</button>
      <span class="brudnopis-info" role="status"></span>
    </div><canvas></canvas>`;
  li.insertBefore(btn, przed); li.insertBefore(box, przed);

  const c = box.querySelector("canvas"), ctx = c.getContext("2d");
  let kreski = [], tryb = "pioro", biezaca = null, wys = 0.6; // wysokość = wys · szerokość
  try { const d = JSON.parse(pamiec.get(klucz)); if (d) { kreski = d.k || []; wys = d.h || wys; } } catch (e) {}
  const info = box.querySelector(".brudnopis-info");
  const zapisz = () => {
    const ok = pamiec.set(klucz, kreski.length ? JSON.stringify({ h: wys, k: kreski }) : null);
    info.textContent = ok ? "" : T("Brak miejsca w pamięci przeglądarki — ten rysunek nie zostanie zapisany. Wyczyść stare brudnopisy.", "Browser storage is full — this drawing won't be saved. Clear old scratchpads.");
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
    if (n === "wyczysc" && (!kreski.length || confirm(T("Wyczyścić brudnopis tego zadania?", "Clear the scratchpad for this task?")))) { kreski = []; zapisz(); rysuj(); }
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
  const prefiks = new URL(T("matura/", "en/matura/"), baza).href;
  let okno = document.getElementById("szukaj-okno");
  if (!okno) {
    okno = document.createElement("div");
    okno.id = "szukaj-okno";
    okno.innerHTML = `<div class="szukaj-panel" role="dialog" aria-label="${T("Szukaj", "Search")}">
        <input type="search" placeholder="${T("Szukaj tematu, wzoru, twierdzenia…", "Search topics, formulas, theorems…")}" aria-label="${T("Szukaj", "Search")}">
        <ul class="szukaj-wyniki"></ul><p class="szukaj-pusto">${T("Wpisz np. „Viète”, „styczna”, „pole trójkąta”.", "Try e.g. “Vieta”, “tangent”, “area of a triangle”.")}</p></div>`;
    document.body.appendChild(okno);
    const inp = okno.querySelector("input"), ul = okno.querySelector("ul"), pusto = okno.querySelector(".szukaj-pusto");
    const TYP = EN ? { s: "section", w: "formula", d: "definition", t: "theorem" } : { s: "sekcja", w: "wzór", d: "definicja", t: "twierdzenie" };
    const pokaz = () => {
      const w = szukaj(inp.value);
      pusto.hidden = !!w.length;
      if (inp.value.trim() && !w.length) pusto.textContent = T("Nic nie znaleziono.", "Nothing found.");
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
      const sk = document.createElement("script"); sk.src = new URL(T("assets/indeks.js", "assets/indeks-en.js"), baza).href;
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
  b.id = "szukaj"; b.title = T("Szukaj (/)", "Search (/)"); b.setAttribute("aria-label", T("Szukaj", "Search")); b.textContent = "🔍";
  b.onclick = otworzSzukanie;
  motyw.before(b);
  if (EN) motyw.title = "Toggle theme";

  // Przełącznik języka: ta sama strona w drugiej wersji (en/… ↔ …), z kotwicą
  const korzen = new URL("../", document.querySelector('script[src*="site.js"]').src);
  const jez = document.createElement("a");
  jez.id = "jezyk"; jez.textContent = EN ? "PL" : "EN";
  jez.title = EN ? "Wersja polska" : "English version";
  jez.setAttribute("lang", EN ? "pl" : "en"); jez.setAttribute("hreflang", EN ? "pl" : "en");
  let sciezka = decodeURIComponent(location.pathname).slice(decodeURIComponent(korzen.pathname).length);
  sciezka = EN ? sciezka.replace(/^en(\/|$)/, "") : "en/" + sciezka;
  jez.href = new URL(sciezka, korzen).href + location.hash;
  jez.onclick = () => pamiec.set("jezyk", EN ? "pl" : "en");
  motyw.after(jez);
  document.addEventListener("keydown", e => {
    const okno = document.getElementById("szukaj-okno");
    if (e.key === "Escape" && okno) okno.hidden = true;
    if (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) { e.preventDefault(); otworzSzukanie(); }
  });
});
