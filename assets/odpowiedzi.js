// Ocena odpowiedzi w trybie „sprawdź się” (używa site.js; testuje tools/sprawdz-odp.mjs).
//
// Klucz odpowiedzi w HTML: <li class="zadanie" data-odp="…" data-odp-opis="…">
//   data-odp = liczby rozdzielone średnikiem (kolejność dowolna), np. "45pi; 48pi", "2; 1/2", "2sqrt(13)"
//            albo "przedzial: (-oo; -1) u (2; oo)" / "przedzial: <1; 3)" (zbiór jako suma przedziałów, pusty: "{}")
//   data-odp-opis (opcjonalnie) = podpowiedź, co wpisać, np. "V; P_c" albo "rozwiązania x".
// Wyrażenia: + − * / ^, nawiasy, sqrt(…) lub √, pi lub π, przecinek dziesiętny, mnożenie domyślne (2pi, 3sqrt(2)).
// Zbiory liczbowe w przedziałach: oo / ∞ / inf; nawiasy domknięte < > ⟨ ⟩ [ ]; suma: u, U, ∪.

(function (glob) {
  // --- kalkulator ---
  function oblicz(s) {
    s = String(s).toLowerCase().replace(/\s+/g, "").replace(/−/g, "-").replace(/·|×/g, "*").replace(/:/g, "/")
      .replace(/π/g, "pi").replace(/∛/g, "cbrt").replace(/√/g, "sqrt").replace(/,/g, ".");
    let i = 0;
    const blad = () => { throw new Error("Nie rozumiem: " + s); };
    const znak = () => s[i];
    function suma() {
      let v = iloczyn();
      while (znak() === "+" || znak() === "-") { const o = s[i++]; const w = iloczyn(); v = o === "+" ? v + w : v - w; }
      return v;
    }
    function iloczyn() {
      let v = potega();
      for (;;) {
        if (znak() === "*") { i++; v *= potega(); }
        else if (znak() === "/") { i++; v /= potega(); }
        else if (znak() && /[0-9.(psc]/.test(znak())) v *= potega(); // mnożenie domyślne
        else return v;
      }
    }
    function potega() {
      if (znak() === "-") { i++; return -potega(); }
      if (znak() === "+") { i++; return potega(); }
      const b = atom();
      if (znak() === "^") { i++; return Math.pow(b, potega()); }
      return b;
    }
    function atom() {
      const c = znak();
      if (c === "(") { i++; const v = suma(); if (s[i++] !== ")") blad(); return v; }
      if (s.startsWith("pi", i)) { i += 2; return Math.PI; }
      if (s.startsWith("cbrt", i)) { i += 4; return Math.cbrt(atom()); }
      if (s.startsWith("sqrt", i)) {
        i += 4;
        if (znak() === "(") return Math.sqrt(atom());
        const m = s.slice(i).match(/^\d+(\.\d+)?/); if (!m) blad(); i += m[0].length; return Math.sqrt(+m[0]);
      }
      const m = s.slice(i).match(/^(\d+\.?\d*|\.\d+)/);
      if (!m) blad();
      i += m[0].length; return +m[0];
    }
    if (!s) blad();
    const v = suma();
    if (i < s.length || !isFinite(v)) blad();
    return v;
  }

  // --- przedziały ---
  // "(-oo; -1) u <2; 3>" → [{a, b, la, pb}] (la/pb = domknięte z lewej/prawej)
  function przedzialy(s) {
    s = String(s).replace(/\s+/g, "").replace(/⟨/g, "<").replace(/⟩/g, ">").replace(/\[/g, "<").replace(/\]/g, ">")
      .replace(/∞|inf(ty)?/gi, "oo").replace(/∪|U/g, "u").replace(/−/g, "-");
    if (s === "{}" || s === "∅" || s === "0") return [];
    const czesci = s.split("u").filter(Boolean);
    return czesci.map(c => {
      const m = c.match(/^([(<])(.*)[;,|](.*)([)>])$/);
      // przecinek dziesiętny vs separator: przy dwóch przecinkach separatorem jest średnik albo środkowy przecinek
      let a, b;
      if (!m) throw new Error("Zły zapis przedziału: " + c);
      const srodek = c.slice(1, -1);
      const sep = srodek.includes(";") ? ";" : ",";
      const k = srodek.split(sep);
      if (k.length !== 2) throw new Error("Zły zapis przedziału: " + c);
      const kon = t => t === "-oo" ? -Infinity : t === "+oo" || t === "oo" ? Infinity : oblicz(t);
      a = kon(k[0]); b = kon(k[1]);
      return { a, b, la: c[0] === "<", pb: c[c.length - 1] === ">" };
    }).sort((x, y) => x.a - y.a);
  }
  const blisko = (x, y) => x === y || Math.abs(x - y) <= 1e-6 * Math.max(1, Math.abs(y));
  function rowneZbiory(p, q) {
    if (p.length !== q.length) return false;
    return p.every((x, j) => blisko(x.a, q[j].a) && blisko(x.b, q[j].b)
      && (x.a === -Infinity || x.la === q[j].la) && (x.b === Infinity || x.pb === q[j].pb));
  }

  // --- liczby ---
  const czesci = s => String(s).split(/;|\blub\b|\bi\b/).map(t => t.replace(/^[^=]*=/, "").trim()).filter(Boolean);
  const liczby = s => czesci(s).map(oblicz);
  // Klucz zapisany jako ułamek dziesiętny z ≥ 2 miejscami (np. 1066.19) to wynik przybliżony:
  // uznaj też inne rozsądne zaokrąglenie (różnica do 0,1% wartości, min. 0,05 — np. 8,4 dla 8,39).
  const tolerancje = s => czesci(s).map(t => {
    const m = t.replace(/,/g, ".").match(/^-?\d+\.(\d{2,})$/);
    return m ? (v => Math.max(0.051, 0.001 * Math.abs(v))) : null;
  });
  // Uczeń wpisał przybliżenie dziesiętne (np. 114,6 dla 360/π, 1,41 dla √2): uznaj je, gdy ma
  // co najmniej 3 cyfry znaczące i jest poprawnie zaokrąglone (różnica ≤ pół jednostki ostatniej cyfry).
  // „0,3” dla 1/3 (1 cyfra znacząca) nie przejdzie.
  const przyblizenia = s => czesci(s).map(t => {
    const m = t.replace(/\s/g, "").replace(/,/g, ".").replace(/−/g, "-").match(/^-?(\d+)\.(\d+)$/);
    if (!m) return null;
    const znaczace = (m[1] + m[2]).replace(/^0+/, "").length;
    return znaczace >= 3 ? 0.5 * 10 ** -m[2].length : null;
  });
  function rowneLiczby(odp, klucz, tol = [], przybl = []) {
    if (odp.length !== klucz.length) return false;
    const zostalo = klucz.map((k, j) => ({ k, t: tol[j] }));
    const pasuje = (v, { k, t }, h) => blisko(v, k) || (t && Math.abs(v - k) <= t(k) + 1e-12)
      || (h && Math.abs(v - k) <= h * (1 + 1e-9));
    return odp.every((v, i) => { const j = zostalo.findIndex(z => pasuje(v, z, przybl[i])); if (j < 0) return false; zostalo.splice(j, 1); return true; });
  }

  // Ocena: zwraca { ok, komunikat }
  function ocenOdpowiedz(wpis, klucz) {
    klucz = klucz.trim();
    try {
      if (/^przedzial:/i.test(klucz)) {
        const ok = rowneZbiory(przedzialy(wpis), przedzialy(klucz.replace(/^przedzial:/i, "")));
        return { ok, komunikat: ok ? "" : "Sprawdź końce i nawiasy." };
      }
      const k = liczby(klucz), o = liczby(wpis);
      if (o.length !== k.length) return { ok: false, komunikat: `Oczekuję ${k.length === 1 ? "jednej wartości" : k.length + " wartości (rozdziel średnikiem)"}.` };
      return { ok: rowneLiczby(o, k, tolerancje(klucz), przyblizenia(wpis)), komunikat: "" };
    } catch (e) {
      return { ok: false, blad: true, komunikat: e.message };
    }
  }
  // Czy klucz jest poprawny składniowo (do kontroli w tools/)
  function poprawnyKlucz(klucz) {
    if (/^przedzial:/i.test(klucz)) { przedzialy(klucz.replace(/^przedzial:/i, "")); return true; }
    return liczby(klucz).length > 0;
  }

  const api = { oblicz, przedzialy, ocenOdpowiedz, poprawnyKlucz };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else Object.assign(glob, api);
})(typeof window !== "undefined" ? window : globalThis);
