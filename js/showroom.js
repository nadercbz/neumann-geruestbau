/* Showroom: Knopf oben rechts öffnet ein Glas Overlay mit allen Referenzprojekten (Seite dahinter weich und dunkler).
   Kachelwand mit Filter nach Kategorie, Großansicht mit Blättern (Pfeile, Wischen), Direktlink #showroom. */
(function () {
'use strict';
var d = document, root = d.documentElement, sr = null, wall = null, lb = null, refs = [], tiles = [], cur = -1, trigger = null, io = null;
var home = !!d.getElementById('kontakt');
var X = '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"><path d="M3.5 3.5l9 9M12.5 3.5l-9 9" stroke="currentColor" stroke-width="1.6" stroke-linecap="square"/></svg>';
var esc = function (t) { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); };

function data(cb) {
  if (window.NEUMANN_REFS) return cb(window.NEUMANN_REFS);
  var s = d.createElement('script'); s.src = 'js/data.js?v=sr2';
  s.onload = function () { cb(window.NEUMANN_REFS || []); }; s.onerror = function () { cb([]); };
  d.head.appendChild(s);
}

function build() {
  var cats = {}, names = {};
  refs.forEach(function (r) { cats[r.k] = (cats[r.k] || 0) + 1; names[r.t] = 1; });
  var years = new Date().getFullYear() - 1990, nP = Object.keys(names).length;
  sr = d.createElement('div');
  sr.className = 'sr'; sr.id = 'showroom'; sr.hidden = true;
  sr.setAttribute('role', 'dialog'); sr.setAttribute('aria-modal', 'true'); sr.setAttribute('aria-label', 'Showroom, aktuelle Baustellen von Neumann Gerüstbau');
  sr.innerHTML =
    '<div class="sr__bg"></div>' +
    '<div class="sr__scroll" data-lenis-prevent>' +
      '<header class="sr__head"><p class="mono sr__kick"><span class="pulse"></span>Showroom</p>' +
        '<h2 class="sr__title">Unsere aktuellen Baustellen.</h2>' +
        '<p class="sr__lead">' + nP + ' aktuelle Baustellen in Berlin, eingerüstet von Neumann. Vom Wohnquartier bis zur Alten Försterei.</p></header>' +
      '<div class="sr__wall"></div>' +
      '<div class="sr__end"><p>Ihr Projekt als nächstes?</p><a class="btn btn--light" href="' + (home ? '#kontakt' : 'index.html#kontakt') + '" data-sr-go>Projekt anfragen</a></div>' +
    '</div>' +
    '<div class="sr__bar">' +
      '<div class="sr__chips" role="tablist" aria-label="Kategorie wählen"><button type="button" class="sr__chip is-on" data-k="" role="tab" aria-selected="true">Alle <b>' + refs.length + '</b></button>' +
        Object.keys(cats).map(function (k) { return '<button type="button" class="sr__chip" data-k="' + esc(k) + '" role="tab" aria-selected="false">' + esc(k) + ' <b>' + cats[k] + '</b></button>'; }).join('') + '</div>' +
      '<button class="sr__x" type="button" aria-label="Showroom schließen">' + X + '</button>' +
    '</div>';
  d.body.appendChild(sr);
  wall = sr.querySelector('.sr__wall');
  wall.innerHTML = refs.map(function (r, i) {
    return '<button class="sr__t" type="button" data-i="' + i + '" data-k="' + esc(r.k) + '" style="--ar:' + (r.r || 1.333) + '" aria-label="' + esc(r.t) + ', ' + esc(r.k) + ', groß ansehen">' +
      '<img src="' + esc(r.f) + '" alt="' + esc(r.t) + ', eingerüstet von Neumann Gerüstbau" loading="lazy" decoding="async">' +
      '<span class="sr__cap"><b>' + esc(r.t) + '</b><span class="mono">' + esc(r.k) + (r.o ? ' · ' + esc(r.o) : '') + '</span></span></button>';
  }).join('');
  tiles = [].slice.call(wall.querySelectorAll('.sr__t'));

  lb = d.createElement('div');
  lb.className = 'srl'; lb.hidden = true;
  lb.innerHTML = '<div class="srl__bg"></div><img class="srl__img" alt=""><button class="sr__x srl__x" type="button" aria-label="Großansicht schließen">' + X + '</button>' +
    '<button class="srl__nav srl__prev" type="button" aria-label="Vorheriges Foto"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
    '<button class="srl__nav srl__next" type="button" aria-label="Nächstes Foto"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.6"/></svg></button>' +
    '<p class="srl__cap mono" aria-live="polite"></p>';
  sr.appendChild(lb);

  sr.querySelector('.sr__x').addEventListener('click', function () { close(); });
  sr.querySelector('.sr__bg').addEventListener('click', function () { close(); });
  sr.querySelector('.sr__chips').addEventListener('click', function (e) {
    var b = e.target.closest('.sr__chip'); if (!b) return;
    [].forEach.call(sr.querySelectorAll('.sr__chip'), function (c) { var on = c === b; c.classList.toggle('is-on', on); c.setAttribute('aria-selected', on); });
    tiles.forEach(function (t) { t.classList.toggle('is-off', !!b.dataset.k && t.dataset.k !== b.dataset.k); });
    sr.querySelector('.sr__scroll').scrollTo({ top: 0, behavior: 'smooth' });
  });
  wall.addEventListener('click', function (e) { var t = e.target.closest('.sr__t'); if (t) lbOpen(+t.dataset.i); });
  sr.querySelector('[data-sr-go]').addEventListener('click', function (e) {
    if (!home) return; e.preventDefault(); close();
    setTimeout(function () { var k = d.getElementById('kontakt'); if (window.__lenis) window.__lenis.scrollTo(k, { offset: -10, duration: 1.2 }); else k.scrollIntoView({ behavior: 'smooth' }); }, 420);
  });
  lb.querySelector('.srl__bg').addEventListener('click', lbClose);
  lb.querySelector('.srl__img').addEventListener('click', lbClose);
  lb.querySelector('.srl__x').addEventListener('click', lbClose);
  lb.querySelector('.srl__prev').addEventListener('click', function () { step(-1); });
  lb.querySelector('.srl__next').addEventListener('click', function () { step(1); });
  var tx = 0, ty = 0;
  lb.addEventListener('touchstart', function (e) { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive: true });
  lb.addEventListener('touchend', function (e) { var dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty; if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1); else if (dy > 90) lbClose(); }, { passive: true });

  // Kacheln gleiten ein, sobald sie im Overlay sichtbar werden
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { root: sr.querySelector('.sr__scroll'), rootMargin: '0px 0px -4% 0px' });
  }
}

function open(push) {
  data(function (r) {
    refs = r; if (!refs.length) return;
    if (!sr) build();
    if (!sr.hidden) return;
    trigger = d.activeElement;
    sr.hidden = false; root.classList.add('sr-open');
    if (window.__lenis) window.__lenis.stop();
    [].forEach.call(d.querySelectorAll('[data-showroom]'), function (b) { b.setAttribute('aria-expanded', 'true'); });
    tiles.forEach(function (t, i) { t.classList.remove('in'); t.style.transitionDelay = Math.min(i % 10, 9) * 45 + 'ms'; if (io) io.observe(t); else t.classList.add('in'); });
    requestAnimationFrame(function () { requestAnimationFrame(function () { sr.classList.add('is-in'); sr.querySelector('.sr__x').focus({ preventScroll: true }); }); });
    if (push !== false && location.hash !== '#showroom') history.pushState({ sr: 1 }, '', '#showroom');
  });
}

function close(fromPop) {
  if (!sr || sr.hidden) return;
  if (!lb.hidden) lbClose(true);
  sr.classList.remove('is-in'); root.classList.remove('sr-open');
  if (window.__lenis) window.__lenis.start();
  [].forEach.call(d.querySelectorAll('[data-showroom]'), function (b) { b.setAttribute('aria-expanded', 'false'); });
  setTimeout(function () { if (!sr.classList.contains('is-in')) sr.hidden = true; }, 480);
  if (fromPop !== true && location.hash === '#showroom') history.replaceState(null, '', location.pathname + location.search);
  if (trigger && trigger.focus) trigger.focus({ preventScroll: true });
}

/* ---------- Großansicht: Bild fliegt aus der Kachel groß in die Mitte ---------- */
function target(r) {
  var vw = innerWidth, vh = innerHeight, mob = vw < 700;
  var mw = Math.min(vw * (mob ? 0.96 : 0.86), 1280), mh = vh * (mob ? 0.7 : 0.8);
  var w = mw, h = w / r; if (h > mh) { h = mh; w = h * r; }
  return { l: (vw - w) / 2, t: (vh - h) / 2 - (mob ? 10 : 6), w: w, h: h };
}
function place(img, R) { img.style.left = R.l + 'px'; img.style.top = R.t + 'px'; img.style.width = R.w + 'px'; img.style.height = R.h + 'px'; }
function caption(i) { var r = refs[i]; lb.querySelector('.srl__cap').textContent = r.t + (r.o ? ', ' + r.o : '') + ' · ' + r.k + ' · ' + (i + 1) + ' / ' + refs.length; }
function lbOpen(i) {
  cur = i; var r = refs[i], img = lb.querySelector('.srl__img'), tile = tiles[i], tr = tile.querySelector('img').getBoundingClientRect(), R = target(r.r || 1.333);
  img.src = r.f; img.alt = r.t + ', eingerüstet von Neumann Gerüstbau'; caption(i); place(img, R);
  lb.hidden = false;
  img.style.transition = 'none';
  img.style.transform = 'translate(' + (tr.left - R.l) + 'px,' + (tr.top - R.t) + 'px) scale(' + (tr.width / R.w) + ',' + (tr.height / R.h) + ')';
  void img.offsetWidth;
  img.style.transition = ''; img.style.transform = 'none';
  lb.classList.add('on'); lb.querySelector('.srl__x').focus({ preventScroll: true });
}
function lbClose(quick) {
  if (!lb || lb.hidden) return;
  var img = lb.querySelector('.srl__img'), tile = tiles[cur];
  lb.classList.remove('on');
  if (quick !== true && tile && tile.offsetParent) {
    var tr = tile.querySelector('img').getBoundingClientRect(), R = target(refs[cur].r || 1.333);
    img.style.transform = 'translate(' + (tr.left - R.l) + 'px,' + (tr.top - R.t) + 'px) scale(' + (tr.width / R.w) + ',' + (tr.height / R.h) + ')';
    setTimeout(function () { if (!lb.classList.contains('on')) lb.hidden = true; }, 460);
    tile.focus({ preventScroll: true });
  } else lb.hidden = true;
}
function step(dir) {
  var vis = tiles.filter(function (t) { return !t.classList.contains('is-off'); }).map(function (t) { return +t.dataset.i; });
  var k = vis.indexOf(cur); if (k < 0) return;
  cur = vis[(k + dir + vis.length) % vis.length];
  var img = lb.querySelector('.srl__img'), r = refs[cur];
  img.style.transition = 'opacity .18s'; img.style.opacity = 0;
  setTimeout(function () {
    img.src = r.f; img.alt = r.t + ', eingerüstet von Neumann Gerüstbau'; place(img, target(r.r || 1.333)); caption(cur);
    img.style.transform = 'none'; img.style.opacity = 1;
    setTimeout(function () { img.style.transition = ''; }, 200);
  }, 170);
}

/* ---------- Bedienung ---------- */
d.addEventListener('click', function (e) { var b = e.target.closest('[data-showroom]'); if (b) { e.preventDefault(); open(); } });
d.addEventListener('keydown', function (e) {
  if (!sr || sr.hidden) return;
  if (e.key === 'Escape') { e.preventDefault(); if (!lb.hidden) lbClose(); else close(); return; }
  if (!lb.hidden && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { e.preventDefault(); step(e.key === 'ArrowRight' ? 1 : -1); return; }
  if (e.key === 'Tab') { // Fokus bleibt im Showroom
    var box = lb.hidden ? sr : lb;
    var f = [].slice.call(box.querySelectorAll('button,a[href]')).filter(function (x) { return x.offsetParent !== null && (lb.hidden ? !lb.contains(x) : true); });
    if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && d.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && d.activeElement === z) { e.preventDefault(); a.focus(); }
  }
});
addEventListener('resize', function () { if (lb && !lb.hidden) place(lb.querySelector('.srl__img'), target(refs[cur].r || 1.333)); });
addEventListener('popstate', function () { if (location.hash === '#showroom') open(false); else close(true); });
if (location.hash === '#showroom') {
  (function wait() { if (root.classList.contains('is-wait')) return setTimeout(wait, 120); history.replaceState({ sr: 1 }, '', '#showroom'); open(false); })();
}
window.NeumannShowroom = { open: open, close: close };
})();
