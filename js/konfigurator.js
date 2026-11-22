// Gerüstarten erleben: 3D Konfigurator mit sechs Gerüsttypen, animiertem Aufbau, Röntgenblick und Explosionsansicht.
// Alle Gerüste werden aus echten Bauteilmaßen gebaut (Feld 2,57 m, Lage 2,0 m, Rohr 48,3 mm, Belagbreite 0,73 m).
import * as THREE from 'three';
import { GLTFLoader } from '../assets/vendor/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from '../assets/vendor/jsm/meshopt_decoder.module.js';

const BW = 2.57, LH = 2.0, DEP = 0.73, GAP = 0.3, R48 = 0.0242;
const DACH_LV = 9, DACH_ZB = 12.4, DACH_RISE = 4.2;   // Wetterschutzdach: über Gauben und Schornsteine, hinten vor den Hofbalkonen
const HOUSE = { x0: -8, x1: 8, d: 11, eave: 15.2 };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t * t * (3 - 2 * t);
const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

/* ---------- Bauteile: Name, Erklärung, Farbe im Röntgenblick, Richtung in der Explosionsansicht ---------- */
const PARTS = {
  'Stiel':        { txt: 'Senkrechtes Rohr, trägt die Last bis in den Boden.', col: '#6461ff', ex: [0, 0, 0] },
  'Riegel':       { txt: 'Waagerechte Verbindung zwischen den Stielen, hält das Gerüst in Form.', col: '#22c3ee', ex: [0, 0.5, 0] },
  'Diagonale':    { txt: 'Schräge Aussteifung, verhindert, dass das Gerüst seitlich kippt.', col: '#f59e0b', ex: [0, 0, -2.2] },
  'Belag':        { txt: 'Stahlboden, auf dem gearbeitet wird. Rutschfest gelocht.', col: '#a3e635', ex: [0, 0.9, 0] },
  'Geländer':     { txt: 'Seitenschutz in 1,0 m und 0,5 m Höhe gegen Absturz.', col: '#f43f5e', ex: [0, 0, -1.2] },
  'Bordbrett':    { txt: 'Fußleiste am Belag, damit kein Werkzeug herunterfällt.', col: '#fb923c', ex: [0, 0, -1.7] },
  'Verankerung':  { txt: 'Verbindet das Gerüst mit der Fassade, nimmt Wind und Zug auf.', col: '#e879f9', ex: [0, 0, 1.0] },
  'Fußspindel':   { txt: 'Höhenverstellbarer Fuß mit Fußplatte, gleicht Unebenheiten aus.', col: '#10b981', ex: [0, -0.9, 0] },
  'Leiter':       { txt: 'Innenliegender Aufstieg zwischen den Lagen.', col: '#facc15', ex: [0, 0, 0.6] },
  'Lenkrolle':    { txt: 'Feststellbare Rolle, damit das Gerüst verschoben werden kann.', col: '#94a3b8', ex: [0, -0.9, 0] },
  'Ausleger':     { txt: 'Seitliche Stütze, vergrößert die Standfläche gegen Kippen.', col: '#f59e0b', ex: [0, 0, 0] },
  'Kragträger':   { txt: 'Stahlträger, der vom Dach auskragt und das Gerüst hält.', col: '#e879f9', ex: [0, 1.0, 0] },
  'Abhängung':    { txt: 'Zugstange, an der die Arbeitsbühne hängt.', col: '#22c3ee', ex: [0, 0, -0.8] },
  'Treppe':       { txt: 'Treppenlauf mit Podest, sicherer Zugang ohne Leiter.', col: '#a3e635', ex: [0, 0, -1.4] },
  'Fachwerkträger': { txt: 'Leichter Träger, überspannt große Breiten ohne Stützen.', col: '#22c3ee', ex: [0, 1.4, 0] },
  'Pfette':       { txt: 'Längsträger im Dach, auf dem die Plane liegt.', col: '#f59e0b', ex: [0, 2.0, 0] },
  'Decke':        { txt: 'Hallendecke, unter der gearbeitet wird.', col: '#64748b', ex: [0, 0, 0] },
};

/* ---------- die sechs Gerüstarten ---------- */
const TYPES = [
  { id: 'fassade', name: 'Fassadengerüst', kurz: 'Für Putz, Anstrich, Dämmung und Fenster.',
    text: 'Das klassische Arbeits- und Schutzgerüst vor der Fassade. Lage für Lage aufgebaut und in der Wand verankert. Typisch für Sanierung, Malerarbeiten und Wärmedämmung.',
    facts: [['Lastklasse', 'typisch 3 bis 4'], ['Feldlänge', '2,57 m'], ['Höhe hier', '14 m, 7 Lagen']], cam: [19, 8.5, -11.6, -1.5, 8.6, 0] },
  { id: 'roll', name: 'Rollgerüst', kurz: 'Schnell versetzbar für kurze Arbeiten.',
    text: 'Fahrbarer Turm auf feststellbaren Rollen mit Auslegern gegen Kippen. Ideal für Innenausbau, Leuchten, Decken und kleine Arbeiten an der Fassade.',
    facts: [['Lastklasse', 'typisch 2 bis 3'], ['Grundfläche', '2,0 × 1,35 m'], ['Höhe hier', '8 m']], cam: [7, 4.5, -11.6, -3, 4.4, -3.5] },
  { id: 'haenge', name: 'Hängegerüst', kurz: 'Wo kein tragfähiger Boden ist.',
    text: 'Die Arbeitsbühne hängt an Kragträgern vom Dach oder von einem Bauwerk. Für Brücken, Vordächer, Höfe und Fassaden über Glasdächern oder Verkehrsflächen.',
    facts: [['Lastklasse', 'typisch 2 bis 3'], ['Abhängung', 'Zugstangen'], ['Bühne hier', '3 Felder']], cam: [14, 10, -11.6, 0, 11.8, 0] },
  { id: 'raum', name: 'Raumgerüst', kurz: 'Eine ganze Arbeitsebene unter der Decke.',
    text: 'Flächiges Gerüst in Hallen, Kirchen, Treppenhäusern und unter Decken. Oben entsteht ein durchgehender Boden, auf dem frei gearbeitet werden kann.',
    facts: [['Lastklasse', 'typisch 3 bis 6'], ['Raster', '2,57 × 2,57 m'], ['Arbeitshöhe', '8 m']], cam: [20, 9, -11.6, 0, 4.5, 4] },
  { id: 'treppe', name: 'Treppenturm', kurz: 'Sicherer Aufstieg für viele Personen.',
    text: 'Treppenlauf mit Podesten in einem eigenen Gerüstturm. Ersetzt Leitern, wenn viele Menschen oder Material sicher nach oben müssen.',
    facts: [['Laufbreite', 'ca. 0,6 m'], ['Podest', 'jede Lage'], ['Höhe hier', '14 m']], cam: [8, 7, -11.6, -9.6, 7.5, -0.8] },
  { id: 'dach', name: 'Wetterschutzdach', kurz: 'Arbeiten bei jedem Wetter.',
    text: 'Leichte Fachwerkträger überspannen das ganze Gebäude, darauf liegt eine Plane. Für Dachsanierungen und Rohbau, damit Regen und Schnee draußen bleiben.',
    facts: [['Spannweite hier', '14,4 m'], ['Eindeckung', 'Plane'], ['Stützenfrei', 'über dem Dach']], cam: [21, 16, -11.6, 0, 13.5, 5.5] },
];

/* ---------- Grundgerüst der Szene ---------- */
const canvas = document.getElementById('konfig');
const FILM = new URLSearchParams(location.search).has('film');   // Filmmodus: Bild für Bild steuerbar für den Erklärfilm
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: FILM });
let loaded = 0; const LOADED_ALL = 12;
let crit = 0; const CRIT_ALL = 4; let fades = [];   // crit: Himmel, Straße, Gebäude, Haus (darauf wartet der Ladebildschirm)
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 4000);

/* ---------- Himmel mit Wolken (Poly Haven kloppenheim_06_puresky, CC0) und Sonne passend zum Panorama ---------- */
// Das Panorama ist so gedreht, dass die tiefe Nachmittagssonne flach von links über die Fassade streicht.
const SUN_DIR = new THREE.Vector3(-0.884, 0.423, -0.204).normalize();
const HAZE = new THREE.Color('#b7c3d0');
scene.background = HAZE.clone(); scene.fog = new THREE.Fog(HAZE, 110, 900);
const pmrem = new THREE.PMREMGenerator(renderer);
const loader = new THREE.TextureLoader();
loader.load('assets/konfig/himmel.webp?v=1', t => {
  t.mapping = THREE.EquirectangularReflectionMapping; t.colorSpace = THREE.SRGBColorSpace;
  scene.background = t; scene.backgroundIntensity = 1.55; scene.environment = pmrem.fromEquirectangular(t).texture; needs = true; loaded++; crit++;
}, undefined, () => { loaded++; crit++; });
scene.environmentIntensity = 0.75;
renderer.toneMappingExposure = 0.62;
const sun = new THREE.DirectionalLight('#ffd6a6', 4.4);
sun.position.copy(SUN_DIR).multiplyScalar(70).add(new THREE.Vector3(0, 0, 4));
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.00025; sun.shadow.normalBias = 0.03;
Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -30, near: 1, far: 180 });
scene.add(sun, sun.target); sun.target.position.set(0, 4, 2);
scene.add(new THREE.HemisphereLight('#c3d4ee', '#5a4a38', 0.25));

function tex(url, rx, ry, srgb = true) {
  const t = loader.load(url, () => { needs = true; });
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.anisotropy = 8;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ---------- Umgebung aus Blender: Straße, Park, Bäume (strasse_park.glb) und Häuser der Nachbarschaft (gebaeude.glb) ---------- */
const gltf = new GLTFLoader(); gltf.setMeshoptDecoder(MeshoptDecoder);
const ground = new THREE.Mesh(new THREE.CircleGeometry(900, 48), new THREE.MeshStandardMaterial({ color: '#7d8a6e', roughness: 1 }));
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.2; ground.receiveShadow = true; scene.add(ground);   // Rückfall unter allem
function prepEnv(root) {
  root.updateMatrixWorld(true);
  root.traverse(o => {
    if (!o.isMesh) return;
    if (o.isInstancedMesh && /Baum|Busch|Laterne|Poller|Fahrrad/i.test(o.name + ' ' + (o.parent ? o.parent.name : ''))) {
      // freie Sicht auf das Neumann Haus: Straßenbäume und Möbel direkt vor dem Gerüst ausblenden
      const m = new THREE.Matrix4(), p = new THREE.Vector3(), zero = new THREE.Matrix4().makeScale(0, 0, 0); let hid = 0;
      for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, m); p.setFromMatrixPosition(m).applyMatrix4(o.matrixWorld);
        if (p.z > -6.2 && p.z < 0.6 && p.x > -21 && p.x < 23 && /Baum/i.test(o.name + (o.parent ? o.parent.name : ''))) { o.setMatrixAt(i, zero); hid++; } }
      if (hid) o.instanceMatrix.needsUpdate = true;
    }
    const flat = /Gehweg|Fahrbahn|Markierung|Bordstein|Rinne|Rasen|Wege|Beete|Boden|Strasse|Kanaldeckel|Baumscheiben|Hof_Garten|Hinterhoefe/i.test(o.name);
    o.receiveShadow = true; o.castShadow = !flat;
    if (/Markierung|Flicken|Kanaldeckel/i.test(o.name)) {   // gegen Flimmern auf der Fahrbahn
      o.material = o.material.clone(); Object.assign(o.material, { polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
    }
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (m.map) m.map.anisotropy = 8;
      if (m.aoMap) m.aoMapIntensity = 0.9;
      if (m.alphaTest > 0) {   // nur Blattkarten (alphaMode MASK); Schaufenster (BLEND) bleiben durchsichtig
        m.alphaTest = Math.max(m.alphaTest, 0.5); m.side = THREE.DoubleSide;
        // Blattkarten: Rückseiten nicht abdunkeln (Normale nicht umdrehen), Krone wirkt sonst von unten schwarz
        if (!m.userData.leafFix) { m.userData.leafFix = 1; m.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <normal_fragment_begin>', THREE.ShaderChunk.normal_fragment_begin.replace(/normal \*= faceDirection;/g, '').replace(/bitangent = bitangent \* faceDirection;|tangent = tangent \* faceDirection;/g, '')); }; m.needsUpdate = true; }
        o.customDepthMaterial = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: m.map, alphaTest: 0.5 });
      }
    });
  });
  return root;
}
for (const f of ['strasse_park', 'gebaeude']) gltf.load(`assets/konfig/${f}.glb?v=4`, g => { scene.add(prepEnv(g.scene)); needs = true; loaded++; crit++; }, undefined, () => { loaded++; crit++; });

/* ---------- Berliner Skyline am Horizont (Modelle aus Earth 3D) ---------- */
const SKY_LINE = [ // Name, Höhe in m, x, z (three.js), Drehung
  ['fernsehturm', 368, 520, 1750, 0], ['hotel_alexanderplatz', 125, 395, 1820, 0.5], ['haus_des_lehrers', 54, 610, 1640, 0.2],
  ['berolinahaus', 32, 455, 1690, 0.5], ['alexanderhaus', 32, 430, 1640, 0.5], ['kaufhaus_alexanderplatz', 38, 360, 1720, 0.4], ['haus_des_reisens', 70, 660, 1730, 0.1],
];
const hazeMix = (m, k) => { m = m.clone(); if (m.color) m.color.lerp(HAZE, k); m.fog = false; m.roughness = 1; m.metalness = 0; return m; };
function loadSkyline() { SKY_LINE.forEach(([n, h, x, z, r]) => gltf.load(`assets/konfig/skyline/${n}.glb`, g => {
  const o = g.scene, bb = new THREE.Box3().setFromObject(o), k = h / Math.max(0.01, bb.max.y - bb.min.y);
  o.scale.setScalar(k); o.position.set(x, -bb.min.y * k, z); o.rotation.y = r;
  o.traverse(c => { if (c.isMesh) { c.material = hazeMix(c.material, 0.52); c.castShadow = c.receiveShadow = false; } });
  scene.add(o); fadeIn(o); needs = true; loaded++;
}, undefined, () => { loaded++; })); }

/* ---------- Verkehr: volle Automodelle, zwei Fahrspuren mit festem Abstand, Parkstreifen gegenüber ---------- */
const CARS = ['kompakt', 'kombi', 'limousine', 'suv', 'taxi', 'transporter'];
const PAINT = ['#16181c', '#e9e9e7', '#7d8288', '#22314f', '#6d1a16', '#3a463a', '#c8c0ae', '#0e0f11', '#a9adb2'];
const ROAD_Y = -0.12, LANE = [{ z: -7.3, dir: 1, v: 10.5 }, { z: -10.7, dir: -1, v: 9.0 }], PARK_Z = -13.5;
const traffic = [], carProtos = {}, carWraps = [];
function carClone(n, i) {
  const p = carProtos[n]; if (!p) return null; const c = p.clone(true);
  c.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true;
    if (/lack/i.test(o.material.name) && n !== 'taxi') { o.material = o.material.clone(); o.material.color.set(PAINT[i % PAINT.length]); } } });
  // Fahrtrichtung aus den Rädern bestimmen: von hinten (rad_h*) nach vorne (rad_v*)
  c.updateMatrixWorld(true); const v = new THREE.Vector3(), h = new THREE.Vector3(); let nv = 0, nh = 0;
  const ctr = o => new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3());   // Mitte der Radgeometrie (Knoten liegen teils alle im Ursprung)
  c.traverse(o => { if (/^rad_v[lr]$/i.test(o.name)) { v.add(ctr(o)); nv++; } if (/^rad_h[lr]$/i.test(o.name)) { h.add(ctr(o)); nh++; } });
  const wrap = new THREE.Group(), mid = new THREE.Group(); mid.add(c); wrap.add(mid);
  if (nv && nh) { const f = v.divideScalar(nv).sub(h.divideScalar(nh)); mid.rotation.y = Math.atan2(f.z, f.x); }   // Front zeigt danach nach +x
  const bb = new THREE.Box3().setFromObject(wrap); c.position.y -= bb.min.y;
  scene.add(wrap); carWraps.push(wrap); return wrap;
}
function loadCars() { Promise.all(CARS.concat(['bus']).map(n => new Promise(res => gltf.load(`assets/konfig/autos/${n}.glb?v=2`, g => { carProtos[n] = g.scene; res(); }, undefined, res)))).then(() => {
  let i = 0;
  const LITE = window.matchMedia('(max-width: 860px)').matches;   // Handy: weniger Autos
  for (let x = -46; x < 48; x += LITE ? 12.4 : 6.2) { if (R01(i) < 0.18) { i++; continue; } const w = carClone(CARS[i % CARS.length], i + 2); if (w) { w.position.set(x, ROAD_Y, PARK_Z); w.rotation.y = (i % 3 === 0) ? Math.PI : 0; } i++; }
  LANE.forEach((ln, li) => { const n = LITE ? (li ? 3 : 2) : (li ? 5 : 4); for (let k = 0; k < n; k++) {
    const type = (li === 1 && k === 2) ? 'bus' : CARS[(k * 2 + li * 3) % CARS.length]; const w = carClone(type, k * 3 + li); if (!w) continue;
    traffic.push({ w, ln, x: -90 + k * (180 / n) + li * 11, x0: -90 + k * (180 / n) + li * 11 }); } });
  carWraps.forEach(fadeIn); needs = true; loaded++;
}); }
function R01(i) { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); }
function updateTraffic(dt) {
  for (const t of traffic) { t.x += t.ln.dir * t.ln.v * dt; if (t.x > 95) t.x -= 190; if (t.x < -95) t.x += 190;
    t.w.position.set(t.x, ROAD_Y, t.ln.z); t.w.rotation.y = t.ln.dir > 0 ? 0 : Math.PI; }
}

const house = new THREE.Group(); scene.add(house);
const HW = HOUSE.x1 - HOUSE.x0, HD = HOUSE.d, HE = HOUSE.eave;
const wallFront = new THREE.MeshStandardMaterial({ map: tex('assets/konfig/fassade.webp', HW / 6.114, HE / 7.6), roughness: 0.85, color: '#f1e3cc', transparent: true });
const wallSide = new THREE.MeshStandardMaterial({ map: tex('assets/konfig/seite.webp', HD / 5.278, HE / 7.6), roughness: 0.9, transparent: true });
const roofMat = new THREE.MeshStandardMaterial({ map: tex('assets/konfig/dach.webp', 6, 2), roughness: 0.75, color: '#9aa0ab', transparent: true, side: THREE.DoubleSide });
const flatMat = new THREE.MeshStandardMaterial({ color: '#3b3d42', roughness: 0.8, transparent: true });
(function buildHouse() {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(HW, HE), wallFront); f.position.set(0, HE / 2, 0); f.rotation.y = Math.PI; house.add(f);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(HW, HE), wallSide); b.position.set(0, HE / 2, HD); house.add(b);
  for (const s of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.PlaneGeometry(HD, HE), wallSide); w.position.set(s * HW / 2, HE / 2, HD / 2); w.rotation.y = s * Math.PI / 2; house.add(w);
  }
  const m = 1.7, rh = 3.0; // Mansarde: steile Fläche, oben flach
  const g = new THREE.BufferGeometry(), x0 = HOUSE.x0, x1 = HOUSE.x1;
  const p = [x0, HE, 0, x1, HE, 0, x1, HE + rh, m, x0, HE + rh, m, x1, HE, HD, x0, HE, HD, x0, HE + rh, HD - m, x1, HE + rh, HD - m];
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 2, 1, 0, 3, 2, 4, 6, 5, 4, 7, 6]); g.computeVertexNormals();
  house.add(new THREE.Mesh(g, roofMat));
  const top = new THREE.Mesh(new THREE.PlaneGeometry(HW, HD - 2 * m), flatMat); top.rotation.x = -Math.PI / 2; top.position.set(0, HE + rh, HD / 2); house.add(top);
  for (const s of [-1, 1]) { // Giebelwände der Mansarde
    const gg = new THREE.BufferGeometry(), x = s > 0 ? x1 : x0;
    gg.setAttribute('position', new THREE.Float32BufferAttribute([x, HE, 0, x, HE + rh, m, x, HE + rh, HD - m, x, HE, HD], 3)); gg.setIndex([0, 1, 2, 0, 2, 3]); gg.computeVertexNormals();
    house.add(new THREE.Mesh(gg, new THREE.MeshStandardMaterial({ color: '#6d6158', roughness: 0.9, side: THREE.DoubleSide, transparent: true })));
  }
  for (let i = 0; i < 4; i++) { // Schornsteine
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.7, 1.6, 0.7), new THREE.MeshStandardMaterial({ color: '#8a4b33', roughness: 0.9, transparent: true }));
    c.position.set(x0 + 2.5 + i * 3.7, HE + rh + 0.8, 3.0 + (i % 2) * 5); c.userData.chimney = true; house.add(c);
  }
  house.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();
// Detailliertes Haus aus Blender (echte Fenster, Tür, Stuck, Mansarde). Solange es lädt, steht das einfache Haus.
gltf.load('assets/konfig/haus.glb?v=3', g => {
  const old = [...house.children]; old.forEach(o => house.remove(o));
  g.scene.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.side = THREE.FrontSide; if (m.map) m.map.anisotropy = 8; }); } });
  house.add(g.scene); if (current) house.traverse(o => { if (/schorn|chimney|kamin/i.test(o.name)) o.visible = current.id !== 'dach'; });
  applyXray(); needs = true; loaded++; crit++;
}, undefined, () => { loaded++; crit++; });
// Autos und Skyline erst nach den wichtigen Teilen laden, damit diese die volle Leitung haben
(function extrasWhenReady() { if (crit >= CRIT_ALL || performance.now() > 5000) { loadSkyline(); loadCars(); } else setTimeout(extrasWhenReady, 50); })();
// Weiches Einblenden für Teile, die erst nach dem Ladebildschirm ankommen
function fadeIn(root) {
  if (FILM || !document.documentElement.classList.contains('is-ready')) return;
  const seen = new Set(), mats = [];
  root.traverse(o => { if (o.isMesh) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (seen.has(m)) return; seen.add(m);
    mats.push({ m, op: m.opacity, tr: m.transparent }); m.transparent = true; m.opacity = 0; m.needsUpdate = true; }); });
  fades.push({ mats, t0: performance.now() }); needs = true;
}
const hall = new THREE.Group(); scene.add(hall); hall.visible = false;
(function buildHall() { // offene Halle für das Raumgerüst
  const cm = new THREE.MeshStandardMaterial({ color: '#8f8d88', roughness: 0.92 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(17, 0.45, 12.5), cm); slab.position.set(0, 9.4, 4.5); hall.add(slab);
  for (const [x, z] of [[-8, -1.2], [8, -1.2], [-8, 10.2], [8, 10.2]]) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.6, 9.2, 0.6), cm); c.position.set(x, 4.6, z); hall.add(c); }
  const back = new THREE.Mesh(new THREE.BoxGeometry(17, 9.2, 0.3), cm); back.position.set(0, 4.6, 10.6); hall.add(back);
  hall.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
})();

/* ---------- Bauteil-Baukasten mit Instanzen ---------- */
function stripeTex() {
  const c = document.createElement('canvas'); c.width = 512; c.height = 16; const x = c.getContext('2d');
  for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#f2f0ea' : '#d8262b'; x.fillRect(i * 64, 0, 64, 16); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function deckTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 64; const x = c.getContext('2d');
  x.fillStyle = '#9ea4aa'; x.fillRect(0, 0, 256, 64); x.fillStyle = '#5b6066';
  for (let i = 0; i < 32; i++) for (let j = 0; j < 4; j++) { x.beginPath(); x.ellipse(4 + i * 8, 10 + j * 15, 2.2, 1.2, 0, 0, 7); x.fill(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; return t;
}
const MATS = {
  rohr: new THREE.MeshStandardMaterial({ color: '#c8ccd1', metalness: 0.9, roughness: 0.32 }),
  belag: new THREE.MeshStandardMaterial({ map: deckTex(), metalness: 0.6, roughness: 0.5 }),
  bord: new THREE.MeshStandardMaterial({ map: stripeTex(), roughness: 0.7 }),
  dunkel: new THREE.MeshStandardMaterial({ color: '#2b2e33', metalness: 0.4, roughness: 0.6 }),
  gelb: new THREE.MeshStandardMaterial({ color: '#d9b11e', metalness: 0.3, roughness: 0.5 }),
};
const GEOS = {
  rohr: new THREE.CylinderGeometry(R48, R48, 1, 10),
  belag: new THREE.BoxGeometry(1, 1, 1), bord: new THREE.BoxGeometry(1, 1, 1), dunkel: new THREE.BoxGeometry(1, 1, 1),
  gelb: new THREE.BoxGeometry(1, 1, 1), rad: new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16),
};
class Kit {
  constructor() { this.items = { rohr: [], belag: [], bord: [], dunkel: [], gelb: [], rad: [] }; this.meshes = []; }
  tube(a, b, label, t, r = 1) {
    const d = b.clone().sub(a), len = d.length(); if (len < 1e-4) return;
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize());
    this.items.rohr.push({ p: a.clone().add(b).multiplyScalar(0.5), q, s: V(r, len, r), t, label });
  }
  box(kind, c, size, label, t, rotY = 0) {
    this.items[kind].push({ p: c.clone(), q: new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), rotY), s: size.clone(), t, label });
  }
  wheel(c, label, t) { this.items.rad.push({ p: c.clone(), q: new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), Math.PI / 2), s: V(1, 1, 1), t, label }); }
  finish(group) {
    const all = Object.values(this.items).flat(); const c = new THREE.Vector3();
    all.forEach(it => c.add(it.p)); c.divideScalar(Math.max(1, all.length));
    const span = {}; for (const it of all) { const r = span[it.label] || (span[it.label] = [1e9, -1e9]); r[0] = Math.min(r[0], it.t); r[1] = Math.max(r[1], it.t); }
    for (const it of all) { const r = span[it.label]; it.tn = r[1] > r[0] ? (it.t - r[0]) / (r[1] - r[0]) : 0; }   // Reihenfolge innerhalb der Gruppe (Filmmodus)
    for (const it of all) { // Richtung für die Explosionsansicht: Bauteilgruppe plus Abstand zur Mitte
      const e = PARTS[it.label]?.ex || [0, 0, 0];
      it.ex = V(e[0] + (it.p.x - c.x) * 0.16, e[1] + (it.p.y - c.y) * 0.22, e[2]);
    }
    for (const [k, list] of Object.entries(this.items)) {
      if (!list.length) continue;
      const mat = (k === 'rad' ? MATS.dunkel : MATS[k]).clone();
      const m = new THREE.InstancedMesh(GEOS[k], mat, list.length); m.castShadow = true; m.receiveShadow = true;
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.userData.list = list; m.frustumCulled = false;
      list.forEach((_, i) => m.setColorAt(i, new THREE.Color('#ffffff')));
      group.add(m); this.meshes.push(m);
    }
  }
}
const M4 = new THREE.Matrix4(), TMP = new THREE.Vector3(), SC = new THREE.Vector3();
let filmLab = null, filmHot = null;   // Filmmodus: Fortschritt je Bauteilgruppe, hervorgehobene Gruppen
const FILM_THICK = { 'Fußspindel': 2.2, 'Verankerung': 2.6, 'Diagonale': 1.7 };
function updateKit(kit, prog, expl) {
  for (const m of kit.meshes) {
    const list = m.userData.list;
    for (let i = 0; i < list.length; i++) {
      const it = list[i]; const lp = filmLab ? (filmLab[it.label] ?? 1) : null;
      const e = lp === null ? ease(clamp((prog - it.t) / 0.07, 0, 1)) : ease(clamp((lp * 1.2 - it.tn) / 0.2, 0, 1));
      TMP.copy(it.p).addScaledVector(it.ex, expl * 2.6); TMP.y += (1 - e) * 1.2;
      SC.copy(it.s).multiplyScalar(e < 0.001 ? 0 : 1); if (m.geometry === GEOS.rohr) SC.y = it.s.y * e;
      if (filmHot && m.geometry === GEOS.rohr && filmHot.has(it.label)) { const th = FILM_THICK[it.label] || 1.45; SC.x *= th; SC.z *= th; }
      M4.compose(TMP, it.q, SC); m.setMatrixAt(i, M4);
    }
    m.instanceMatrix.needsUpdate = true;
  }
}

/* ---------- Baugruppen ---------- */
// Fassaden-Lauf entlang x vor einer Wand bei z = zw, Gerüst Richtung sgn (-1 = zur Straße)
function facadeRun(k, x0, bays, levels, zw, sgn, t0 = 0, t1 = 1, opts = {}) {
  const zi = zw + sgn * GAP, zo = zw + sgn * (GAP + DEP), T = (lv, i) => t0 + (t1 - t0) * (lv + i / (bays + 1)) / levels;
  const X = i => x0 + i * BW;
  for (let i = 0; i <= bays; i++) for (const z of [zi, zo]) { // Fußspindeln
    k.tube(V(X(i), 0.02, z), V(X(i), 0.3, z), 'Fußspindel', T(0, i) - 0.02, 1.2);
    k.box('dunkel', V(X(i), 0.01, z), V(0.15, 0.02, 0.15), 'Fußspindel', T(0, i) - 0.02);
  }
  for (let lv = 0; lv < levels; lv++) {
    const y0 = lv === 0 ? 0.3 : lv * LH, y1 = (lv + 1) * LH;
    for (let i = 0; i <= bays; i++) {
      const t = T(lv, i);
      k.tube(V(X(i), y0, zi), V(X(i), y1, zi), 'Stiel', t); k.tube(V(X(i), y0, zo), V(X(i), y1, zo), 'Stiel', t);
      k.tube(V(X(i), y1, zi), V(X(i), y1, zo), 'Riegel', t + 0.004);
      if (lv % 2 === 1 && i % 2 === 0 && !opts.noAnchor) k.tube(V(X(i), y1 - 0.25, zi), V(X(i), y1 - 0.25, zw), 'Verankerung', t + 0.006, 0.7);
      if (i < bays) {
        const xm = X(i) + BW / 2, tn = t + 0.01;
        k.tube(V(X(i), y1, zi), V(X(i + 1), y1, zi), 'Riegel', tn); k.tube(V(X(i), y1, zo), V(X(i + 1), y1, zo), 'Riegel', tn);
        for (let b = 0; b < 2; b++) k.box('belag', V(xm, y1 + 0.03, zi + sgn * (0.19 + b * 0.35)), V(BW - 0.04, 0.05, 0.32), 'Belag', tn + 0.004);
        k.tube(V(X(i), y1 + 1.0, zo), V(X(i + 1), y1 + 1.0, zo), 'Geländer', tn + 0.008); k.tube(V(X(i), y1 + 0.5, zo), V(X(i + 1), y1 + 0.5, zo), 'Geländer', tn + 0.008);
        k.box('bord', V(xm, y1 + 0.13, zo - sgn * 0.02), V(BW - 0.02, 0.15, 0.025), 'Bordbrett', tn + 0.01);
        if (i % 3 === 0) { const up = lv % 2 === 0; k.tube(V(X(i), up ? y0 : y1, zo), V(X(i + 1), up ? y1 : y0, zo), 'Diagonale', tn + 0.012); }
        if (i === (opts.ladder ?? 1) && lv < levels) { // Leiter innen
          const lx = X(i) + 0.55, lz = zi + sgn * 0.36;
          for (const dx of [0, 0.4]) k.box('gelb', V(lx + dx, (y0 + y1) / 2 + 0.05, lz), V(0.04, y1 - y0 + 0.2, 0.06), 'Leiter', tn + 0.014, 0);
          for (let s = 0.3; s < y1 - y0; s += 0.28) k.box('gelb', V(lx + 0.2, y0 + s, lz), V(0.4, 0.025, 0.03), 'Leiter', tn + 0.014);
        }
      }
    }
  }
  const yt = levels * LH; // Geländerpfosten über der obersten Lage
  for (let i = 0; i <= bays; i++) k.tube(V(X(i), yt, zo), V(X(i), yt + 1.0, zo), 'Stiel', t1 - 0.01);
}

const BUILD = {
  fassade(k) { facadeRun(k, -2.5 * BW, 5, 7, 0, -1, 0, 0.94); },
  roll(k) {
    const x0 = -4, z0 = -4.2, w = 2.0, d = 1.35, lv = 4, T = l => l / (lv + 1);
    const C = [[x0, z0], [x0 + w, z0], [x0 + w, z0 + d], [x0, z0 + d]];
    C.forEach(([x, z], i) => { k.wheel(V(x, 0.1, z), 'Lenkrolle', 0.01 + i * 0.01); k.tube(V(x, 0.2, z), V(x, 0.45, z), 'Fußspindel', 0.03); });
    for (let l = 0; l < lv; l++) {
      const y0 = 0.45 + l * LH, y1 = 0.45 + (l + 1) * LH, t = T(l + 0.3);
      C.forEach(([x, z]) => k.tube(V(x, y0, z), V(x, y1, z), 'Stiel', t));
      for (const [a, b] of [[0, 1], [2, 3]]) { const [xa, za] = C[a], [xb, zb] = C[b]; k.tube(V(xa, y1, za), V(xb, y1, zb), 'Riegel', t + 0.03); k.tube(V(xa, y0 + 0.5, za), V(xb, y0 + 1.2, zb), 'Diagonale', t + 0.05); }
      for (const [x] of [[x0], [x0 + w]]) { k.tube(V(x, y1, z0), V(x, y1, z0 + d), 'Riegel', t + 0.03); for (let s = 0.28; s < LH; s += 0.28) k.tube(V(x, y0 + s, z0), V(x, y0 + s, z0 + d), 'Leiter', t + 0.04, 0.6); }
    }
    const yt = 0.45 + lv * LH;
    for (let b = 0; b < 4; b++) k.box('belag', V(x0 + w / 2, yt + 0.03, z0 + 0.17 + b * 0.335), V(w - 0.04, 0.05, 0.32), 'Belag', 0.86);
    C.forEach(([x, z]) => k.tube(V(x, yt, z), V(x, yt + 1.0, z), 'Stiel', 0.88));
    for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]]) { const [xa, za] = C[a], [xb, zb] = C[b]; for (const h of [0.5, 1.0]) k.tube(V(xa, yt + h, za), V(xb, yt + h, zb), 'Geländer', 0.9); }
    k.box('bord', V(x0 + w / 2, yt + 0.13, z0 - 0.01), V(w, 0.15, 0.025), 'Bordbrett', 0.92); k.box('bord', V(x0 + w / 2, yt + 0.13, z0 + d + 0.01), V(w, 0.15, 0.025), 'Bordbrett', 0.92);
    C.forEach(([x, z]) => { const dx = x < x0 + 1 ? -1.4 : 1.4, dz = z < z0 + 0.5 ? -1.4 : 1.4; k.tube(V(x + dx, 0.05, z + dz), V(x, 3.2, z), 'Ausleger', 0.95); });
  },
  haenge(k) {
    const x0 = -1.5 * BW, bays = 3, yb = 9.8, zi = -GAP, zo = -GAP - DEP;
    for (let i = 0; i <= bays; i++) {
      const x = x0 + i * BW, t = 0.05 + i * 0.05;
      k.box('dunkel', V(x, HE + 0.12, 1.2 - 1.9), V(0.12, 0.24, 3.8), 'Kragträger', t);           // Träger über die Traufe hinaus
      k.box('dunkel', V(x, HE + 0.4, 2.6), V(0.3, 0.6, 0.3), 'Kragträger', t + 0.02);             // Gegengewicht auf dem Dach
      for (const z of [zi, zo]) k.tube(V(x, HE, z), V(x, yb, z), 'Abhängung', 0.3 + i * 0.04, 0.55);
      k.tube(V(x, yb, zi), V(x, yb, zo), 'Riegel', 0.5 + i * 0.03);
      for (const z of [zi, zo]) k.tube(V(x, yb, z), V(x, yb + 1.0, z), 'Stiel', 0.55 + i * 0.03);
    }
    for (let i = 0; i < bays; i++) {
      const x = x0 + i * BW, xm = x + BW / 2, t = 0.65 + i * 0.05;
      for (const z of [zi, zo]) k.tube(V(x, yb, z), V(x + BW, yb, z), 'Riegel', t);
      for (let b = 0; b < 2; b++) k.box('belag', V(xm, yb + 0.03, zi - 0.19 - b * 0.35), V(BW - 0.04, 0.05, 0.32), 'Belag', t + 0.03);
      for (const h of [0.5, 1.0]) k.tube(V(x, yb + h, zo), V(x + BW, yb + h, zo), 'Geländer', t + 0.06);
      for (const h of [0.5, 1.0]) k.tube(V(x, yb + h, zi), V(x + BW, yb + h, zi), 'Geländer', t + 0.06);
      k.box('bord', V(xm, yb + 0.13, zo + 0.02), V(BW, 0.15, 0.025), 'Bordbrett', t + 0.08);
    }
  },
  raum(k) {
    const nx = 6, nz = 4, lv = 4, x0 = -3 * BW, z0 = -0.6;
    const X = i => x0 + i * BW, Z = j => z0 + j * BW, T = (l, i, j) => (l + (i + j * nx) / (nx * nz + 1)) / (lv + 1);
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) { k.tube(V(X(i), 0.02, Z(j)), V(X(i), 0.3, Z(j)), 'Fußspindel', 0.01); k.box('dunkel', V(X(i), 0.01, Z(j)), V(0.15, 0.02, 0.15), 'Fußspindel', 0.01); }
    for (let l = 0; l < lv; l++) {
      const y0 = l === 0 ? 0.3 : l * LH, y1 = (l + 1) * LH;
      for (let i = 0; i <= nx; i++) for (let j = 0; j <= nz; j++) {
        const t = T(l, i, j); k.tube(V(X(i), y0, Z(j)), V(X(i), y1, Z(j)), 'Stiel', t);
        if (i < nx) k.tube(V(X(i), y1, Z(j)), V(X(i + 1), y1, Z(j)), 'Riegel', t + 0.01);
        if (j < nz) k.tube(V(X(i), y1, Z(j)), V(X(i), y1, Z(j + 1)), 'Riegel', t + 0.01);
        if ((i === 0 || i === nx) && j < nz && (j + l) % 2 === 0) k.tube(V(X(i), y0, Z(j)), V(X(i), y1, Z(j + 1)), 'Diagonale', t + 0.02);
        if ((j === 0 || j === nz) && i < nx && (i + l) % 2 === 0) k.tube(V(X(i), y0, Z(j)), V(X(i + 1), y1, Z(j)), 'Diagonale', t + 0.02);
      }
    }
    const yt = lv * LH;
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) for (let b = 0; b < 8; b++)
      k.box('belag', V(X(i) + BW / 2, yt + 0.03, Z(j) + 0.17 + b * 0.32), V(BW - 0.03, 0.05, 0.31), 'Belag', 0.82 + (i + j * nx) / (nx * nz) * 0.1);
    for (let i = 0; i <= nx; i++) for (const j of [0, nz]) k.tube(V(X(i), yt, Z(j)), V(X(i), yt + 1, Z(j)), 'Stiel', 0.93);
    for (let i = 0; i < nx; i++) for (const j of [0, nz]) for (const h of [0.5, 1]) k.tube(V(X(i), yt + h, Z(j)), V(X(i + 1), yt + h, Z(j)), 'Geländer', 0.95);
    for (let j = 0; j < nz; j++) for (const i of [0, nx]) for (const h of [0.5, 1]) k.tube(V(X(i), yt + h, Z(j)), V(X(i), yt + h, Z(j + 1)), 'Geländer', 0.95);
  },
  treppe(k) {
    const x0 = -9.6 - 3.07 / 2, w = 3.07, z0 = -1.6, d = 1.5, lv = 7, T = l => 0.04 + l / (lv + 0.5);
    const C = [[x0, z0], [x0 + w, z0], [x0 + w, z0 + d], [x0, z0 + d]];
    C.forEach(([x, z]) => { k.tube(V(x, 0.02, z), V(x, 0.3, z), 'Fußspindel', 0.02); k.box('dunkel', V(x, 0.01, z), V(0.15, 0.02, 0.15), 'Fußspindel', 0.02); });
    for (let l = 0; l < lv; l++) {
      const y0 = l === 0 ? 0.3 : l * LH, y1 = (l + 1) * LH, t = T(l);
      C.forEach(([x, z]) => k.tube(V(x, y0, z), V(x, y1, z), 'Stiel', t));
      for (const [a, b] of [[0, 1], [1, 2], [2, 3], [3, 0]]) { const [xa, za] = C[a], [xb, zb] = C[b]; k.tube(V(xa, y1, za), V(xb, y1, zb), 'Riegel', t + 0.02); }
      k.tube(V(x0, y0, z0 + d), V(x0 + w, y1, z0 + d), 'Diagonale', t + 0.03);
      // Treppenlauf: abwechselnd vorne und hinten, Stufen als Belag
      const dir = l % 2 === 0 ? 1 : -1, zl = l % 2 === 0 ? z0 + 0.38 : z0 + d - 0.38, n = 9;
      for (let s = 0; s < n; s++) {
        const f = (s + 0.5) / n, x = dir > 0 ? x0 + 0.45 + f * (w - 0.9) : x0 + w - 0.45 - f * (w - 0.9);
        k.box('belag', V(x, l * LH + f * LH, zl), V(0.27, 0.04, 0.64), 'Treppe', t + 0.04 + s * 0.002);
      }
      const xs = dir > 0 ? [x0 + 0.45, x0 + w - 0.45] : [x0 + w - 0.45, x0 + 0.45];
      k.tube(V(xs[0], l * LH + 1.0, zl - 0.34), V(xs[1], y1 + 1.0, zl - 0.34), 'Geländer', t + 0.05);
      k.tube(V(xs[0], l * LH + 1.0, zl + 0.34), V(xs[1], y1 + 1.0, zl + 0.34), 'Geländer', t + 0.05);
      k.box('belag', V(x0 + (dir > 0 ? w - 0.22 : 0.22), y1 + 0.02, z0 + d / 2), V(0.42, 0.05, d - 0.06), 'Treppe', t + 0.06);
      if (l % 2 === 1 && l > 1) k.tube(V(x0 + w, y1 - 0.25, z0 + d), V(x0 + w, y1 - 0.25, 0), 'Verankerung', t + 0.07, 0.7);
    }
    const yt = lv * LH; C.forEach(([x, z]) => k.tube(V(x, yt, z), V(x, yt + 1, z), 'Stiel', 0.95));
    for (const [a, b] of [[0, 1], [3, 0], [2, 3]]) { const [xa, za] = C[a], [xb, zb] = C[b]; for (const h of [0.5, 1]) k.tube(V(xa, yt + h, za), V(xb, yt + h, zb), 'Geländer', 0.97); }
  },
  dach(k) {
    facadeRun(k, -3 * BW, 6, DACH_LV, 0, -1, 0, 0.55, { ladder: 1 });
    facadeRun(k, -3 * BW, 6, DACH_LV, DACH_ZB, 1, 0.08, 0.6, { ladder: 4, noAnchor: true });
    const yb = DACH_LV * LH + 1.0, zf = -GAP - DEP, zb = DACH_ZB + GAP + DEP, span = zb - zf, rise = DACH_RISE;
    for (let i = 0; i <= 6; i++) { // Fachwerkbinder über die ganze Tiefe
      const x = -3 * BW + i * BW, t = 0.62 + i * 0.035, mid = (zf + zb) / 2;
      const top = z => yb + rise * (1 - Math.abs(z - mid) / (span / 2));
      const n = 10;
      for (let s = 0; s < n; s++) {
        const za = zf + span * s / n, zc = zf + span * (s + 1) / n;
        k.tube(V(x, top(za), za), V(x, top(zc), zc), 'Fachwerkträger', t, 1.6);
        k.tube(V(x, yb - 0.0, za), V(x, yb, zc), 'Fachwerkträger', t, 1.4);
        k.tube(V(x, yb, s % 2 ? za : zc), V(x, top(s % 2 ? zc : za), s % 2 ? zc : za), 'Fachwerkträger', t + 0.01);
      }
    }
    for (let s = 0; s <= 8; s++) { // Pfetten
      const z = zf + span * s / 8, mid = (zf + zb) / 2, y = yb + rise * (1 - Math.abs(z - mid) / (span / 2));
      k.tube(V(-3 * BW, y + 0.05, z), V(3 * BW, y + 0.05, z), 'Pfette', 0.86 + s * 0.006, 1.2);
    }
  },
};

/* ---------- Plane für das Wetterschutzdach ---------- */
const tarpMat = new THREE.MeshStandardMaterial({ color: '#f4f2ec', roughness: 0.75, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
const tarp = (() => {
  const zf = -GAP - DEP - 0.1, zb = DACH_ZB + GAP + DEP + 0.1, yb = DACH_LV * LH + 1.05, rise = DACH_RISE + 0.05, x0 = -3 * BW - 0.2, x1 = 3 * BW + 0.2, zm = (zf + zb) / 2;
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([x0, yb, zf, x1, yb, zf, x1, yb + rise, zm, x0, yb + rise, zm, x0, yb, zb, x1, yb, zb], 3));
  g.setIndex([0, 1, 2, 0, 2, 3, 3, 2, 5, 3, 5, 4]); g.computeVertexNormals();
  const m = new THREE.Mesh(g, tarpMat); m.castShadow = true; m.visible = false; scene.add(m); return m;
})();

/* ---------- Zustand, Wechsel der Gerüstart ---------- */
let current = null, kit = null, group = null, prog = 1, target = 1, expl = 0, xray = false, needs = true, playing = false, t0 = 0;
const camPos = V(0, 7, -30), camTgt = V(0, 7.5, 0), camPosGoal = camPos.clone(), camTgtGoal = camTgt.clone();
let orbit = { az: 0, el: 0, r: 1 }, userOrbit = { az: 0, el: 0, zoom: 1 };

function select(id, animate = true) {
  const ty = TYPES.find(t => t.id === id) || TYPES[0]; current = ty;
  if (group) { scene.remove(group); group.traverse(o => { if (o.isInstancedMesh) { o.material.dispose(); o.dispose(); } }); }
  group = new THREE.Group(); scene.add(group); kit = new Kit(); BUILD[ty.id](kit); kit.finish(group);
  hall.visible = ty.id === 'raum'; house.visible = ty.id !== 'raum'; tarp.visible = ty.id === 'dach';
  house.traverse(o => { if (o.userData.chimney || /schorn|chimney|kamin/i.test(o.name)) o.visible = ty.id !== 'dach'; });
  const c = ty.cam; camPosGoal.set(c[0], c[1], c[2]); camTgtGoal.set(c[3], c[4], c[5]); userOrbit = { az: 0, el: 0, zoom: 1 };
  prog = animate && !reduce ? 0 : 1; target = 1; playing = animate && !reduce; t0 = performance.now();
  applyXray(); updateUI(); needs = true;
  document.querySelectorAll('[data-type]').forEach(b => b.setAttribute('aria-pressed', b.dataset.type === id));
  history.replaceState(null, '', '#' + id);
}

function applyXray() {
  const seen = new Set();
  house.traverse(o => { if (!o.isMesh) return; (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
    if (seen.has(m)) return; seen.add(m);
    if (m.userData.op0 === undefined) { m.userData.op0 = m.opacity; m.userData.tr0 = m.transparent; }
    m.transparent = xray || m.userData.tr0; m.opacity = xray ? 0.14 : m.userData.op0; m.depthWrite = !xray; m.needsUpdate = true; }); });
  if (!kit) return;
  for (const m of kit.meshes) { m.userData.list.forEach((it, i) => m.setColorAt(i, new THREE.Color(xray ? (PARTS[it.label]?.col || '#fff') : '#ffffff'))); m.instanceColor.needsUpdate = true; }
  const leg = document.getElementById('legend'); leg.hidden = !xray;
  if (xray) {
    const used = [...new Set(kit.meshes.flatMap(m => m.userData.list.map(i => i.label)))];
    leg.innerHTML = used.map(l => `<li><i style="background:${PARTS[l].col}"></i>${l}</li>`).join('');
  }
  needs = true;
}

/* ---------- Bedienung ---------- */
const ui = { name: document.getElementById('k-name'), text: document.getElementById('k-text'), facts: document.getElementById('k-facts'), idx: document.getElementById('k-idx') };
function updateUI() {
  const i = TYPES.indexOf(current); ui.idx.textContent = String(i + 1).padStart(2, '0') + ' / 06';
  ui.name.textContent = current.name; ui.text.textContent = current.text;
  ui.facts.innerHTML = current.facts.map(([a, b]) => `<div><dt class="mono">${a}</dt><dd>${b}</dd></div>`).join('');
}
const list = document.getElementById('types');
list.innerHTML = TYPES.map((t, i) => `<li><button type="button" data-type="${t.id}" aria-pressed="false"><span class="mono">${String(i + 1).padStart(2, '0')}</span><b>${t.name}</b><small>${t.kurz}</small></button></li>`).join('');
list.addEventListener('click', e => { const b = e.target.closest('[data-type]'); if (b) select(b.dataset.type); });
document.getElementById('k-play').addEventListener('click', () => { prog = 0; target = 1; playing = true; t0 = performance.now(); needs = true; });
const slider = document.getElementById('k-expl');
slider.addEventListener('input', () => { expl = slider.value / 100; needs = true; });
const xb = document.getElementById('k-xray');
xb.addEventListener('click', () => { xray = !xray; xb.setAttribute('aria-pressed', xray); applyXray(); });

/* Kamera: ziehen dreht, Rad und zwei Finger zoomen */
let drag = null;
canvas.addEventListener('pointerdown', e => { drag = { x: e.clientX, y: e.clientY, az: userOrbit.az, el: userOrbit.el }; canvas.setPointerCapture(e.pointerId); });
canvas.addEventListener('pointermove', e => {
  if (drag) { userOrbit.az = drag.az - (e.clientX - drag.x) * 0.006; userOrbit.el = clamp(drag.el + (e.clientY - drag.y) * 0.004, -0.5, 0.9); needs = true; tip.hidden = true; return; }
  hover(e);
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('pointerleave', () => { tip.hidden = true; clearHot(); });
canvas.addEventListener('wheel', e => { e.preventDefault(); userOrbit.zoom = clamp(userOrbit.zoom * (1 + Math.sign(e.deltaY) * 0.08), 0.45, 1.8); needs = true; }, { passive: false });
let pinch = null;
canvas.addEventListener('touchstart', e => { if (e.touches.length === 2) pinch = { d: Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY), z: userOrbit.zoom }; }, { passive: true });
canvas.addEventListener('touchmove', e => { if (pinch && e.touches.length === 2) { const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY); userOrbit.zoom = clamp(pinch.z * pinch.d / d, 0.45, 1.8); needs = true; } }, { passive: true });
canvas.addEventListener('touchend', () => { pinch = null; });

/* Röntgenblick: Bauteil unter der Maus benennen und alle gleichen Teile hervorheben */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tip = document.getElementById('tip');
let hot = null;
function clearHot() { if (hot) { hot = null; applyXray(); } }
function hover(e) {
  if (!kit || playing) return;
  const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
  ray.setFromCamera(ndc, camera); ray.params.Line = { threshold: 0.1 };
  const hit = ray.intersectObjects(kit.meshes, false)[0];
  if (!hit) { tip.hidden = true; clearHot(); return; }
  const it = hit.object.userData.list[hit.instanceId]; if (!it) return;
  tip.hidden = false; tip.style.transform = `translate(${e.clientX - r.left + 16}px,${e.clientY - r.top + 12}px)`;
  tip.innerHTML = `<b>${it.label}</b><span>${PARTS[it.label]?.txt || ''}</span>`;
  if (hot !== it.label) {
    hot = it.label;
    for (const m of kit.meshes) { m.userData.list.forEach((x, i) => m.setColorAt(i, new THREE.Color(x.label === hot ? '#6461ff' : (xray ? (PARTS[x.label]?.col || '#fff') : '#ffffff')))); m.instanceColor.needsUpdate = true; }
    needs = true;
  }
}

/* ---------- Schleife ---------- */
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  camera.fov = w < 700 ? 62 : 50; camera.updateProjectionMatrix(); needs = true;
}
window.addEventListener('resize', resize);
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (playing) { prog = clamp((now - t0) / 1000 / 6.5, 0, 1); if (prog >= 1) playing = false; needs = true; }
  camPos.lerp(camPosGoal, 1 - Math.pow(0.02, dt)); camTgt.lerp(camTgtGoal, 1 - Math.pow(0.02, dt));
  if (camPos.distanceTo(camPosGoal) > 0.01) needs = true;
  if (traffic.length && !document.hidden) { updateTraffic(dt); needs = true; }
  if (fades.length) { needs = true; for (const f of fades) { const k = clamp((now - f.t0) / 700, 0, 1);
    for (const q of f.mats) q.m.opacity = q.op * k;
    if (k >= 1) { f.mats.forEach(q => { q.m.transparent = q.tr; q.m.opacity = q.op; q.m.needsUpdate = true; }); f.done = true; } }
    fades = fades.filter(f => !f.done); }
  if (!needs) return; needs = false;
  // Kamera um das Ziel drehen
  const off = camPos.clone().sub(camTgt); const r = off.length() * userOrbit.zoom;
  const az = Math.atan2(off.x, off.z) + userOrbit.az, el = clamp(Math.asin(off.y / off.length()) + userOrbit.el, -0.05, 1.35);
  camera.position.set(camTgt.x + r * Math.cos(el) * Math.sin(az), Math.max(0.6, camTgt.y + r * Math.sin(el)), camTgt.z + r * Math.cos(el) * Math.cos(az));
  { // nicht in die Häuser gegenüber fahren: hinter der Bauflucht steigt die Kamera über die Dächer (Kranperspektive)
    const z = camera.position.z, k = clamp((-17.2 - z) / 2.5, 0, 1), kk = k * k * (3 - 2 * k);
    camera.position.y = Math.max(camera.position.y, 0.6 + kk * 26);
    const zb = camera.position.z - camTgt.z, xb = camera.position.x - camTgt.x;   // seitlich hinter dem Neumann Haus nicht in die Nachbarzeile
    if (camera.position.x > 8.6 && camera.position.z > -0.3) camera.position.y = Math.max(camera.position.y, 23);
  }
  if (camera.aspect < 0.8) camera.lookAt(camTgt.x, camTgt.y - r * 0.07, camTgt.z); else camera.lookAt(camTgt);   // Handy: Gerüst über die Infokarte schieben
  if (kit) updateKit(kit, prog, expl);
  if (tarp.visible) tarpMat.opacity = 0.82 * ease(clamp((prog - 0.92) / 0.08, 0, 1)) * (1 - expl * 0.8);
  renderer.render(scene, camera);
}
resize();
select((location.hash || '').slice(1) || 'fassade', false);
if (!FILM) {
  requestAnimationFrame(frame);
  // Ladebildschirm: Fortschritt aus den geladenen Teilen, danach baut sich das Gerüst vor den Augen auf
  const LD = window.NeumannLoad, T0 = performance.now();
  const go = () => { if (current) select(current.id, true); };
  if (!LD) go();
  else (function wait() {
    LD.set(Math.min(crit / CRIT_ALL, 1) * 0.999);
    if (crit >= CRIT_ALL || performance.now() - T0 > 7000) { LD.finish(); setTimeout(go, 700); return; }
    setTimeout(wait, 80);
  })();
}
else {
  document.body.classList.add('filmmodus');
  const box = document.createElement('div'); box.id = 'filmlabels'; document.querySelector('.konfig').appendChild(box);
  let hotNow = null;
  const P = new THREE.Vector3();
  const fade = document.createElement('canvas'); fade.id = 'filmfade'; fade.width = canvas.width; fade.height = canvas.height; document.querySelector('.konfig').appendChild(fade);
  const fctx = fade.getContext('2d');
  function apply(st) {
    if (!current || st.type !== current.id) { select(st.type, false); hotNow = '__'; }
    if (!!st.xray !== xray) { xray = !!st.xray; applyXray(); hotNow = '__'; }
    filmLab = st.labels || null; prog = st.prog ?? 1; expl = st.expl ?? 0;
    const hot = st.hot || null, hk = Array.isArray(hot) ? hot.join() : hot;
    filmHot = hot && st.thick !== false ? new Set(Array.isArray(hot) ? hot : [hot]) : null;
    if (hk !== hotNow) { hotNow = hk;
      for (const m of kit.meshes) { m.userData.list.forEach((x, i) => m.setColorAt(i, new THREE.Color(hot && (x.label === hot || (Array.isArray(hot) && hot.includes(x.label))) ? (PARTS[x.label]?.col || '#fff') : '#ffffff'))); m.instanceColor.needsUpdate = true; } }
    camera.fov = st.fov ?? 50; camera.aspect = canvas.clientWidth / canvas.clientHeight; camera.updateProjectionMatrix();
    camera.position.set(st.cam[0], st.cam[1], st.cam[2]); camera.lookAt(st.cam[3], st.cam[4], st.cam[5]);
    for (const t of traffic) { let x = t.x0 + t.ln.dir * t.ln.v * (st.time || 0); x = ((x + 95) % 190 + 190) % 190 - 95; t.w.position.set(x, ROAD_Y, t.ln.z); t.w.rotation.y = t.ln.dir > 0 ? 0 : Math.PI; }
    updateKit(kit, prog, expl);
    if (tarp.visible) tarpMat.opacity = 0.82 * (st.tarp ?? ease(clamp((prog - 0.92) / 0.08, 0, 1))) * (1 - expl * 0.8);
    renderer.render(scene, camera);
  }
  window.NeumannFilm = {
    ready: () => loaded >= LOADED_ALL,
    loaded: () => loaded,
    info(type) {   // Lage der Bauteilgruppen, um Schilder zu setzen
      if (type && (!current || current.id !== type)) select(type, false);
      const out = {};
      for (const m of kit.meshes) for (const it of m.userData.list) { const o = out[it.label] || (out[it.label] = { n: 0, min: [1e9, 1e9, 1e9], max: [-1e9, -1e9, -1e9], first: null, pts: [] });
        o.n++; const p = [it.p.x, it.p.y, it.p.z]; for (let k = 0; k < 3; k++) { o.min[k] = Math.min(o.min[k], p[k]); o.max[k] = Math.max(o.max[k], p[k]); }
        if (o.pts.length < 400) o.pts.push(p.map(v => +v.toFixed(2)).concat(+it.tn.toFixed(3))); }
      return out;
    },
    set(st) {
      if (st.from) { apply(st.from); fctx.drawImage(canvas, 0, 0, fade.width, fade.height); fade.style.opacity = 1 - (st.k ?? 1); }
      else fade.style.opacity = 0;
      apply(st);
      // Schilder: Weltpunkt auf den Bildschirm, mit Linie zum Bauteil
      const W = canvas.clientWidth, H = canvas.clientHeight;
      box.innerHTML = (st.tags || []).map(g => {
        P.set(g.at[0], g.at[1], g.at[2]).project(camera); const x = (P.x + 1) / 2 * W, y = (1 - P.y) / 2 * H;
        const dx = g.dx ?? 140, dy = g.dy ?? -90, a = g.a ?? 1;
        const rows = g.rows ? `<ul>${g.rows.map(r => `<li>${r}</li>`).join('')}</ul>` : '';
        return `<div class="ftag" style="opacity:${a};left:${x}px;top:${y}px;--k:${a}"><i class="ftag__dot"></i><svg class="ftag__line" width="${Math.abs(dx) + 4}" height="${Math.abs(dy) + 4}" style="left:${dx < 0 ? dx : 0}px;top:${dy < 0 ? dy : 0}px"><line x1="${dx < 0 ? Math.abs(dx) + 2 : 2}" y1="${dy < 0 ? Math.abs(dy) + 2 : 2}" x2="${dx < 0 ? 2 : Math.abs(dx) + 2}" y2="${dy < 0 ? 2 : Math.abs(dy) + 2}"/></svg><div class="ftag__card${g.big ? ' ftag__card--big' : ''}${g.small ? ' ftag__card--s' : ''}${dx < 0 ? ' ftag__card--l' : ''}" style="left:${dx}px;top:${dy}px;--c:${g.col || (PARTS[g.t] && PARTS[g.t].col) || '#3633cb'}"><b>${g.t}</b>${g.s ? `<span>${g.s}</span>` : ''}${rows}</div></div>`;
      }).join('') + (st.legend ? `<div class="flegend" style="opacity:${st.legendA ?? 1}">${st.legend.map(l => `<span><i style="background:${PARTS[l]?.col || '#fff'}"></i>${l}</span>`).join('')}</div>` : '');
      return true;
    },
  };
}
window.NeumannKonfig = { select, TYPES, traffic, camera, scene };
