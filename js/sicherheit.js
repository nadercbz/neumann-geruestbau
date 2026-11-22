/* Sicherheit und Qualität: Vorher Nachher Regler, Sicherheits Check mit Punkten am Gerüst, Zähler */
(function () {
'use strict';
var $ = function (s) { return document.querySelector(s); };

/* ---------- Vorher / Nachher ---------- */
var range = $('#ba-range'), clip = $('#ba-clip'), bar = $('#ba-bar');
function setBA(v) { clip.style.clipPath = 'inset(0 0 0 ' + v + '%)'; bar.style.left = v + '%'; }
range.addEventListener('input', function () { setBA(range.value); });
setBA(50);
// kleiner Hinweis beim ersten Sichtbarwerden: Regler wackelt einmal
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
  var done = false; new IntersectionObserver(function (es, o) {
    if (done || !es[0].isIntersecting) return; done = true; o.disconnect(); var t0 = performance.now();
    (function an(t) { var k = (t - t0) / 1600; if (k > 1) { setBA(50); range.value = 50; return; } var v = 50 + Math.sin(k * Math.PI * 2) * 22 * (1 - k); setBA(v); requestAnimationFrame(an); })(t0);
  }, { threshold: 0.5 }).observe($('#ba'));
}
document.querySelectorAll('.ba__modes .chip').forEach(function (c) {
  c.addEventListener('click', function () {
    document.querySelectorAll('.ba__modes .chip').forEach(function (x) { x.classList.toggle('is-on', x === c); x.setAttribute('aria-selected', x === c); });
    $('#ba-a').src = c.dataset.a; $('#ba-b').src = c.dataset.b; $('#ba-la').textContent = c.dataset.la; $('#ba-lb').textContent = c.dataset.lb;
    $('#ba-a').alt = 'Haus: ' + c.dataset.la; $('#ba-b').alt = 'Haus: ' + c.dataset.lb;
  });
});

/* ---------- Sicherheits Check ---------- */
var SPOTS = [
  { x: 84, y: 22, t: 'Seitenschutz', d: 'Geländer in 1,0 m und Zwischenholm in 0,5 m Höhe an jeder Arbeitsebene. Dazu ein Stirnseitenschutz am Ende des Gerüsts.' },
  { x: 46, y: 45.5, t: 'Bordbrett', d: 'Rot weiße Fußleiste am Belag, mindestens 15 cm hoch. Kein Werkzeug und kein Material fällt nach unten.' },
  { x: 78.5, y: 25, t: 'Belag lückenlos', d: 'Die Beläge liegen fugenlos und gesichert auf. Keine offenen Stellen, kein Kippen, kein Abheben bei Wind.' },
  { x: 59, y: 38, t: 'Verankerung', d: 'Das Gerüst ist in festem Raster in der Fassade verankert. Die Anker nehmen Wind und Zug auf, die Dübel werden geprüft.' },
  { x: 31.5, y: 63, t: 'Aussteifung', d: 'Diagonalen in festen Abständen halten das Gerüst seitlich stabil, Lage für Lage.' },
  { x: 38, y: 55, t: 'Sicherer Aufstieg', d: 'Innenliegende Leitern mit Durchstiegsklappe oder ein Treppenturm. Niemand klettert außen am Gerüst.' },
  { x: 43.5, y: 91, t: 'Standfestigkeit', d: 'Fußspindeln mit Fußplatten auf tragfähigem Untergrund, bei Bedarf mit Lastverteilung. Höhen werden exakt ausgeglichen.' },
  { x: 53.5, y: 80, t: 'Freier Eingang', d: 'Hauseingang und Gehweg bleiben nutzbar. Wo nötig sichern wir den Durchgang mit Schutzdach oder Netz.' },
  { x: 28, y: 88, t: 'Prüfung und Kennzeichnung', d: 'Vor der Freigabe wird das Gerüst geprüft und am Zugang gekennzeichnet: Lastklasse, Breitenklasse, Ersteller und Datum der Prüfung.' },
];
var hs = $('#hs'), list = $('#hs-list'), card = $('#hs-card');
hs.insertAdjacentHTML('beforeend', SPOTS.map(function (s, i) {
  return '<button type="button" class="hs" data-i="' + i + '" style="left:' + s.x + '%;top:' + s.y + '%" aria-label="' + s.t + '"><span>' + (i + 1) + '</span></button>';
}).join(''));
list.innerHTML = SPOTS.map(function (s, i) { return '<li><button type="button" data-i="' + i + '"><span class="mono">' + String(i + 1).padStart(2, '0') + '</span>' + s.t + '</button></li>'; }).join('');
var seen = {};
function show(i) {
  var s = SPOTS[i]; seen[i] = 1;
  document.querySelectorAll('[data-i]').forEach(function (b) { b.classList.toggle('is-on', +b.dataset.i === i); if (seen[+b.dataset.i]) b.classList.add('is-seen'); });
  card.innerHTML = '<p class="mono">Punkt ' + (i + 1) + ' von ' + SPOTS.length + ' · ' + Object.keys(seen).length + ' angesehen</p><h3>' + s.t + '</h3><p>' + s.d + '</p>' +
    (Object.keys(seen).length === SPOTS.length ? '<p class="check__done">Alle neun Punkte geprüft. So sieht ein sicheres Gerüst aus.</p>' : '');
}
document.querySelector('.scheck').addEventListener('click', function (e) { var b = e.target.closest('[data-i]'); if (b) show(+b.dataset.i); });
show(0);

/* ---------- Zähler ---------- */
var counted = false, stats = $('#stats');
function count() {
  if (counted) return; counted = true;
  stats.querySelectorAll('[data-count]').forEach(function (el) {
    var end = +el.dataset.count, plain = el.dataset.plain, t0 = performance.now(), from = plain ? end - 30 : 0;
    (function tick(t) { var k = Math.min(1, (t - t0) / 1400), e = 1 - Math.pow(1 - k, 3); el.textContent = Math.round(from + (end - from) * e); if (k < 1) requestAnimationFrame(tick); })(t0);
  });
}
if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { if (es[0].isIntersecting) count(); }, { threshold: 0.4 }).observe(stats); else count();
})();
