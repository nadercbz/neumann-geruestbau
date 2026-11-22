/* Ihr Projekt: Gerüst Rechner, Foto Vorschau (vier Eckpunkte, perspektivisch) und Baustellen Karte Berlin.
   Alles läuft im Browser, kein Server, Fotos verlassen das Gerät nicht. */
(function () {
'use strict';
var $ = function (s, r) { return (r || document).querySelector(s); };
var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
var fmt = function (n, d) { return n.toLocaleString('de-DE', { maximumFractionDigits: d || 0, minimumFractionDigits: d || 0 }); };
var BW = 2.57, LH = 2.0, MAIL = 'info@geruestbau-neumann.de';

/* =================== 1) Gerüst Rechner =================== */
var R = { art: $('#r-art'), len: $('#r-len'), hgt: $('#r-hgt'), use: $('#r-use'), wk: $('#r-wk'), out: $('#r-out'), svg: $('#r-svg'), mail: $('#r-mail') };
var NUTZ = { maler: { lk: 3, b: 0.73, kg: 18, t: 'Maler, Reinigung, leichte Arbeiten' }, putz: { lk: 4, b: 1.09, kg: 22, t: 'Putz, Dämmung, Fenster' }, maurer: { lk: 5, b: 1.09, kg: 25, t: 'Mauerwerk, Naturstein, schwere Lasten' } };
function extras() { return Array.prototype.slice.call(document.querySelectorAll('[name=r-x]:checked')).map(function (c) { return c.value; }); }
function calc() {
  var L = +R.len.value, H = +R.hgt.value, n = NUTZ[R.use.value], wk = +R.wk.value, ex = extras();
  $('#r-len-v').textContent = fmt(L) + ' m'; $('#r-hgt-v').textContent = fmt(H) + ' m'; $('#r-wk-v').textContent = wk + (wk === 1 ? ' Woche' : ' Wochen');
  var felder = Math.ceil(L / BW), lagen = Math.ceil(H / LH), flaeche = felder * BW * (lagen * LH + 1.0);
  var anker = Math.ceil((felder + 1) / 2) * Math.max(1, Math.floor(lagen / 2));
  var tonnen = flaeche * n.kg / 1000 * (ex.indexOf('netz') >= 0 ? 1.04 : 1) + (ex.indexOf('turm') >= 0 ? lagen * 0.35 : 0) + (ex.indexOf('dach') >= 0 ? felder * 0.12 : 0);
  var lkw = Math.max(1, Math.ceil(tonnen / 10)), tage = Math.max(1, Math.round(flaeche / 220 * 2) / 2);
  R.out.innerHTML = [
    ['Gerüstfläche', fmt(flaeche) + ' m²', 'Länge × (Höhe + 1 m Seitenschutz)'],
    ['Felder × Lagen', felder + ' × ' + lagen, 'Feld 2,57 m, Lage 2,0 m'],
    ['Lastklasse', 'LK ' + n.lk + ' · ' + fmt(n.b, 2).replace(',00', '') + ' m', n.t],
    ['Verankerungen', 'ca. ' + anker, 'alle 2 Felder, jede 2. Lage'],
    ['Material', 'ca. ' + fmt(tonnen, 1) + ' t', 'entspricht etwa ' + lkw + (lkw === 1 ? ' LKW Ladung' : ' LKW Ladungen')],
    ['Aufbau', 'ca. ' + fmt(tage, 1) + (tage === 1 ? ' Tag' : ' Tage'), 'mit einer Kolonne, Richtwert'],
  ].map(function (r) { return '<div><dt class="mono">' + r[0] + '</dt><dd>' + r[1] + '</dd><small>' + r[2] + '</small></div>'; }).join('');
  drawElevation(felder, lagen, ex);
  var body = 'Guten Tag,%0D%0A%0D%0Aich interessiere mich für ein Gerüst:%0D%0A' +
    encodeURIComponent('- Art: ' + R.art.options[R.art.selectedIndex].text + '\n- Fassadenlänge: ' + L + ' m\n- Höhe: ' + H + ' m\n- Nutzung: ' + n.t + ' (LK ' + n.lk + ')\n- Standzeit: ' + wk + ' Wochen\n- Extras: ' + (ex.length ? ex.map(function (e) { return { netz: 'Netz/Plane', dach: 'Schutzdach Gehweg', turm: 'Treppenturm', aufzug: 'Bauaufzug' }[e]; }).join(', ') : 'keine') + '\n- Gerüstfläche laut Rechner: ca. ' + fmt(flaeche) + ' m²\n\nAdresse der Baustelle:\nWunschtermin:\n');
  R.mail.href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Anfrage Gerüst, ca. ' + fmt(flaeche) + ' m²') + '&body=' + body;
}
function drawElevation(felder, lagen, ex) {
  var showF = Math.min(felder, 24), w = 600, h = 300, pad = 18;
  var s = Math.min((w - 2 * pad) / (showF * BW), (h - 2 * pad) / (lagen * LH + 1.6));
  var x0 = (w - showF * BW * s) / 2, yb = h - pad, out = [];
  out.push('<rect x="' + (x0 - 6) + '" y="' + (yb - (lagen * LH + 1.4) * s) + '" width="' + (showF * BW * s + 12) + '" height="' + ((lagen * LH + 1.4) * s) + '" fill="rgba(255,255,255,.035)"/>');
  for (var l = 1; l <= lagen; l++) {
    var y = yb - l * LH * s;
    out.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + (x0 + showF * BW * s) + '" y2="' + y + '" class="e-deck"/>');
    out.push('<line x1="' + x0 + '" y1="' + (y - 1.0 * s) + '" x2="' + (x0 + showF * BW * s) + '" y2="' + (y - 1.0 * s) + '" class="e-rail"/>');
    for (var i = 0; i < showF; i += 3) { var up = l % 2; out.push('<line x1="' + (x0 + i * BW * s) + '" y1="' + (up ? y + LH * s : y) + '" x2="' + (x0 + (i + 1) * BW * s) + '" y2="' + (up ? y : y + LH * s) + '" class="e-diag"/>'); }
  }
  for (var j = 0; j <= showF; j++) out.push('<line x1="' + (x0 + j * BW * s) + '" y1="' + yb + '" x2="' + (x0 + j * BW * s) + '" y2="' + (yb - (lagen * LH + 1) * s) + '" class="e-std"/>');
  if (ex.indexOf('netz') >= 0) out.push('<rect x="' + x0 + '" y="' + (yb - (lagen * LH + 1) * s) + '" width="' + showF * BW * s + '" height="' + (lagen * LH + 1) * s + '" class="e-net"/>');
  if (ex.indexOf('turm') >= 0) { var tx = x0 - 1.6 * s; for (var t = 0; t < lagen; t++) out.push('<line x1="' + tx + '" y1="' + (yb - t * LH * s) + '" x2="' + (tx + 1.4 * s) + '" y2="' + (yb - (t + 1) * LH * s) + '" class="e-diag"/>'); out.push('<rect x="' + tx + '" y="' + (yb - lagen * LH * s) + '" width="' + 1.4 * s + '" height="' + lagen * LH * s + '" class="e-tower"/>'); }
  if (ex.indexOf('dach') >= 0) out.push('<line x1="' + (x0 - 0.8 * s) + '" y1="' + (yb - 2.6 * s) + '" x2="' + (x0 + showF * BW * s + 0.8 * s) + '" y2="' + (yb - 2.6 * s) + '" class="e-roof"/>');
  out.push('<line x1="0" y1="' + yb + '" x2="' + w + '" y2="' + yb + '" class="e-ground"/>');
  if (felder > showF) out.push('<text x="' + (w - pad) + '" y="' + (pad + 4) + '" text-anchor="end" class="e-txt">Ausschnitt: ' + showF + ' von ' + felder + ' Feldern</text>');
  R.svg.innerHTML = out.join('');
}
['input', 'change'].forEach(function (ev) { $('#rechner').addEventListener(ev, calc); });
calc();

/* =================== 2) Foto Vorschau =================== */
var F = { wrap: $('#f-stage'), cv: $('#f-canvas'), file: $('#f-file'), w: $('#f-w'), h: $('#f-h'), net: $('#f-net'), dl: $('#f-dl'), hint: $('#f-hint') };
var ctx = F.cv.getContext('2d'), img = null, pts = null, handles = [], example = 'assets/seq/alt_d.webp';
var EX_PTS = [[0.268, 0.168], [0.993, 0.168], [0.993, 0.925], [0.268, 0.925]]; // Fassade im Beispielfoto (Anteile der Bildgröße)
function loadImage(src, preset) {
  var im = new Image(); im.onload = function () {
    img = im; var maxW = 1600, sc = Math.min(1, maxW / im.naturalWidth);
    F.cv.width = Math.round(im.naturalWidth * sc); F.cv.height = Math.round(im.naturalHeight * sc);
    var p = preset || [[0.2, 0.15], [0.8, 0.15], [0.8, 0.85], [0.2, 0.85]];
    pts = p.map(function (q) { return [q[0] * F.cv.width, q[1] * F.cv.height]; });
    F.wrap.style.aspectRatio = F.cv.width + ' / ' + F.cv.height;
    F.wrap.classList.add('has-img'); makeHandles(); render(); requestAnimationFrame(placeHandles);
  }; im.src = src;
}
F.file.addEventListener('change', function () { var f = F.file.files[0]; if (!f) return; var u = URL.createObjectURL(f); loadImage(u); F.hint.textContent = 'Ziehen Sie die vier Punkte auf die Ecken Ihrer Fassade.'; });
$('#f-example').addEventListener('click', function () { loadImage(example, EX_PTS); F.w.value = 24; F.h.value = 17; });
[F.w, F.h, F.net].forEach(function (e) { e.addEventListener('input', render); });
function makeHandles() {
  handles.forEach(function (h) { h.remove(); }); handles = [];
  ['oben links', 'oben rechts', 'unten rechts', 'unten links'].forEach(function (name, i) {
    var h = document.createElement('button'); h.type = 'button'; h.className = 'f-handle'; h.setAttribute('aria-label', 'Eckpunkt ' + name + ' verschieben'); h.dataset.i = i;
    F.wrap.appendChild(h); handles.push(h);
    h.addEventListener('pointerdown', function (e) { e.preventDefault(); h.setPointerCapture(e.pointerId); h.classList.add('is-drag'); });
    h.addEventListener('pointermove', function (e) {
      if (!h.hasPointerCapture(e.pointerId)) return; var r = F.cv.getBoundingClientRect();
      pts[i] = [clamp((e.clientX - r.left) / r.width * F.cv.width, 0, F.cv.width), clamp((e.clientY - r.top) / r.height * F.cv.height, 0, F.cv.height)]; render();
    });
    h.addEventListener('pointerup', function () { h.classList.remove('is-drag'); });
    h.addEventListener('keydown', function (e) { var d = { ArrowLeft: [-4, 0], ArrowRight: [4, 0], ArrowUp: [0, -4], ArrowDown: [0, 4] }[e.key]; if (d) { e.preventDefault(); pts[i][0] += d[0]; pts[i][1] += d[1]; render(); } });
  });
}
function placeHandles() {
  var r = F.cv.getBoundingClientRect(), wr = F.wrap.getBoundingClientRect();
  handles.forEach(function (h, i) { h.style.left = (r.left - wr.left + pts[i][0] / F.cv.width * r.width) + 'px'; h.style.top = (r.top - wr.top + pts[i][1] / F.cv.height * r.height) + 'px'; });
}
window.addEventListener('resize', function () { if (pts) placeHandles(); });
// Gerüst frontal als Bild zeichnen (Pixel pro Meter fest), danach perspektivisch auf die Fassade legen
function scaffoldTexture(Wm, Hm, net) {
  var ppm = 40, felder = Math.max(1, Math.round(Wm / BW)), bw = Wm / felder, lagen = Math.max(1, Math.floor(Hm / LH)), lh = Hm / (lagen + 0.5);
  var c = document.createElement('canvas'); c.width = Math.round(Wm * ppm); c.height = Math.round(Hm * ppm); var g = c.getContext('2d');
  var X = function (m) { return m * ppm; }, Y = function (m) { return c.height - m * ppm; };
  function tube(x1, y1, x2, y2, w) {
    g.lineCap = 'round'; g.strokeStyle = 'rgba(40,44,50,.55)'; g.lineWidth = w + 2; g.beginPath(); g.moveTo(x1 + 1.5, y1 + 1.5); g.lineTo(x2 + 1.5, y2 + 1.5); g.stroke();
    var grd = g.createLinearGradient(x1 - w, y1 - w, x1 + w, y1 + w); grd.addColorStop(0, '#f2f4f6'); grd.addColorStop(0.5, '#b9bec4'); grd.addColorStop(1, '#8a9097');
    g.strokeStyle = grd; g.lineWidth = w; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  }
  var tw = Math.max(2, 0.05 * ppm);
  for (var l = 1; l <= lagen; l++) {
    var yd = l * lh;
    g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, Y(yd) , c.width, 0.35 * ppm);                       // Schatten unter dem Belag
    g.fillStyle = '#9aa0a6'; g.fillRect(0, Y(yd + 0.06), c.width, 0.06 * ppm);                         // Belagkante
    for (var i = 0; i < felder; i++) {                                                                     // Bordbrett rot weiß
      for (var s = 0; s < 8; s++) { g.fillStyle = s % 2 ? '#f1efe9' : '#d3262a'; g.fillRect(X(i * bw + s * bw / 8), Y(yd + 0.21), bw / 8 * ppm + 0.5, 0.15 * ppm); }
      if (i % 3 === 0) tube(X(i * bw), Y(l % 2 ? yd - lh : yd), X((i + 1) * bw), Y(l % 2 ? yd : yd - lh), tw * 0.8);
    }
    tube(0, Y(yd + 1.0), c.width, Y(yd + 1.0), tw); tube(0, Y(yd + 0.5), c.width, Y(yd + 0.5), tw * 0.9);
  }
  for (var j = 0; j <= felder; j++) tube(X(j * bw), Y(0), X(j * bw), Y(Math.min(Hm, lagen * lh + 1.0)), tw * 1.1);
  if (net) { g.fillStyle = 'rgba(235,238,240,.42)'; g.fillRect(0, Y(Math.min(Hm, lagen * lh + 1.0)), c.width, Math.min(Hm, lagen * lh + 1.0) * ppm); }
  return c;
}
// Homographie vom Rechteck (0..1) auf das Viereck, dann Raster aus Dreiecken mit affiner Abbildung zeichnen
function homography(q) {
  var x0 = q[0][0], y0 = q[0][1], x1 = q[1][0], y1 = q[1][1], x2 = q[2][0], y2 = q[2][1], x3 = q[3][0], y3 = q[3][1];
  var dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3;
  var den = dx1 * dy2 - dx2 * dy1, g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
  var a = x1 - x0 + g * x1, b = x3 - x0 + h * x3, d = y1 - y0 + g * y1, e = y3 - y0 + h * y3;
  return function (u, v) { var w = g * u + h * v + 1; return [(a * u + b * v + x0) / w, (d * u + e * v + y0) / w]; };
}
function tri(src, s0, s1, s2, d0, d1, d2) {
  ctx.save(); ctx.beginPath(); ctx.moveTo(d0[0], d0[1]); ctx.lineTo(d1[0], d1[1]); ctx.lineTo(d2[0], d2[1]); ctx.closePath(); ctx.clip();
  var den = s0[0] * (s2[1] - s1[1]) - s1[0] * s2[1] + s2[0] * s1[1] + (s1[0] - s2[0]) * s0[1]; if (Math.abs(den) < 1e-6) { ctx.restore(); return; }
  var m11 = -(s0[1] * (d2[0] - d1[0]) - s1[1] * d2[0] + s2[1] * d1[0] + (s1[1] - s2[1]) * d0[0]) / den;
  var m12 = (s1[1] * d2[1] + s0[1] * (d1[1] - d2[1]) - s2[1] * d1[1] + (s2[1] - s1[1]) * d0[1]) / den;
  var m21 = (s0[0] * (d2[0] - d1[0]) - s1[0] * d2[0] + s2[0] * d1[0] + (s1[0] - s2[0]) * d0[0]) / den;
  var m22 = -(s1[0] * d2[1] + s0[0] * (d1[1] - d2[1]) - s2[0] * d1[1] + (s2[0] - s1[0]) * d0[1]) / den;
  var dx = (s0[0] * (s2[1] * d1[0] - s1[1] * d2[0]) + s0[1] * (s1[0] * d2[0] - s2[0] * d1[0]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[0]) / den;
  var dy = (s0[0] * (s2[1] * d1[1] - s1[1] * d2[1]) + s0[1] * (s1[0] * d2[1] - s2[0] * d1[1]) + (s2[0] * s1[1] - s1[0] * s2[1]) * d0[1]) / den;
  ctx.transform(m11, m12, m21, m22, dx, dy); ctx.drawImage(src, 0, 0); ctx.restore();
}
function render() {
  if (!img) return;
  ctx.clearRect(0, 0, F.cv.width, F.cv.height); ctx.drawImage(img, 0, 0, F.cv.width, F.cv.height);
  var Wm = clamp(+F.w.value || 15, 3, 200), Hm = clamp(+F.h.value || 15, 3, 80);
  // Gerüst steht etwas vor der Wand und reicht 1 m über die Traufe: Viereck leicht vergrößern
  var top = [pts[0], pts[1]], H = homography(pts);
  var q = [H(-0.01, -1.0 / Hm), H(1.01, -1.0 / Hm), H(1.01, 1.0), H(-0.01, 1.0)];
  var tex = scaffoldTexture(Wm * 1.02, Hm + 1.0, F.net.checked), Hq = homography(q), N = 14, tw = tex.width, th = tex.height;
  for (var i = 0; i < N; i++) for (var j = 0; j < N; j++) {
    var u0 = i / N, u1 = (i + 1) / N, v0 = j / N, v1 = (j + 1) / N, pad = 0.6;
    var a = Hq(u0, v0), b = Hq(u1, v0), c = Hq(u1, v1), d = Hq(u0, v1);
    var A = [u0 * tw, v0 * th], B = [u1 * tw, v0 * th], C = [u1 * tw, v1 * th], D = [u0 * tw, v1 * th];
    var grow = function (p, cx, cy) { var dx = p[0] - cx, dy = p[1] - cy, l = Math.hypot(dx, dy) || 1; return [p[0] + dx / l * pad, p[1] + dy / l * pad]; };
    var cx = (a[0] + b[0] + c[0] + d[0]) / 4, cy = (a[1] + b[1] + c[1] + d[1]) / 4;
    tri(tex, A, B, C, grow(a, cx, cy), grow(b, cx, cy), grow(c, cx, cy)); tri(tex, A, C, D, grow(a, cx, cy), grow(c, cx, cy), grow(d, cx, cy));
  }
  placeHandles();
}
F.dl.addEventListener('click', function () { if (!img) return; F.cv.toBlob(function (b) { var a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'geruest-vorschau.jpg'; a.click(); }, 'image/jpeg', 0.9); });

/* =================== 3) Baustellen Karte Berlin =================== */
var KARTE = window.NEUMANN_KARTE, REFS = window.NEUMANN_REFS || [];
// ungefähre Lage der Referenzprojekte (Bezirk/Straße), nur zur Orientierung
var LAGE = {
  'FA Wedding': [52.557, 13.377], 'Olympiastadion': [52.5147, 13.2395], 'Landesbibliothek, Breite Str.': [52.5142, 13.401], 'TIB TU Berlin': [52.5443, 13.387],
  'Amtsgericht Schöneberg': [52.493, 13.351], 'Studentenwerk Franz-Mehring-Platz': [52.5105, 13.443], 'FA Reinickendorf': [52.572, 13.319], 'Hamburger Bahnhof': [52.5284, 13.3721],
  'Bundesarchiv': [52.429, 13.303], 'Bahnhof Ostkreuz': [52.503, 13.469], 'Europacenter': [52.5043, 13.3376], 'HELIOS Klinik Buch': [52.629, 13.504], 'Messe Berlin – ICC': [52.505, 13.279],
  'Science Center Medizintechnik Berlin': [52.51, 13.378], 'Zoofenster': [52.5055, 13.3335], 'Kirche St. Bonifatius': [52.493, 13.388], 'St. Marienkirche Strausberg': [52.578, 13.883],
  'Stadtkirche Altlandsberg': [52.564, 13.733], 'Gymnasium Dunckerstr.3': [52.544, 13.422], 'HU Berlin, Dorotheenstr. 1': [52.5195, 13.392], 'Gymnasium Görschstr.': [52.57, 13.41],
  'GS Rheingaustr. 3': [52.473, 13.327], 'Elisabeth-Christinen Grundschule': [52.583, 13.405], '5. Grundschule Atzpodienstr.': [52.514, 13.487], 'Konzerthaus Berlin': [52.5137, 13.392],
  'Jüdisches Museum': [52.502, 13.395], 'IFA – Messe Berlin': [52.5065, 13.273], 'ILA – Messe Berlin': [52.38, 13.51], 'Classic Open Air': [52.5132, 13.3935], 'Alt-Köpenick 20': [52.445, 13.576],
  'Finowstr. 29': [52.508, 13.468], 'Lichtenrader Damm 52 a-c': [52.404, 13.399], 'Möckernstr. 73': [52.496, 13.382], 'Rosenthaler Str.': [52.526, 13.402], 'Kollwitzstr. 14': [52.534, 13.417],
  'Schillerstr. 12-15': [52.507, 13.308], 'Stadtvillen Berlin-Kladow': [52.455, 13.145], 'Wutzkyallee': [52.423, 13.469]
};
var projects = {};
REFS.forEach(function (r) {
  var ll = LAGE[r.t]; if (!ll) return;
  var p = projects[r.t] || (projects[r.t] = { t: r.t, k: r.k, ll: ll, img: [] }); p.img.push(r.f);
});
var P = Object.keys(projects).map(function (k) { return projects[k]; });
function xy(ll) { var b = KARTE.box; return [(ll[1] - b[0]) / (b[1] - b[0]) * KARTE.w, (b[3] - ll[0]) / (b[3] - b[2]) * KARTE.h]; }
var svg = $('#m-svg'), cats = {};
P.forEach(function (p) { cats[p.k] = (cats[p.k] || 0) + 1; });
var html = '<g class="m-bez">' + KARTE.bezirke.map(function (b) { return '<path d="' + b.d + '"><title>' + b.n + '</title></path>'; }).join('') + '</g>';
html += '<g class="m-lbl">' + KARTE.bezirke.map(function (b) { return '<text x="' + b.c[0] + '" y="' + b.c[1] + '">' + b.n.replace('-', '-​') + '</text>'; }).join('') + '</g>';
html += '<g class="m-pts">' + P.map(function (p, i) { var c = xy(p.ll); return '<g class="m-pt" data-i="' + i + '" data-k="' + p.k + '" transform="translate(' + c[0].toFixed(1) + ',' + c[1].toFixed(1) + ')" tabindex="0" role="button" aria-label="' + p.t + '"><circle class="m-ring" r="9"/><circle class="m-dot" r="4.5"/></g>'; }).join('') + '</g>';
svg.setAttribute('viewBox', '0 0 ' + KARTE.w + ' ' + KARTE.h); svg.innerHTML = html;
$('#m-filter').innerHTML = '<button type="button" class="chip is-on" data-k="">Alle <b>' + P.length + '</b></button>' + Object.keys(cats).map(function (k) { return '<button type="button" class="chip" data-k="' + k + '">' + k + ' <b>' + cats[k] + '</b></button>'; }).join('');
$('#m-count').textContent = P.length;
$('#m-filter').addEventListener('click', function (e) {
  var b = e.target.closest('.chip'); if (!b) return;
  document.querySelectorAll('#m-filter .chip').forEach(function (c) { c.classList.toggle('is-on', c === b); });
  document.querySelectorAll('.m-pt').forEach(function (g) { g.classList.toggle('is-off', !!b.dataset.k && g.dataset.k !== b.dataset.k); });
});
var card = $('#m-card');
function openP(i) {
  var p = P[i]; document.querySelectorAll('.m-pt').forEach(function (g) { g.classList.toggle('is-sel', +g.dataset.i === i); });
  card.innerHTML = '<p class="mono">' + p.k + '</p><h3>' + p.t + '</h3><div class="m-imgs">' + p.img.slice(0, 3).map(function (f) { return '<img src="' + f + '" alt="' + p.t + '" loading="lazy">'; }).join('') + '</div><p class="m-note">Ungefähre Lage</p>';
  card.hidden = false;
}
svg.addEventListener('click', function (e) { var g = e.target.closest('.m-pt'); if (g) openP(+g.dataset.i); });
svg.addEventListener('keydown', function (e) { var g = e.target.closest('.m-pt'); if (g && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openP(+g.dataset.i); } });
if (P.length) openP(P.findIndex(function (p) { return p.t === 'Olympiastadion'; }) >= 0 ? P.findIndex(function (p) { return p.t === 'Olympiastadion'; }) : 0);
})();
