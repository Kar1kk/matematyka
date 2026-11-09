// Jedno źródło prawdy o strukturze strony.
// Zgodne z podstawą programową z 2024 r. (Dz.U. 2024 poz. 1019), która obowiązuje na maturze od 2025 r.
// Pola tematu:
//   plik — gotowa strona; bez niego temat pokazuje się jako „w przygotowaniu”.
//   r    — temat wyłącznie z zakresu rozszerzonego (znacznik R).
//   wymaga — tematy, które warto znać wcześniej (strona tematu pokazuje „Zanim zaczniesz”).
//   odsylacz — ten sam plik co w innym dziale; nie liczy się w postępie ani w nawigacji.
// W każdym dziale kolejność to kolejność nauki: najpierw podstawa, potem rozszerzenie.

const POZIOMY = [
  { id: "matura", nazwa: "Matura rozszerzona", opis: "Wszystkie działy z podstawy programowej (2024).", link: "matura/index.html" },
  { id: "olimpiada", nazwa: "Olimpiada", opis: "OM, OdiAGH — techniki i typowe zadania.", link: null },
  { id: "studia", nazwa: "Studia (I rok)", opis: "Analiza, algebra liniowa, macierze.", link: null },
];

const DZIALY_MATURA = [
  { nr: "I", nazwa: "Liczby rzeczywiste", tematy: [
    { nazwa: "Przedziały liczbowe", plik: "przedzialy-liczbowe.html" },
    { nazwa: "Potęgi i pierwiastki", plik: "potegi-pierwiastki.html" },
    { nazwa: "Wartość bezwzględna", plik: "wartosc-bezwzgledna.html", wymaga: ["przedzialy-liczbowe.html"] },
    { nazwa: "Procenty, procent składany, lokaty i kredyty", plik: "procenty.html" },
    { nazwa: "Logarytmy (z zamianą podstawy)", plik: "logarytmy.html", wymaga: ["potegi-pierwiastki.html"] },
    { nazwa: "Dowody: podzielność i reszty, niewymierność", plik: "dowody-liczby.html" } ] },
  { nr: "II", nazwa: "Wyrażenia algebraiczne", tematy: [
    { nazwa: "Wzory skróconego mnożenia (także a³ ± b³, aⁿ − bⁿ)", plik: "wzory-skroconego-mnozenia.html", wymaga: ["potegi-pierwiastki.html"] },
    { nazwa: "Działania na wielomianach", plik: "wielomiany-dzialania.html", wymaga: ["wzory-skroconego-mnozenia.html"] },
    { nazwa: "Dzielenie wielomianu przez x − a, schemat Hornera", r: true, plik: "dzielenie-wielomianow.html", wymaga: ["wielomiany-dzialania.html"] },
    { nazwa: "Rozkład wielomianu na czynniki, pierwiastki całkowite", r: true, plik: "rozklad-wielomianu.html", wymaga: ["dzielenie-wielomianow.html", "wzory-skroconego-mnozenia.html"] },
    { nazwa: "Wyrażenia wymierne", plik: "wyrazenia-wymierne.html", wymaga: ["wzory-skroconego-mnozenia.html"] },
    { nazwa: "Symbol Newtona, trójkąt Pascala, dwumian Newtona", r: true, plik: "symbol-newtona.html", wymaga: ["wzory-skroconego-mnozenia.html"] } ] },
  { nr: "III", nazwa: "Równania i nierówności", tematy: [
    { nazwa: "Równania i nierówności liniowe", plik: "rownania-liniowe.html", wymaga: ["przedzialy-liczbowe.html"] },
    { nazwa: "Równania i nierówności kwadratowe", plik: "rownania-kwadratowe.html", wymaga: ["rownania-liniowe.html", "wzory-skroconego-mnozenia.html"] },
    { nazwa: "Wzory Viète'a", r: true, plik: "wzory-viete.html", wymaga: ["rownania-kwadratowe.html"] },
    { nazwa: "Równania i nierówności z parametrem", r: true, plik: "parametr.html", wymaga: ["wzory-viete.html"] },
    { nazwa: "Równania i nierówności wielomianowe", r: true, plik: "rownania-wielomianowe.html", wymaga: ["rozklad-wielomianu.html", "rownania-kwadratowe.html"] },
    { nazwa: "Równania dwukwadratowe i sprowadzalne do kwadratowych", r: true, plik: "rownania-dwukwadratowe.html", wymaga: ["rownania-kwadratowe.html"] },
    { nazwa: "Równania i nierówności wymierne", r: true, plik: "rownania-wymierne.html", wymaga: ["wyrazenia-wymierne.html", "rownania-wielomianowe.html"] },
    { nazwa: "Równania i nierówności z wartością bezwzględną", r: true, plik: "wartosc-bezwzgledna-rownania.html", wymaga: ["wartosc-bezwzgledna.html", "rownania-kwadratowe.html"] } ] },
  { nr: "IV", nazwa: "Układy równań", tematy: [
    { nazwa: "Układy liniowe i ich interpretacja geometryczna", plik: "uklady-liniowe.html", wymaga: ["rownania-liniowe.html"] },
    { nazwa: "Zadania tekstowe z układami", plik: "uklady-zadania-tekstowe.html", wymaga: ["uklady-liniowe.html"] },
    { nazwa: "Układy z równaniem kwadratowym", r: true, plik: "uklady-kwadratowe.html", wymaga: ["uklady-liniowe.html", "rownania-kwadratowe.html"] } ] },
  { nr: "V", nazwa: "Funkcje", tematy: [
    { nazwa: "Pojęcie i własności funkcji (odczyt z wykresu)", plik: "wlasnosci-funkcji.html", wymaga: ["przedzialy-liczbowe.html"] },
    { nazwa: "Funkcja liniowa", plik: "funkcja-liniowa.html", wymaga: ["wlasnosci-funkcji.html", "rownania-liniowe.html"] },
    { nazwa: "Funkcja kwadratowa", plik: "funkcja-kwadratowa.html", wymaga: ["funkcja-liniowa.html", "rownania-kwadratowe.html"] },
    { nazwa: "Proporcjonalność odwrotna: f(x) = a/x", plik: "proporcjonalnosc-odwrotna.html", wymaga: ["wlasnosci-funkcji.html"] },
    { nazwa: "Funkcja wykładnicza i logarytmiczna", plik: "funkcja-wykladnicza-logarytmiczna.html", wymaga: ["logarytmy.html", "wlasnosci-funkcji.html"] },
    { nazwa: "Przekształcenia wykresów: f(x−a)+b, −f(x), f(−x)", plik: "przeksztalcenia-wykresow.html", wymaga: ["funkcja-kwadratowa.html"] },
    { nazwa: "Złożenie funkcji", r: true, plik: "zlozenie-funkcji.html", wymaga: ["wlasnosci-funkcji.html"] },
    { nazwa: "Dowodzenie monotoniczności funkcji", r: true, plik: "monotonicznosc-dowody.html", wymaga: ["wlasnosci-funkcji.html", "wyrazenia-wymierne.html"] } ] },
  { nr: "VI", nazwa: "Ciągi", tematy: [
    { nazwa: "Ciągi: wzór ogólny, rekurencja, monotoniczność", plik: "ciagi-wlasnosci.html", wymaga: ["wlasnosci-funkcji.html"] },
    { nazwa: "Ciąg arytmetyczny", plik: "ciag-arytmetyczny.html", wymaga: ["ciagi-wlasnosci.html"] },
    { nazwa: "Ciąg geometryczny", plik: "ciag-geometryczny.html", wymaga: ["ciagi-wlasnosci.html"] },
    { nazwa: "Granica ciągu, twierdzenie o trzech ciągach", r: true, plik: "granica-ciagu.html", wymaga: ["ciagi-wlasnosci.html"] },
    { nazwa: "Szereg geometryczny", r: true, plik: "szereg-geometryczny.html", wymaga: ["ciag-geometryczny.html", "granica-ciagu.html"] } ] },
  { nr: "VII", nazwa: "Trygonometria", tematy: [
    { nazwa: "Trygonometria w trójkącie prostokątnym", plik: "trygonometria-trojkat-prostokatny.html", wymaga: ["trojkaty.html"] },
    { nazwa: "Funkcje trygonometryczne kątów 0°–180°, jedynka trygonometryczna", plik: "trygonometria-0-180.html", wymaga: ["trygonometria-trojkat-prostokatny.html"] },
    { nazwa: "Miara łukowa i okrąg jednostkowy", r: true, plik: "miara-lukowa.html", wymaga: ["trygonometria-0-180.html"] },
    { nazwa: "Wykresy i okresowość funkcji trygonometrycznych", r: true, plik: "wykresy-trygonometryczne.html", wymaga: ["miara-lukowa.html", "przeksztalcenia-wykresow.html"] },
    { nazwa: "Wzory redukcyjne", r: true, plik: "wzory-redukcyjne.html", wymaga: ["miara-lukowa.html"] },
    { nazwa: "Wzory na sumę i różnicę kątów, kąt podwojony", r: true, plik: "wzory-sumy-katow.html", wymaga: ["wzory-redukcyjne.html"] },
    { nazwa: "Równania trygonometryczne", r: true, plik: "rownania-trygonometryczne.html", wymaga: ["wykresy-trygonometryczne.html", "wzory-sumy-katow.html"] },
    { nazwa: "Rozwiązywanie trójkątów: twierdzenia sinusów i cosinusów", plik: "rozwiazywanie-trojkatow.html", wymaga: ["trygonometria-0-180.html"] } ] },
  { nr: "VIII", nazwa: "Planimetria", tematy: [
    { nazwa: "Trójkąty: rodzaje, Pitagoras, odcinki w trójkącie prostokątnym", plik: "trojkaty.html" },
    { nazwa: "Czworokąty i wielokąty foremne", plik: "czworokaty.html", wymaga: ["trojkaty.html"] },
    { nazwa: "Kąty wpisane i środkowe, styczne, łuk i wycinek", plik: "katy-w-okregu.html", wymaga: ["trojkaty.html"] },
    { nazwa: "Twierdzenie Talesa i twierdzenie do niego odwrotne", plik: "tales.html", wymaga: ["trojkaty.html"] },
    { nazwa: "Podobieństwo figur", plik: "podobienstwo.html", wymaga: ["tales.html"] },
    { nazwa: "Punkty szczególne trójkąta, twierdzenie o dwusiecznej", plik: "punkty-szczegolne.html", wymaga: ["trojkaty.html", "katy-w-okregu.html"] },
    { nazwa: "Czworokąty wpisane w okrąg i opisane na okręgu", r: true, plik: "czworokaty-okrag.html", wymaga: ["katy-w-okregu.html", "czworokaty.html"] },
    { nazwa: "Dowody geometryczne", plik: "dowody-geometryczne.html", wymaga: ["podobienstwo.html", "katy-w-okregu.html"] } ] },
  { nr: "IX", nazwa: "Geometria analityczna", tematy: [
    { nazwa: "Odległość punktów, równanie prostej", plik: "prosta.html", wymaga: ["funkcja-liniowa.html"] },
    { nazwa: "Wzajemne położenie prostych, prosta prostopadła", plik: "polozenie-prostych.html", wymaga: ["prosta.html"] },
    { nazwa: "Równanie okręgu", plik: "okrag.html", wymaga: ["prosta.html"] },
    { nazwa: "Symetrie względem osi i początku układu", plik: "symetrie.html", wymaga: ["prosta.html"] },
    { nazwa: "Wektory", r: true, plik: "wektory.html", wymaga: ["prosta.html"] },
    { nazwa: "Prosta i okrąg, dwa okręgi, styczna do okręgu", r: true, plik: "prosta-i-okrag.html", wymaga: ["okrag.html", "polozenie-prostych.html"] } ] },
  { nr: "X", nazwa: "Stereometria", tematy: [
    { nazwa: "Proste i płaszczyzny w przestrzeni", plik: "proste-plaszczyzny.html" },
    { nazwa: "Twierdzenie o trzech prostopadłych", r: true, plik: "trzy-prostopadle.html", wymaga: ["proste-plaszczyzny.html"] },
    { nazwa: "Graniastosłupy", plik: "graniastoslupy.html", wymaga: ["trojkaty.html"] },
    { nazwa: "Ostrosłupy", plik: "ostroslupy.html", wymaga: ["graniastoslupy.html"] },
    { nazwa: "Walec, stożek, kula", plik: "bryly-obrotowe.html", wymaga: ["trojkaty.html"] },
    { nazwa: "Kąty w bryłach: prosta–płaszczyzna, kąt dwuścienny", plik: "katy-w-brylach.html", wymaga: ["trzy-prostopadle.html", "trygonometria-trojkat-prostokatny.html"] },
    { nazwa: "Bryły podobne", plik: "bryly-podobne.html", wymaga: ["podobienstwo.html"] },
    { nazwa: "Przekroje sześcianu i ostrosłupów prawidłowych", r: true, plik: "przekroje.html", wymaga: ["graniastoslupy.html", "ostroslupy.html"] } ] },
  { nr: "XI", nazwa: "Kombinatoryka", tematy: [
    { nazwa: "Reguła mnożenia i dodawania", plik: "regula-mnozenia.html" },
    { nazwa: "Permutacje, wariacje, kombinacje", r: true, plik: "permutacje-kombinacje.html", wymaga: ["regula-mnozenia.html"] },
    { nazwa: "Symbol Newtona w zadaniach kombinatorycznych", r: true, plik: "symbol-newtona.html", odsylacz: true } ] },
  { nr: "XII", nazwa: "Prawdopodobieństwo i statystyka", tematy: [
    { nazwa: "Statystyka: średnia, średnia ważona, mediana, dominanta", plik: "statystyka.html" },
    { nazwa: "Prawdopodobieństwo klasyczne", plik: "prawdopodobienstwo-klasyczne.html", wymaga: ["regula-mnozenia.html"] },
    { nazwa: "Prawdopodobieństwo warunkowe i wzór Bayesa", r: true, plik: "prawdopodobienstwo-warunkowe.html", wymaga: ["prawdopodobienstwo-klasyczne.html"] },
    { nazwa: "Prawdopodobieństwo całkowite", r: true, plik: "prawdopodobienstwo-calkowite.html", wymaga: ["prawdopodobienstwo-warunkowe.html"] },
    { nazwa: "Schemat Bernoulliego", r: true, plik: "schemat-bernoulliego.html", wymaga: ["prawdopodobienstwo-klasyczne.html", "symbol-newtona.html"] } ] },
  { nr: "XIII", nazwa: "Optymalizacja i rachunek różniczkowy", tematy: [
    { nazwa: "Optymalizacja z funkcją kwadratową", plik: "optymalizacja-kwadratowa.html", wymaga: ["funkcja-kwadratowa.html"] },
    { nazwa: "Granica funkcji (w tym jednostronna)", r: true, plik: "granica-funkcji.html", wymaga: ["granica-ciagu.html"] },
    { nazwa: "Ciągłość, własność Darboux", r: true, plik: "ciaglosc-darboux.html", wymaga: ["granica-funkcji.html"] },
    { nazwa: "Definicja i interpretacja pochodnej", r: true, plik: "pochodna-definicja.html", wymaga: ["granica-funkcji.html"] },
    { nazwa: "Obliczanie pochodnych (iloczyn, iloraz, złożenie)", r: true, plik: "pochodna-obliczanie.html", wymaga: ["pochodna-definicja.html"] },
    { nazwa: "Monotoniczność i ekstrema", r: true, plik: "monotonicznosc-ekstrema.html", wymaga: ["pochodna-obliczanie.html"] },
    { nazwa: "Styczna do wykresu funkcji", r: true, plik: "styczna.html", wymaga: ["pochodna-obliczanie.html", "prosta.html"] },
    { nazwa: "Zadania optymalizacyjne z pochodną", r: true, plik: "optymalizacja-pochodna.html", wymaga: ["monotonicznosc-ekstrema.html"] } ] },
];

// Twierdzenia, których dowody wymienia podstawa programowa (warunki realizacji).
const TWIERDZENIA_MATURA = [
  { dzial: "I", nazwa: "Istnieje nieskończenie wiele liczb pierwszych", plik: "dowody-liczby.html" },
  { dzial: "I", nazwa: "Niewymierność √2, log₂5 itp.", plik: "dowody-liczby.html" },
  { dzial: "I", nazwa: "Własności potęg i logarytmów", plik: "logarytmy.html" },
  { dzial: "II", nazwa: "Dowód kombinatoryczny: C(n,k) = C(n−1,k−1) + C(n−1,k)", r: true, plik: "symbol-newtona.html" },
  { dzial: "II", nazwa: "Dwumian Newtona, wzory na aⁿ ± bⁿ, wniosek (a−b) | (aⁿ−bⁿ)", r: true, plik: "symbol-newtona.html" },
  { dzial: "II", nazwa: "Dzielenie wielomianu przez x − a, schemat Hornera", r: true, plik: "dzielenie-wielomianow.html" },
  { dzial: "III", nazwa: "Wzory na pierwiastki trójmianu kwadratowego", plik: "funkcja-kwadratowa.html" },
  { dzial: "III", nazwa: "Wzory Viète'a", r: true, plik: "wzory-viete.html" },
  { dzial: "VI", nazwa: "Wzory na n-ty wyraz i sumę ciągu arytmetycznego i geometrycznego", plik: "ciag-arytmetyczny.html" },
  { dzial: "VII", nazwa: "Wzór P = ½ab·sin γ, twierdzenie cosinusów i odwrotne do tw. Pitagorasa", plik: "rozwiazywanie-trojkatow.html" },
  { dzial: "VII", nazwa: "Wzory na sinus i cosinus sumy i różnicy kątów", r: true, plik: "wzory-sumy-katow.html" },
  { dzial: "VII", nazwa: "Twierdzenie sinusów", r: true, plik: "rozwiazywanie-trojkatow.html" },
  { dzial: "VIII", nazwa: "Kąt wpisany i środkowy; kąty wpisane oparte na równych łukach", plik: "katy-w-okregu.html" },
  { dzial: "VIII", nazwa: "Odcinki w trójkącie prostokątnym (wysokość z kąta prostego)", plik: "trojkaty.html" },
  { dzial: "VIII", nazwa: "Twierdzenie o dwusiecznej", plik: "punkty-szczegolne.html" },
  { dzial: "VIII", nazwa: "Symetralne, wysokości i środkowe przecinają się w jednym punkcie", r: true, plik: "punkty-szczegolne.html" },
  { dzial: "VIII", nazwa: "Czworokąt wpisany w okrąg i opisany na okręgu", r: true, plik: "czworokaty-okrag.html" },
  { dzial: "X", nazwa: "Prosta prostopadła do płaszczyzny", r: true, plik: "trzy-prostopadle.html" },
  { dzial: "X", nazwa: "Twierdzenie o trzech prostopadłych", r: true, plik: "trzy-prostopadle.html" },
];
