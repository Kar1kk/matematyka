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

// --- Wersja angielska (en/…): nazwy po angielsku, klucz = nazwa polska ---
const NAZWY_EN = {
  // poziomy
  "Matura rozszerzona": "Matura, extended level", "Wszystkie działy z podstawy programowej (2024).": "All sections of the 2024 core curriculum.",
  "Olimpiada": "Olympiad", "OM, OdiAGH — techniki i typowe zadania.": "Polish olympiads (OM, OdiAGH): techniques and typical problems.",
  "Studia (I rok)": "University (1st year)", "Analiza, algebra liniowa, macierze.": "Calculus, linear algebra, matrices.",
  // działy
  "Liczby rzeczywiste": "Real numbers", "Wyrażenia algebraiczne": "Algebraic expressions", "Równania i nierówności": "Equations and inequalities",
  "Układy równań": "Systems of equations", "Funkcje": "Functions", "Ciągi": "Sequences", "Trygonometria": "Trigonometry",
  "Planimetria": "Plane geometry", "Geometria analityczna": "Analytic geometry", "Stereometria": "Solid geometry",
  "Kombinatoryka": "Combinatorics", "Prawdopodobieństwo i statystyka": "Probability and statistics",
  "Optymalizacja i rachunek różniczkowy": "Optimization and differential calculus",
  // tematy
  "Przedziały liczbowe": "Intervals", "Potęgi i pierwiastki": "Powers and roots", "Wartość bezwzględna": "Absolute value",
  "Procenty, procent składany, lokaty i kredyty": "Percentages, compound interest, deposits and loans",
  "Logarytmy (z zamianą podstawy)": "Logarithms (with change of base)",
  "Dowody: podzielność i reszty, niewymierność": "Proofs: divisibility and remainders, irrationality",
  "Wzory skróconego mnożenia (także a³ ± b³, aⁿ − bⁿ)": "Special products (also a³ ± b³, aⁿ − bⁿ)",
  "Działania na wielomianach": "Operations on polynomials",
  "Dzielenie wielomianu przez x − a, schemat Hornera": "Dividing a polynomial by x − a, Horner's scheme",
  "Rozkład wielomianu na czynniki, pierwiastki całkowite": "Factoring polynomials, integer roots",
  "Wyrażenia wymierne": "Rational expressions",
  "Symbol Newtona, trójkąt Pascala, dwumian Newtona": "Binomial coefficient, Pascal's triangle, binomial theorem",
  "Równania i nierówności liniowe": "Linear equations and inequalities",
  "Równania i nierówności kwadratowe": "Quadratic equations and inequalities", "Wzory Viète'a": "Vieta's formulas",
  "Równania i nierówności z parametrem": "Equations and inequalities with a parameter",
  "Równania i nierówności wielomianowe": "Polynomial equations and inequalities",
  "Równania dwukwadratowe i sprowadzalne do kwadratowych": "Biquadratic equations and equations reducible to quadratics",
  "Równania i nierówności wymierne": "Rational equations and inequalities",
  "Równania i nierówności z wartością bezwzględną": "Equations and inequalities with absolute value",
  "Układy liniowe i ich interpretacja geometryczna": "Linear systems and their geometric meaning",
  "Zadania tekstowe z układami": "Word problems with systems", "Układy z równaniem kwadratowym": "Systems with a quadratic equation",
  "Pojęcie i własności funkcji (odczyt z wykresu)": "Functions and their properties (reading graphs)",
  "Funkcja liniowa": "Linear function", "Funkcja kwadratowa": "Quadratic function",
  "Proporcjonalność odwrotna: f(x) = a/x": "Inverse proportionality: f(x) = a/x",
  "Funkcja wykładnicza i logarytmiczna": "Exponential and logarithmic functions",
  "Przekształcenia wykresów: f(x−a)+b, −f(x), f(−x)": "Graph transformations: f(x−a)+b, −f(x), f(−x)",
  "Złożenie funkcji": "Function composition", "Dowodzenie monotoniczności funkcji": "Proving that a function is monotonic",
  "Ciągi: wzór ogólny, rekurencja, monotoniczność": "Sequences: general term, recursion, monotonicity",
  "Ciąg arytmetyczny": "Arithmetic sequence", "Ciąg geometryczny": "Geometric sequence",
  "Granica ciągu, twierdzenie o trzech ciągach": "Limit of a sequence, squeeze theorem", "Szereg geometryczny": "Geometric series",
  "Trygonometria w trójkącie prostokątnym": "Trigonometry in a right triangle",
  "Funkcje trygonometryczne kątów 0°–180°, jedynka trygonometryczna": "Trig functions of angles 0°–180°, Pythagorean identity",
  "Miara łukowa i okrąg jednostkowy": "Radians and the unit circle",
  "Wykresy i okresowość funkcji trygonometrycznych": "Graphs and periodicity of trig functions",
  "Wzory redukcyjne": "Reduction formulas", "Wzory na sumę i różnicę kątów, kąt podwojony": "Sum, difference and double-angle formulas",
  "Równania trygonometryczne": "Trigonometric equations",
  "Rozwiązywanie trójkątów: twierdzenia sinusów i cosinusów": "Solving triangles: laws of sines and cosines",
  "Trójkąty: rodzaje, Pitagoras, odcinki w trójkącie prostokątnym": "Triangles: types, Pythagoras, segments in a right triangle",
  "Czworokąty i wielokąty foremne": "Quadrilaterals and regular polygons",
  "Kąty wpisane i środkowe, styczne, łuk i wycinek": "Inscribed and central angles, tangents, arcs and sectors",
  "Twierdzenie Talesa i twierdzenie do niego odwrotne": "Intercept theorem and its converse", "Podobieństwo figur": "Similar figures",
  "Punkty szczególne trójkąta, twierdzenie o dwusiecznej": "Triangle centers, angle bisector theorem",
  "Czworokąty wpisane w okrąg i opisane na okręgu": "Cyclic and tangential quadrilaterals", "Dowody geometryczne": "Geometric proofs",
  "Odległość punktów, równanie prostej": "Distance between points, equation of a line",
  "Wzajemne położenie prostych, prosta prostopadła": "Relative position of lines, perpendicular lines",
  "Równanie okręgu": "Equation of a circle", "Symetrie względem osi i początku układu": "Reflections in the axes and the origin",
  "Wektory": "Vectors", "Prosta i okrąg, dwa okręgi, styczna do okręgu": "A line and a circle, two circles, tangent to a circle",
  "Proste i płaszczyzny w przestrzeni": "Lines and planes in space", "Twierdzenie o trzech prostopadłych": "Three perpendiculars theorem",
  "Graniastosłupy": "Prisms", "Ostrosłupy": "Pyramids", "Walec, stożek, kula": "Cylinder, cone, sphere",
  "Kąty w bryłach: prosta–płaszczyzna, kąt dwuścienny": "Angles in solids: line–plane, dihedral angle", "Bryły podobne": "Similar solids",
  "Przekroje sześcianu i ostrosłupów prawidłowych": "Cross-sections of a cube and regular pyramids",
  "Reguła mnożenia i dodawania": "Multiplication and addition rules",
  "Permutacje, wariacje, kombinacje": "Permutations, variations, combinations",
  "Symbol Newtona w zadaniach kombinatorycznych": "Binomial coefficients in counting problems",
  "Statystyka: średnia, średnia ważona, mediana, dominanta": "Statistics: mean, weighted mean, median, mode",
  "Prawdopodobieństwo klasyczne": "Classical probability",
  "Prawdopodobieństwo warunkowe i wzór Bayesa": "Conditional probability and Bayes' theorem",
  "Prawdopodobieństwo całkowite": "Law of total probability", "Schemat Bernoulliego": "Bernoulli trials",
  "Optymalizacja z funkcją kwadratową": "Optimization with a quadratic function",
  "Granica funkcji (w tym jednostronna)": "Limit of a function (including one-sided)",
  "Ciągłość, własność Darboux": "Continuity, intermediate value property",
  "Definicja i interpretacja pochodnej": "Derivative: definition and meaning",
  "Obliczanie pochodnych (iloczyn, iloraz, złożenie)": "Computing derivatives (product, quotient, chain rule)",
  "Monotoniczność i ekstrema": "Monotonicity and extrema", "Styczna do wykresu funkcji": "Tangent line to a graph",
  "Zadania optymalizacyjne z pochodną": "Optimization problems with derivatives",
  // twierdzenia
  "Istnieje nieskończenie wiele liczb pierwszych": "There are infinitely many primes",
  "Niewymierność √2, log₂5 itp.": "Irrationality of √2, log₂5 etc.",
  "Własności potęg i logarytmów": "Properties of powers and logarithms",
  "Dowód kombinatoryczny: C(n,k) = C(n−1,k−1) + C(n−1,k)": "Combinatorial proof: C(n,k) = C(n−1,k−1) + C(n−1,k)",
  "Dwumian Newtona, wzory na aⁿ ± bⁿ, wniosek (a−b) | (aⁿ−bⁿ)": "Binomial theorem, formulas for aⁿ ± bⁿ, corollary (a−b) | (aⁿ−bⁿ)",
  "Wzory na pierwiastki trójmianu kwadratowego": "Quadratic formula",
  "Wzory na n-ty wyraz i sumę ciągu arytmetycznego i geometrycznego": "n-th term and sum of arithmetic and geometric sequences",
  "Wzór P = ½ab·sin γ, twierdzenie cosinusów i odwrotne do tw. Pitagorasa": "Area = ½ab·sin γ, law of cosines and converse of Pythagoras",
  "Wzory na sinus i cosinus sumy i różnicy kątów": "Sine and cosine of a sum and difference of angles",
  "Twierdzenie sinusów": "Law of sines",
  "Kąt wpisany i środkowy; kąty wpisane oparte na równych łukach": "Inscribed and central angles; inscribed angles on equal arcs",
  "Odcinki w trójkącie prostokątnym (wysokość z kąta prostego)": "Segments in a right triangle (altitude from the right angle)",
  "Twierdzenie o dwusiecznej": "Angle bisector theorem",
  "Symetralne, wysokości i środkowe przecinają się w jednym punkcie": "Perpendicular bisectors, altitudes and medians are concurrent",
  "Czworokąt wpisany w okrąg i opisany na okręgu": "Cyclic and tangential quadrilaterals",
  "Prosta prostopadła do płaszczyzny": "Line perpendicular to a plane",
};
// Na stronach angielskich (<html lang="en">) podmień nazwy; w sw.js i narzędziach node nie ma document.
function nazwyNaAngielski() {
  const tl = o => { for (const k of ["nazwa", "opis"]) if (o[k] && NAZWY_EN[o[k]]) o[k] = NAZWY_EN[o[k]]; };
  POZIOMY.forEach(tl);
  DZIALY_MATURA.forEach(d => { tl(d); d.tematy.forEach(tl); });
  TWIERDZENIA_MATURA.forEach(tl);
}
if (typeof document !== "undefined" && document.documentElement.lang === "en") nazwyNaAngielski();
