/* Gerüstbau interaktiv: Haus zusammenstellen, Gerüst baut sich passend davor auf.
   Nur zur Veranschaulichung, keine verbindliche Berechnung. Alles im Browser. */
import * as THREE from 'three';
import { RoomEnvironment } from '../assets/vendor/RoomEnvironment.js';

const $ = (s, r) => (r || document).querySelector(s);
const host = $('#planer'); const canvas = $('#pl-canvas'); const form = $('#pl-form');
if (host && canvas && form) {
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
const fmt = (n, d = 0) => n.toLocaleString('de-DE', { minimumFractionDigits: d, maximumFractionDigits: d });
const MAIL = 'info@geruestbau-neumann.de', Y = '#FACE00', BW = 2.57, DEP = 0.73, LH = 2.0, BASE = 0.32;

const ART = {
  altbau:  { label: 'Altbau',  decke: 3.4, eg: 0.4, fassade: 'putz',    dach: 'mansarde', fh: 0.56, fw: 0.42, fenster: 1 / 3.1, balkone: 0 },
  neubau:  { label: 'Neubau',  decke: 2.8, eg: 0.2, fassade: 'putz',    dach: 'flach',    fh: 0.5,  fw: 0.5,  fenster: 1 / 3.4, balkone: 2 },
  gewerbe: { label: 'Gewerbe', decke: 3.6, eg: 0.6, fassade: 'glas',    dach: 'flach',    fh: 0.62, fw: 0.78, fenster: 1 / 2.7, balkone: 0 },
};
const LABEL = { putz: 'Putz', klinker: 'Klinker', naturstein: 'Naturstein', glas: 'Glas', asphalt: 'Asphalt', pflaster: 'Pflaster', rasen: 'Rasen', schotter: 'Schotter',
  mitte: 'Mitte', links: 'Links', rechts: 'Rechts', verteilt: 'Verteilt', eben: 'eben', gefaelle: 'mit Gefälle' };
const S = { art: 'altbau', breite: 18, etagen: 5, decke: 3.4, fassade: 'putz', fenster: 6, balkone: 0, bplatz: 'mitte', tueren: 1, tplatz: 'mitte', boden: 'pflaster', gelaende: 'eben', lagen: 0, netz: false };

/* ---------- Szene ---------- */
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene(); const BG = new THREE.Color('#e8e6e1');
scene.background = BG; scene.fog = new THREE.Fog(BG, 70, 190);
const pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.55;
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 500);
scene.add(new THREE.HemisphereLight('#ffffff', '#cfc8bb', 0.9));
const sun = new THREE.DirectionalLight('#fff4e2', 2.4); sun.position.set(-26, 38, -30); sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
const sc = sun.shadow.camera; sc.left = -45; sc.right = 45; sc.top = 45; sc.bottom = -25; sc.near = 1; sc.far = 140;
scene.add(sun, sun.target);

/* ---------- Texturen (aus dem Code gezeichnet) ---------- */
function canvasTex(w, h, draw, rx = 1, ry = 1) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
function noise(g, w, h, a, base) { g.fillStyle = base; g.fillRect(0, 0, w, h); for (let i = 0; i < w * h / 18; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * a})`; g.fillRect(rnd() * w, rnd() * h, 1.5, 1.5); } }
const TEX = {
  putz: canvasTex(256, 256, (g, w, h) => noise(g, w, h, 0.05, '#f4f1ea')),
  klinker: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#d9d4cc'; g.fillRect(0, 0, w, h); const bh = 16, bw = 64;
    for (let y = 0, r = 0; y < h; y += bh, r++) for (let x = -(r % 2) * bw / 2; x < w; x += bw) { const v = 150 + rnd() * 40 | 0; g.fillStyle = `rgb(${v + 40},${v * 0.55 | 0},${v * 0.4 | 0})`; g.fillRect(x + 1.5, y + 1.5, bw - 3, bh - 3); } }),
  naturstein: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#cfc6b4'; g.fillRect(0, 0, w, h); const bh = 42;
    for (let y = 0, r = 0; y < h; y += bh, r++) for (let x = -(r % 2) * 50; x < w; x += 100) { const v = 205 + rnd() * 25 | 0; g.fillStyle = `rgb(${v},${v - 10},${v - 30})`; g.fillRect(x + 2, y + 2, 96, bh - 4); } }),
  glas: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#5b6670'; g.fillRect(0, 0, w, h); const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(255,255,255,.1)'); g.fillStyle = gr; g.fillRect(0, 0, w, h); }),
  asphalt: canvasTex(256, 256, (g, w, h) => noise(g, w, h, 0.22, '#55575a'), 12, 12),
  pflaster: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#8d8b86'; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) { const v = 150 + rnd() * 35 | 0; g.fillStyle = `rgb(${v},${v - 2},${v - 6})`; g.fillRect(x + 2, y + 2, 28, 28); } }, 30, 30),
  rasen: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#6f9a4c'; g.fillRect(0, 0, w, h); for (let i = 0; i < 5000; i++) { g.fillStyle = rnd() > 0.5 ? 'rgba(40,80,20,.35)' : 'rgba(170,210,110,.3)'; g.fillRect(rnd() * w, rnd() * h, 1.2, 3); } }, 10, 10),
  schotter: canvasTex(256, 256, (g, w, h) => { g.fillStyle = '#b7aa94'; g.fillRect(0, 0, w, h); for (let i = 0; i < 3500; i++) { const v = 120 + rnd() * 110 | 0; g.fillStyle = `rgb(${v},${v - 8},${v - 22})`; g.beginPath(); g.arc(rnd() * w, rnd() * h, 1 + rnd() * 2.5, 0, 7); g.fill(); } }, 12, 12),
  netz: canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1; for (let i = 0; i <= w; i += 8) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke(); g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke(); } }),
  bord: canvasTex(128, 16, (g, w, h) => { for (let x = 0; x < w; x += 32) { g.fillStyle = Y; g.fillRect(x, 0, 16, h); g.fillStyle = '#16181c'; g.fillRect(x + 16, 0, 16, h); } }),
};

/* ---------- Materialien ---------- */
const M = {
  weiss: new THREE.MeshStandardMaterial({ color: '#f7f6f2', roughness: 0.85 }),
  sockel: new THREE.MeshStandardMaterial({ color: '#fbfaf7', roughness: 0.9 }),
  dach: new THREE.MeshStandardMaterial({ color: '#5d6168', roughness: 0.75 }),
  rahmen: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.5 }),
  glas: new THREE.MeshStandardMaterial({ color: '#2a3138', roughness: 0.08, metalness: 0.7 }),
  tuer: new THREE.MeshStandardMaterial({ color: '#3b2a20', roughness: 0.6 }),
  gelaender: new THREE.MeshStandardMaterial({ color: '#d8dade', roughness: 0.35, metalness: 0.7 }),
  rohr: new THREE.MeshStandardMaterial({ color: Y, roughness: 0.42, metalness: 0.35 }),
  belag: new THREE.MeshStandardMaterial({ color: '#b9bec5', roughness: 0.45, metalness: 0.6 }),
  bord: new THREE.MeshStandardMaterial({ map: TEX.bord, roughness: 0.6 }),
  fuss: new THREE.MeshStandardMaterial({ color: '#30343a', roughness: 0.5, metalness: 0.6 }),
  bohle: new THREE.MeshStandardMaterial({ color: '#9c7148', roughness: 0.9 }),
  anker: new THREE.MeshStandardMaterial({ color: '#16181c', roughness: 0.4, metalness: 0.6 }),
  netz: new THREE.MeshStandardMaterial({ map: TEX.netz, color: '#ffffff', transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false, roughness: 1 }),
};
const FASS = {
  putz: new THREE.MeshStandardMaterial({ map: TEX.putz, roughness: 0.92 }),
  klinker: new THREE.MeshStandardMaterial({ map: TEX.klinker, roughness: 0.88 }),
  naturstein: new THREE.MeshStandardMaterial({ map: TEX.naturstein, roughness: 0.85 }),
  glas: new THREE.MeshStandardMaterial({ map: TEX.glas, roughness: 0.12, metalness: 0.65 }),
};
const BODEN = {};
['asphalt', 'pflaster', 'rasen', 'schotter'].forEach(k => BODEN[k] = new THREE.MeshStandardMaterial({ map: TEX[k], roughness: 0.95 }));

/* ---------- Grundplatte (Architekturmodell) ---------- */
const plinth = new THREE.Mesh(new THREE.BoxGeometry(150, 0.6, 90), M.sockel); plinth.position.set(0, -0.32, 18); plinth.receiveShadow = true; scene.add(plinth);
const groundG = new THREE.Group(); scene.add(groundG);
const houseG = new THREE.Group(); scene.add(houseG);
const scafG = new THREE.Group(); scene.add(scafG);

/* ---------- Gerüstteile als Instanzen ---------- */
const GEO = { rohr: new THREE.CylinderGeometry(0.026, 0.026, 1, 8), box: new THREE.BoxGeometry(1, 1, 1) };
let parts = [], meshes = [], anim = 1, animT0 = 0, D = 11;
const UP = new THREE.Vector3(0, 1, 0), TV = new THREE.Vector3(), TQ = new THREE.Quaternion(), TS = new THREE.Vector3(), TM = new THREE.Matrix4();
function tube(type, a, b, lvl, mat = 'rohr') { const d = new THREE.Vector3().subVectors(b, a), L = d.length();
  parts.push({ geo: 'rohr', mat, p: a.clone().add(b).multiplyScalar(0.5), q: new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), s: new THREE.Vector3(1, L, 1), lvl, tube: true }); }
function box(mat, p, s, lvl) { parts.push({ geo: 'box', mat, p: p.clone(), q: new THREE.Quaternion(), s: s.clone(), lvl }); }
function flushParts() {
  meshes.forEach(m => { scafG.remove(m); m.dispose(); }); meshes = [];
  const groups = {};
  parts.forEach(p => { const k = p.geo + '|' + p.mat; (groups[k] = groups[k] || []).push(p); });
  Object.entries(groups).forEach(([k, list]) => { const [g, mt] = k.split('|');
    const m = new THREE.InstancedMesh(GEO[g], M[mt], list.length); m.castShadow = mt !== 'netz'; m.receiveShadow = true; m.userData.list = list; m.frustumCulled = false;
    scafG.add(m); meshes.push(m); });
  updateParts();
}
function updateParts() {
  const n = Math.max(1, S.lagen) + 1;
  meshes.forEach(m => { m.userData.list.forEach((it, i) => {
    const e = ease((anim * (n + 1.2) - it.lvl) / 1.2);
    TV.copy(it.p); TV.y += (1 - e) * 1.4; TS.copy(it.s).multiplyScalar(e < 0.002 ? 0 : 1); if (it.tube) TS.y = it.s.y * e;
    TM.compose(TV, it.q, TS); m.setMatrixAt(i, TM); }); m.instanceMatrix.needsUpdate = true; });
}

/* ---------- Haus bauen ---------- */
let G = {};
function cols(n, k, mode) { // welche Fensterachsen für Balkone oder Türen
  k = clamp(k, 0, n); if (!k) return [];
  if (mode === 'links') return [...Array(k).keys()];
  if (mode === 'rechts') return [...Array(k).keys()].map(i => n - 1 - i);
  if (mode === 'verteilt') { if (k === 1) return [Math.floor((n - 1) / 2)]; return [...Array(k).keys()].map(i => Math.round(i * (n - 1) / (k - 1))); }
  const s = Math.floor((n - k) / 2); return [...Array(k).keys()].map(i => s + i);
}
function ground(x) { return S.gelaende === 'gefaelle' ? -(x + G.Lx / 2) / G.Lx * G.drop : 0; }
function buildHouse() {
  houseG.clear(); groundG.clear();
  const A = ART[S.art], W = S.breite, n = S.fenster, egH = S.decke + A.eg, H = egH + (S.etagen - 1) * S.decke;
  D = clamp(W * 0.55, 9, 16);
  const balk = cols(n, S.etagen > 1 ? S.balkone : 0, S.bplatz), tuer = cols(n, S.tueren, S.tplatz);
  const gap = 0.32 + (balk.length ? 1.55 : 0);
  G = { W, H, egH, n, balk, tuer, gap, Lx: Math.ceil((W + 0.7) / BW) * BW, drop: S.gelaende === 'gefaelle' ? 0.55 : 0 };
  // Untergrund vor dem Haus
  const gm = BODEN[S.boden]; gm.map.repeat.set(G.Lx / 2.2, 2.6);
  const gp = new THREE.Mesh(new THREE.PlaneGeometry(G.Lx + 8, 7.5, 24, 1), gm); gp.rotation.x = -Math.PI / 2; gp.position.set(0, 0.012, -3.4);
  const pa = gp.geometry.attributes.position; for (let i = 0; i < pa.count; i++) pa.setZ(i, ground(pa.getX(i)));   // nach der Drehung zeigt lokales z nach oben
  pa.needsUpdate = true; gp.geometry.computeVertexNormals(); gp.receiveShadow = true; groundG.add(gp);
  // Baukörper: vorne Fassade, sonst weiß
  const fm = FASS[S.fassade]; fm.map.repeat.set(W / 4, H / 4);
  const body = new THREE.Mesh(new THREE.BoxGeometry(W, H + 0.6, D), [M.weiss, M.weiss, M.weiss, M.weiss, M.weiss, fm]);
  body.position.set(0, (H - 0.6) / 2, D / 2); body.castShadow = body.receiveShadow = true; houseG.add(body);
  // Sockel und Gesims
  const sock = new THREE.Mesh(new THREE.BoxGeometry(W + 0.06, 0.55, D + 0.06), M.weiss); sock.position.set(0, 0.27, D / 2); houseG.add(sock);
  if (S.art === 'altbau') for (let f = 1; f < S.etagen; f++) { const gs = new THREE.Mesh(new THREE.BoxGeometry(W + 0.16, 0.14, 0.16), M.weiss); gs.position.set(0, egH + (f - 1) * S.decke - 0.05, -0.05); gs.castShadow = true; houseG.add(gs); }
  // Fenster, Balkontüren, Haustüren
  const margin = Math.min(1.2, W * 0.07), colW = (W - 2 * margin) / n;
  const fw = Math.min(colW * 0.62, A.fw * 3), glasF = S.fassade === 'glas';
  const frames = [], panes = [];
  for (let f = 0; f < S.etagen; f++) {
    const y0 = f === 0 ? 0.55 : egH + (f - 1) * S.decke, fh = f === 0 ? egH : S.decke;
    for (let c = 0; c < n; c++) {
      const x = -W / 2 + margin + (c + 0.5) * colW;
      if (f === 0 && tuer.includes(c)) { // Haustür mit Vordach
        const dw = Math.min(1.5, colW * 0.8), dh = Math.min(2.5, fh - 0.35);
        const dr = new THREE.Mesh(new THREE.BoxGeometry(dw, dh, 0.1), M.tuer); dr.position.set(x, dh / 2 + 0.05, -0.02); houseG.add(dr);
        const fr = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.24, dh + 0.12, 0.12), M.rahmen); fr.position.set(x, dh / 2 + 0.08, 0.01); houseG.add(fr);
        const vd = new THREE.Mesh(new THREE.BoxGeometry(dw + 0.9, 0.1, 0.9), M.weiss); vd.position.set(x, dh + 0.35, -0.45); vd.castShadow = true; houseG.add(vd);
        continue;
      }
      const isBalk = f > 0 && balk.includes(c);
      const ww = glasF ? colW * 0.92 : fw * (isBalk ? 0.9 : 1), wh = glasF ? fh * 0.78 : isBalk ? Math.min(2.3, fh - 0.4) : fh * A.fh;
      const wy = glasF ? y0 + fh * 0.5 : isBalk ? y0 + wh / 2 + 0.06 : y0 + fh * 0.36 + wh / 2;
      frames.push([x, wy, ww + 0.12, wh + 0.12]); panes.push([x, wy, ww, wh]);
    }
  }
  const fr = new THREE.InstancedMesh(GEO.box, M.rahmen, frames.length), pn = new THREE.InstancedMesh(GEO.box, M.glas, panes.length);
  frames.forEach(([x, y, w, h], i) => { TM.compose(TV.set(x, y, -0.03), TQ.identity(), TS.set(w, h, 0.06)); fr.setMatrixAt(i, TM); });
  panes.forEach(([x, y, w, h], i) => { TM.compose(TV.set(x, y, -0.066), TQ.identity(), TS.set(w, h, 0.01)); pn.setMatrixAt(i, TM); });
  fr.castShadow = true; fr.receiveShadow = true; houseG.add(fr, pn);
  // Balkone
  balk.forEach(c => { const x = -W / 2 + margin + (c + 0.5) * colW, bw = Math.min(colW * 0.95, 3.2);
    for (let f = 1; f < S.etagen; f++) { const y = egH + (f - 1) * S.decke;
      const sl = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.18, 1.45), M.weiss); sl.position.set(x, y + 0.02, -0.72); sl.castShadow = sl.receiveShadow = true; houseG.add(sl);
      const rl = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.05, 0.05), M.gelaender); rl.position.set(x, y + 1.05, -1.42); houseG.add(rl);
      const gl = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.9, 0.02), new THREE.MeshStandardMaterial({ color: '#cfd6dc', transparent: true, opacity: 0.35, roughness: 0.1 })); gl.position.set(x, y + 0.56, -1.42); houseG.add(gl);
      [-1, 1].forEach(sd => { const sg = new THREE.Mesh(new THREE.BoxGeometry(0.04, 1.0, 1.4), M.gelaender); sg.position.set(x + sd * bw / 2, y + 0.6, -0.72); houseG.add(sg); }); } });
  // Dach
  if (A.dach === 'mansarde') {
    const rh = 3.6, inset = 1.3, sh = new THREE.Shape(); sh.moveTo(0, 0); sh.lineTo(inset, rh); sh.lineTo(D - inset, rh); sh.lineTo(D, 0); sh.lineTo(0, 0);
    const rg = new THREE.ExtrudeGeometry(sh, { depth: W, bevelEnabled: false }); rg.rotateY(-Math.PI / 2); rg.translate(W / 2, 0, 0);
    const roof = new THREE.Mesh(rg, M.dach); roof.position.set(0, H, 0); roof.rotation.y = 0; roof.castShadow = roof.receiveShadow = true;
    roof.geometry.computeBoundingBox(); const bb = roof.geometry.boundingBox; roof.position.x -= (bb.max.x + bb.min.x) / 2; roof.position.z -= bb.min.z; houseG.add(roof);
    for (let c = 0; c < n; c += 2) { const x = -W / 2 + margin + (c + 0.5) * colW; const dm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.5, 1.1), M.weiss); dm.position.set(x, H + 1.35, 0.95); dm.castShadow = true; houseG.add(dm);
      const dg = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.05), M.glas); dg.position.set(x, H + 1.35, 0.38); houseG.add(dg); }
  } else {
    const at = new THREE.Mesh(new THREE.BoxGeometry(W + 0.2, 0.7, D + 0.2), M.weiss); at.position.set(0, H + 0.35, D / 2); at.castShadow = true; houseG.add(at);
  }
  G.roofTop = A.dach === 'mansarde' ? H + 3.6 : H + 0.7;
}

/* ---------- Gerüst bauen ---------- */
function maxLagen() { return Math.max(1, Math.ceil((G.H - 0.3 - BASE) / LH)); }
function buildScaffold(animate) {
  parts = [];
  const nF = Math.round(G.Lx / BW), x0 = -G.Lx / 2, zi = -G.gap, zo = zi - DEP, L = S.lagen;
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  for (let i = 0; i <= nF; i++) { const x = x0 + i * BW, g = ground(x);
    [zi, zo].forEach(z => { box('fuss', V(x, g + 0.012, z), V(0.16, 0.025, 0.16), 0); tube('f', V(x, g + 0.02, z), V(x, BASE, z), 0, 'fuss'); });
    if (S.boden === 'rasen' || S.boden === 'schotter') box('bohle', V(x, g - 0.01, (zi + zo) / 2), V(0.28, 0.05, DEP + 0.6), 0);
    for (let l = 0; l < L; l++) { const ya = BASE + l * LH, yb = ya + LH; [zi, zo].forEach(z => tube('s', V(x, ya, z), V(x, yb, z), l + 1)); tube('q', V(x, yb, zi), V(x, yb, zo), l + 1); }
    [zi, zo].forEach(z => tube('s', V(x, BASE + L * LH, z), V(x, BASE + L * LH + 1.0, z), L + 1));   // Geländerpfosten oben
  }
  for (let l = 1; l <= L; l++) { const y = BASE + l * LH;
    for (let f = 0; f < nF; f++) { const xa = x0 + f * BW, xm = xa + BW / 2;
      box('belag', V(xm, y + 0.03, (zi + zo) / 2), V(BW - 0.04, 0.05, DEP - 0.1), l);
      tube('g', V(xa, y + 1.0, zo), V(xa + BW, y + 1.0, zo), l); tube('g', V(xa, y + 0.5, zo), V(xa + BW, y + 0.5, zo), l);
      box('bord', V(xm, y + 0.12, zo + 0.03), V(BW - 0.04, 0.15, 0.025), l);
      if (f % 5 === 0) tube('d', V(xa, y - LH, zo), V(xa + BW, y, zo), l);
    }
    [x0, x0 + G.Lx].forEach(x => { tube('g', V(x, y + 1.0, zi), V(x, y + 1.0, zo), l); tube('g', V(x, y + 0.5, zi), V(x, y + 0.5, zo), l); });
    if (l % 2 === 0 || l === L) for (let i = 0; i <= nF; i += 2) { const x = x0 + i * BW; if (Math.abs(x) <= G.W / 2) tube('a', V(x, y + 0.3, zi), V(x, y + 0.3, 0.02), l, 'anker'); }
    // Leiterfeld: Leiter in jeder Lage
    const xa = x0 + BW; for (let r = 0; r < 7; r++) { const yy = y - LH + 0.28 * (r + 1); tube('l', V(xa + 0.5, yy, zi - 0.22), V(xa + 0.95, yy, zi - 0.22), l, 'fuss'); }
    tube('l', V(xa + 0.5, y - LH, zi - 0.22), V(xa + 0.5, y, zi - 0.22), l, 'fuss'); tube('l', V(xa + 0.95, y - LH, zi - 0.22), V(xa + 0.95, y, zi - 0.22), l, 'fuss');
  }
  if (S.netz) box('netz', V(0, (BASE + L * LH + 1) / 2 + 0.2, zo - 0.06), V(G.Lx + 0.1, BASE + L * LH + 0.6, 0.01), L + 1);
  flushParts();
  anim = animate ? 0 : 1; animT0 = performance.now(); needs = true;
}

/* ---------- Kennzahlen (unverbindlich) ---------- */
function info() {
  const nF = Math.round(G.Lx / BW), hg = BASE + S.lagen * LH + 1.0, A = G.Lx * hg;
  let anker = 0; for (let l = 1; l <= S.lagen; l++) if (l % 2 === 0 || l === S.lagen) for (let i = 0; i <= nF; i += 2) if (Math.abs(-G.Lx / 2 + i * BW) <= G.W / 2) anker++;
  const rows = [
    ['Gerüstfläche', 'ca. ' + fmt(Math.round(A / 5) * 5) + ' m²'],
    ['Länge × Höhe', fmt(G.Lx, 1) + ' × ' + fmt(hg, 1) + ' m'],
    ['Felder · Ebenen', nF + ' · ' + S.lagen],
    ['Verankerungen', 'ca. ' + anker],
    ['Abstand zur Fassade', fmt(G.gap, 2) + ' m' + (G.balk.length ? ' (Balkone)' : '')],
    ['Untergrund', LABEL[S.boden] + ((S.boden === 'rasen' || S.boden === 'schotter') ? ', mit Bohlen' : '') + (S.gelaende === 'gefaelle' ? ', Gefälle' : '')],
  ];
  $('#pl-out').innerHTML = rows.map(r => `<div><dt class="mono">${r[0]}</dt><dd>${r[1]}</dd></div>`).join('');
  const deck = S.lagen < maxLagen() ? ` (bis ${fmt(BASE + S.lagen * LH, 1)} m, Haus ${fmt(G.H, 1)} m)` : ` (bis über die Traufe)`;
  $('[data-v="lagen"]').textContent = S.lagen + deck;
  const body = ['Hallo Neumann Team,', '', 'ich habe im Gerüstplaner auf der Website ein Gerüst zusammengestellt:', '',
    'Gebäude: ' + ART[S.art].label + ', ' + S.etagen + ' Geschosse, ' + S.breite + ' m breit, Deckenhöhe ' + fmt(S.decke, 1) + ' m',
    'Fassade: ' + LABEL[S.fassade] + ', ' + S.fenster + ' Fenster je Etage, ' + G.balk.length + ' Balkone je Etage (' + LABEL[S.bplatz] + '), ' + S.tueren + ' Haustür(en) (' + LABEL[S.tplatz] + ')',
    'Gerüst: ' + S.lagen + ' Ebenen, Untergrund ' + LABEL[S.boden] + ', Gelände ' + LABEL[S.gelaende] + (S.netz ? ', mit Netz' : ''),
    'Gerüstfläche laut Planer ca. ' + fmt(Math.round(A / 5) * 5) + ' m² (unverbindlich)', '', 'Link zur Planung: ' + shareUrl(), '', 'Adresse der Baustelle:', 'Gewünschter Zeitraum:', '', 'Viele Grüße'];
  $('#pl-mail').href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent('Anfrage aus dem Gerüstplaner') + '&body=' + encodeURIComponent(body.join('\n'));
}

/* ---------- Bedienung ---------- */
const KEYS = { art: 'a', breite: 'b', etagen: 'e', decke: 'd', fassade: 'f', fenster: 'w', balkone: 'k', bplatz: 'kp', tueren: 't', tplatz: 'tp', boden: 'u', gelaende: 'g', lagen: 'l', netz: 'n' };
function shareUrl() { const p = new URLSearchParams(); Object.entries(KEYS).forEach(([k, s]) => p.set(s, typeof S[k] === 'boolean' ? (S[k] ? 1 : 0) : S[k]));
  return location.origin + location.pathname + '#planer=' + p.toString(); }
function readHash() { const m = location.hash.match(/#planer=(.*)$/); if (!m) return false; const p = new URLSearchParams(m[1]);
  Object.entries(KEYS).forEach(([k, s]) => { if (!p.has(s)) return; const v = p.get(s); S[k] = typeof S[k] === 'number' ? +v : typeof S[k] === 'boolean' ? v === '1' : v; }); return true; }
function syncUI() {
  form.querySelectorAll('[data-k]').forEach(g => g.querySelectorAll('button').forEach(b => { const on = b.dataset.val === S[g.dataset.k]; b.classList.toggle('is-on', on); b.setAttribute('aria-pressed', on); }));
  form.querySelectorAll('input[type=range]').forEach(r => { if (r.name in S) r.value = S[r.name]; });
  const fe = form.querySelector('[name=fenster]'), ba = form.querySelector('[name=balkone]'), la = form.querySelector('[name=lagen]');
  fe.max = Math.max(1, Math.floor((S.breite - 1) / 1.6)); ba.max = S.fenster; la.max = maxLagen(); form.querySelector('[name=tueren]').max = Math.min(4, S.fenster);
  form.querySelector('[name=netz]').checked = S.netz;
  const lb = { breite: fmt(S.breite) + ' m', etagen: S.etagen + ' (' + fmt(G.H || 0, 1) + ' m)', decke: fmt(S.decke, 1) + ' m', fenster: S.fenster, balkone: S.etagen > 1 ? S.balkone : '0 (nur EG)', tueren: S.tueren };
  Object.entries(lb).forEach(([k, v]) => { const e = form.querySelector(`[data-v="${k}"]`); if (e) e.textContent = v; });
  form.querySelector('[data-k="bplatz"]').classList.toggle('is-dim', !S.balkone || S.etagen < 2);
}
function rebuild(opts = {}) {
  S.fenster = clamp(S.fenster, 1, Math.max(1, Math.floor((S.breite - 1) / 1.6))); S.balkone = clamp(S.balkone, 0, S.fenster); S.tueren = clamp(S.tueren, 1, Math.min(4, S.fenster));
  buildHouse();
  const mx = maxLagen(); if (!S.lagen || opts.fullScaffold || S.lagen > mx) S.lagen = mx;
  syncUI(); buildScaffold(opts.animate !== false); info(); if (opts.frame) frameCamera();
}
form.addEventListener('click', e => { const b = e.target.closest('[data-k] button'); if (!b) return; const k = b.closest('[data-k]').dataset.k; S[k] = b.dataset.val;
  if (k === 'art') { const A = ART[S.art]; S.decke = A.decke; S.fassade = A.fassade; S.balkone = A.balkone; S.fenster = Math.max(1, Math.round(S.breite * A.fenster)); rebuild({ fullScaffold: true, frame: true }); }
  else rebuild({ fullScaffold: false }); });
let rt = 0;
form.addEventListener('input', e => { const t = e.target; if (!(t.name in S)) return;
  S[t.name] = t.type === 'checkbox' ? t.checked : +t.value;
  if (t.name === 'breite') S.fenster = Math.max(1, Math.round(S.breite * ART[S.art].fenster));
  const big = ['breite', 'etagen', 'decke'].includes(t.name);
  clearTimeout(rt); syncUI(); rt = setTimeout(() => rebuild({ fullScaffold: big, frame: big }), 60); });
$('#pl-tools').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; const a = b.dataset.act;
  if (a === 'zufall') { const arts = Object.keys(ART); S.art = arts[Math.random() * 3 | 0]; const A = ART[S.art]; S.breite = 10 + (Math.random() * 30 | 0); S.etagen = 2 + (Math.random() * 6 | 0);
    S.decke = A.decke; S.fassade = ['putz', 'klinker', 'naturstein', 'glas'][Math.random() * 4 | 0]; S.fenster = Math.max(2, Math.round(S.breite * A.fenster));
    S.balkone = S.art === 'gewerbe' ? 0 : Math.random() * Math.min(4, S.fenster) | 0; S.bplatz = ['mitte', 'verteilt', 'links', 'rechts'][Math.random() * 4 | 0];
    S.tueren = 1 + (Math.random() * 2 | 0); S.tplatz = ['mitte', 'verteilt'][Math.random() * 2 | 0]; S.boden = ['asphalt', 'pflaster', 'rasen', 'schotter'][Math.random() * 4 | 0];
    S.gelaende = Math.random() < 0.3 ? 'gefaelle' : 'eben'; S.netz = Math.random() < 0.3; rebuild({ fullScaffold: true, frame: true }); }
  if (a === 'front') { orbit.az = 0; orbit.el = 0.18; needs = true; }
  if (a === 'bild') { renderer.render(scene, camera); const l = document.createElement('a'); l.download = 'neumann-geruestplaner.png'; l.href = canvas.toDataURL('image/png'); l.click(); }
  if (a === 'link') { const u = shareUrl(); history.replaceState(null, '', '#planer=' + u.split('#planer=')[1]);
    (navigator.clipboard ? navigator.clipboard.writeText(u) : Promise.reject()).then(() => { b.textContent = 'Link kopiert'; setTimeout(() => b.textContent = 'Link teilen', 1600); }, () => prompt('Link zur Planung:', u)); }
});

/* ---------- Kamera: ziehen zum Drehen, Rad oder zwei Finger zum Zoomen ---------- */
const orbit = { az: -0.55, el: 0.2, dist: 40, tAz: -0.55, tEl: 0.2, tDist: 40, target: new THREE.Vector3(0, 6, 4) };
function frameCamera() { const s = Math.max(G.W * 0.9, (G.roofTop || 15) * 1.4) + 12; orbit.tDist = clamp(s, 18, 110); orbit.target.set(0, (G.roofTop || 15) * 0.42, D * 0.25); needs = true; }
let drag = null, pinch = 0, needs = true;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => { if (!drag || pinch) return; orbit.tAz = clamp(orbit.tAz - (e.clientX - drag.x) * 0.006, -1.35, 1.35); orbit.tEl = clamp(orbit.tEl + (e.clientY - drag.y) * 0.004, 0.02, 1.1); drag = { x: e.clientX, y: e.clientY }; needs = true; });
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', e => { e.preventDefault(); orbit.tDist = clamp(orbit.tDist * (1 + Math.sign(e.deltaY) * 0.08), 12, 130); needs = true; }, { passive: false });
canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); }, { passive: true });
canvas.addEventListener('touchmove', e => { if (e.touches.length !== 2 || !pinch) return; const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
  orbit.tDist = clamp(orbit.tDist * pinch / d, 12, 130); pinch = d; needs = true; }, { passive: true });
canvas.addEventListener('touchend', e => { if (e.touches.length < 2) pinch = 0; });

function resize() { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = w < 600 ? 46 : 36; camera.updateProjectionMatrix(); needs = true; }
addEventListener('resize', resize);
let visible = true;
if ('IntersectionObserver' in window) new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible) needs = true; }, { rootMargin: '200px' }).observe(canvas);
function frame(now) {
  requestAnimationFrame(frame);
  if (!visible) return;
  const k = 0.14;
  ['az', 'el', 'dist'].forEach(p => { const T = 't' + p[0].toUpperCase() + p.slice(1); const d = orbit[T] - orbit[p]; if (Math.abs(d) > 1e-4) { orbit[p] += d * k; needs = true; } });
  if (anim < 1) { anim = Math.min(1, (now - animT0) / 1600); updateParts(); needs = true; }
  if (!needs) return; needs = false;
  const t = orbit.target, c = Math.cos(orbit.el);
  camera.position.set(t.x + Math.sin(orbit.az) * c * orbit.dist, t.y + Math.sin(orbit.el) * orbit.dist, t.z - Math.cos(orbit.az) * c * orbit.dist);
  camera.lookAt(t);
  renderer.render(scene, camera);
}
const fromLink = readHash();
resize(); rebuild({ fullScaffold: !fromLink, frame: true, animate: false });
orbit.az = orbit.tAz; orbit.el = orbit.tEl; orbit.dist = orbit.tDist;
// Aufbau abspielen, wenn der Planer ins Bild kommt
let shown = false;
if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (es[0].isIntersecting && !shown) { shown = true; buildScaffold(true); } }, { threshold: 0.35 }).observe(canvas);
requestAnimationFrame(frame);
window.NeumannPlaner = { S, rebuild };
}
