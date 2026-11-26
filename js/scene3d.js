// Echte 3D Szenen mit Three.js: Drahtmodell eines Fassadengerüsts und glänzende Logo-Skulptur
import * as THREE from 'three';
import { RoomEnvironment } from '../assets/vendor/RoomEnvironment.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;
const DPR = Math.min(window.devicePixelRatio || 1, 2);

function makeRenderer(canvas, alpha = true) {
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha, powerPreference: 'high-performance' });
  r.setPixelRatio(DPR);
  return r;
}

function visibleWatcher(el, cb) {
  if (!('IntersectionObserver' in window)) { cb(true); return; }
  new IntersectionObserver(es => es.forEach(e => cb(e.isIntersecting)), { rootMargin: '100px' }).observe(el);
}

/* =========================================================
   1) Drahtmodell: Gerüst baut sich mit dem Scrollen auf
   ========================================================= */
(function wireScene() {
  const canvas = document.getElementById('wire');
  if (!canvas) return;
  const section = document.getElementById('system');
  const view = canvas.parentElement;
  const renderer = makeRenderer(canvas);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 400);

  const BAYS = 10, BW = 2.57, LEVELS = 6, LH = 2.0, DEPTH = 0.73, RET = 3; // Felder, Feldlänge, Lagen, Lagenhöhe, Breite, Felder um die Ecke
  const L = BAYS * BW, Rz = RET * BW, H = LEVELS * LH;

  const pos = [], ord = [], kind = [];
  // kind: 0 Gerüst, 1 Gebäude, 2 Boden
  function seg(a, b, t, k = 0) { pos.push(a[0], a[1], a[2], b[0], b[1], b[2]); ord.push(t, t); kind.push(k, k); }

  // Gerüst entlang einer Linie bauen: Frontfassade (x-Richtung) und Seitenfassade (z-Richtung)
  function run(origin, dir, normal, bays, tOffset) {
    const P = (i, lv, outer) => {
      const s = i * BW, y = lv * LH, d = outer ? DEPTH : 0;
      return [origin[0] + dir[0] * s + normal[0] * d, y, origin[2] + dir[2] * s + normal[2] * d];
    };
    for (let lv = 0; lv < LEVELS; lv++) {
      for (let i = 0; i <= bays; i++) {
        const t = (lv + (i + tOffset) / (BAYS + RET + 1)) / LEVELS; // Reihenfolge: Lage für Lage, links nach rechts
        // Stiele innen und außen
        seg(P(i, lv, 0), P(i, lv + 1, 0), t);
        seg(P(i, lv, 1), P(i, lv + 1, 1), t);
        // Querriegel
        seg(P(i, lv + 1, 0), P(i, lv + 1, 1), t + 0.004);
        if (i < bays) {
          const tn = t + 0.008;
          // Längsriegel, Geländer und Bordbrett außen
          seg(P(i, lv + 1, 0), P(i + 1, lv + 1, 0), tn);
          seg(P(i, lv + 1, 1), P(i + 1, lv + 1, 1), tn);
          const g1 = P(i, lv + 1.5, 1), g2 = P(i + 1, lv + 1.5, 1); seg(g1, g2, tn + 0.004);
          const k1 = P(i, lv + 1.08, 1), k2 = P(i + 1, lv + 1.08, 1); seg(k1, k2, tn + 0.004);
          // Belagbohlen
          for (let b = 1; b < 3; b++) {
            const f = b / 3, a = P(i, lv + 1, 0), c = P(i, lv + 1, 1), a2 = P(i + 1, lv + 1, 0), c2 = P(i + 1, lv + 1, 1);
            seg([a[0] + (c[0] - a[0]) * f, a[1], a[2] + (c[2] - a[2]) * f], [a2[0] + (c2[0] - a2[0]) * f, a2[1], a2[2] + (c2[2] - a2[2]) * f], tn + 0.006);
          }
          // Diagonalen im Wechsel
          if (i % 3 === 0) {
            const up = (lv % 2 === 0);
            seg(P(i, lv + (up ? 0 : 1), 1), P(i + 1, lv + (up ? 1 : 0), 1), tn + 0.006);
          }
        }
      }
    }
    // Fußplatten
    for (let i = 0; i <= bays; i++) {
      const t = (i + tOffset) / (BAYS + RET + 1) / LEVELS * 0.5;
      for (const o of [0, 1]) {
        const p = P(i, 0, o), s = 0.18;
        seg([p[0] - s, 0, p[2] - s], [p[0] + s, 0, p[2] - s], t); seg([p[0] + s, 0, p[2] - s], [p[0] + s, 0, p[2] + s], t);
        seg([p[0] + s, 0, p[2] + s], [p[0] - s, 0, p[2] + s], t); seg([p[0] - s, 0, p[2] + s], [p[0] - s, 0, p[2] - s], t);
      }
    }
  }
  // Ecke bei x=0,z=0, Front läuft nach +x (Normalenrichtung -z ist Straße), Seite läuft nach +z (Normale -x)
  run([0, 0, 0], [1, 0, 0], [0, 0, -1], BAYS, RET);
  run([0, 0, 0], [0, 0, 1], [-1, 0, 0], RET, 0);

  // Gebäude als feine Hülle mit Fensterraster
  const gz = 0.25, roof = H + 1.2;
  const box = [[0, 0, gz], [L, 0, gz], [L, 0, Rz + 8], [0, 0, Rz + 8]].map(p => [p[0] + gz, 0, p[2]]);
  for (let k = 0; k < 4; k++) {
    const a = box[k], b = box[(k + 1) % 4];
    seg(a, b, -1, 1); seg([a[0], roof, a[2]], [b[0], roof, b[2]], -1, 1); seg(a, [a[0], roof, a[2]], -1, 1);
  }
  // Mansarddach
  seg([gz, roof, gz], [gz + 1.4, roof + 2.4, gz + 1.4], -1, 1); seg([L + gz, roof, gz], [L + gz - 1.4, roof + 2.4, gz + 1.4], -1, 1);
  seg([gz + 1.4, roof + 2.4, gz + 1.4], [L + gz - 1.4, roof + 2.4, gz + 1.4], -1, 1);
  // Fenster Front
  for (let lv = 0; lv < LEVELS; lv++) for (let i = 0; i < BAYS; i++) {
    const x0 = gz + i * BW + 0.75, x1 = x0 + 1.05, y0 = lv * LH + 0.55, y1 = y0 + 1.3, z = gz;
    seg([x0, y0, z], [x1, y0, z], -1, 1); seg([x1, y0, z], [x1, y1, z], -1, 1); seg([x1, y1, z], [x0, y1, z], -1, 1); seg([x0, y1, z], [x0, y0, z], -1, 1);
  }
  for (let lv = 0; lv < LEVELS; lv++) for (let i = 0; i < RET; i++) {
    const z0 = gz + i * BW + 0.75, z1 = z0 + 1.05, y0 = lv * LH + 0.55, y1 = y0 + 1.3, x = gz;
    seg([x, y0, z0], [x, y0, z1], -1, 1); seg([x, y0, z1], [x, y1, z1], -1, 1); seg([x, y1, z1], [x, y1, z0], -1, 1); seg([x, y1, z0], [x, y0, z0], -1, 1);
  }
  // Bodenraster
  for (let x = -8; x <= L + 8; x += BW) seg([x, 0, -8], [x, 0, Rz + 10], -2, 2);
  for (let z = -8; z <= Rz + 10; z += BW) seg([-8, 0, z], [L + 8, 0, z], -2, 2);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aOrd', new THREE.Float32BufferAttribute(ord, 1));
  geo.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));

  const uni = { uP: { value: 0 }, uColor: { value: new THREE.Color('#FACE00') }, uHot: { value: new THREE.Color('#ffffff') } };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni, transparent: true, depthWrite: false, 
    vertexShader: `attribute float aOrd; attribute float aKind; varying float vOrd; varying float vKind; varying float vDepth;
      void main(){ vOrd=aOrd; vKind=aKind; vec4 mv=modelViewMatrix*vec4(position,1.0); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`,
    fragmentShader: `uniform float uP; uniform vec3 uColor; uniform vec3 uHot; varying float vOrd; varying float vKind; varying float vDepth;
      void main(){
        float fog = clamp(1.0-(vDepth-35.0)/60.0, 0.35, 1.0);
        if(vKind>1.5){ gl_FragColor=vec4(uColor*0.7, 0.22*fog); return; }
        if(vKind>0.5){ gl_FragColor=vec4(uColor*0.85, 0.4*fog); return; }
        if(vOrd>uP) discard;
        float hot = smoothstep(0.035, 0.0, uP-vOrd);
        vec3 c = mix(uColor, uHot, hot*0.9);
        gl_FragColor = vec4(c, (0.92+hot*0.08)*fog);
      }`
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.position.set(-L / 2, -H / 2 + 0.5, -Rz / 2);
  scene.add(lines);

  let w = 0, h = 0;
  function resize() {
    w = view.clientWidth; h = view.clientHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  resize(); window.addEventListener('resize', resize);

  let mx = 0, my = 0, smx = 0, smy = 0, p = 0, sp = 0, on = false, t0 = performance.now();
  view.addEventListener('mousemove', e => { const r = view.getBoundingClientRect(); mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; });
  const ax = document.getElementById('ax'), ay = document.getElementById('ay'), az = document.getElementById('az'), lvEl = document.getElementById('tbLevels');

  function frame(now) {
    if (!on) return;
    const r = section.getBoundingClientRect(), vh = window.innerHeight;
    p = clamp((-r.top + vh * 0.15) / (r.height - vh * 0.85), 0, 1);
    sp += (p - sp) * (reduce ? 1 : 0.08); smx += (mx - smx) * 0.05; smy += (my - smy) * 0.05;
    uni.uP.value = sp * 1.02;
    const tt = (now - t0) / 1000;
    const ang = -0.78 + sp * 0.5 + smx * 0.35 + (reduce ? 0 : Math.sin(tt * 0.15) * 0.05);
    const asp = Math.min(w / h, 1.5), fit = (asp < 0.9 ? 16 : 17.5) / (Math.tan(THREE.MathUtils.degToRad(16)) * Math.max(asp, 0.62));
    const dist = fit * (1.02 - sp * 0.1);
    const elev = dist * (0.36 - sp * 0.12) - smy * 4;
    camera.position.set(Math.sin(ang) * dist, elev, -Math.cos(ang) * dist);
    camera.lookAt(1.5, -1.2, 0);
    renderer.render(scene, camera);
    ax.textContent = camera.position.x.toFixed(2); ay.textContent = camera.position.y.toFixed(2); az.textContent = camera.position.z.toFixed(2);
    lvEl.textContent = Math.min(LEVELS, Math.floor(sp * 1.02 * LEVELS));
    requestAnimationFrame(frame);
  }
  visibleWatcher(view, v => { if (v && !on) { on = true; requestAnimationFrame(frame); } else if (!v) on = false; });
})();

/* =========================================================
   2) Glänzende Skulptur aus dem Logozeichen (Kontakt)
   ========================================================= */
(function glossScene() {
  const canvas = document.getElementById('gloss');
  if (!canvas) return;
  const view = canvas.parentElement, section = document.getElementById('kontakt');
  const renderer = makeRenderer(canvas);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.92;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 200);

  const mat = new THREE.MeshPhysicalMaterial({ color: new THREE.Color('#F2C200'), metalness: 0.55, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.06, envMapIntensity: 0.85 });
  function beam(len, s = 0.62) {
    const sh = new THREE.Shape(), r = 0.08, a = s / 2;
    sh.moveTo(-a + r, -a); sh.lineTo(a - r, -a); sh.quadraticCurveTo(a, -a, a, -a + r); sh.lineTo(a, a - r); sh.quadraticCurveTo(a, a, a - r, a);
    sh.lineTo(-a + r, a); sh.quadraticCurveTo(-a, a, -a, a - r); sh.lineTo(-a, -a + r); sh.quadraticCurveTo(-a, -a, -a + r, -a);
    const g = new THREE.ExtrudeGeometry(sh, { depth: len, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 4, curveSegments: 6 });
    g.translate(0, 0, -len / 2);
    return new THREE.Mesh(g, mat);
  }
  const g = new THREE.Group();
  // Logozeichen: zwei Stiele, zwei Riegel, eine Diagonale, dazu Kupplungen an den Knoten
  const V = 13, Hh = 14, xs = 3.2, ys = 2.6;
  for (const x of [-xs, xs]) { const b = beam(V); b.rotation.x = Math.PI / 2; b.position.set(x, 0, 0); g.add(b); }
  for (const y of [-ys, ys]) { const b = beam(Hh, 0.56); b.rotation.y = Math.PI / 2; b.position.set(0, y, 0.62); g.add(b); }
  const diagLen = Math.hypot(xs * 2, ys * 2) * 0.55;
  const d = beam(diagLen, 0.42); d.position.set(-xs - 1.1, -ys + 1.25, 1.12); d.rotation.set(0, Math.PI / 2, 0); d.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), Math.atan2(2.2, 2.2)); g.add(d);
  const cMat = new THREE.MeshPhysicalMaterial({ color: '#d9dbe2', metalness: 1, roughness: 0.25, clearcoat: 0.6 });
  const cg = new THREE.CylinderGeometry(0.62, 0.62, 0.9, 32);
  for (const x of [-xs, xs]) for (const y of [-ys, ys]) { const c = new THREE.Mesh(cg, cMat); c.position.set(x, y, 0.32); c.rotation.x = Math.PI / 2; g.add(c); }
  scene.add(g);

  const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-6, 8, 10); scene.add(key);
  const rim = new THREE.DirectionalLight('#ffe27a', 3); rim.position.set(10, -4, -6); scene.add(rim);
  scene.add(new THREE.AmbientLight('#20223a', 0.6));

  let w = 0, h = 0;
  function resize() { w = view.clientWidth; h = view.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  resize(); window.addEventListener('resize', resize);

  let mx = 0, my = 0, smx = 0, smy = 0, on = false, sp = 0, t0 = performance.now();
  window.addEventListener('mousemove', e => { mx = e.clientX / window.innerWidth - 0.5; my = e.clientY / window.innerHeight - 0.5; }, { passive: true });
  function frame(now) {
    if (!on) return;
    const r = section.getBoundingClientRect(), vh = window.innerHeight;
    const p = clamp((vh - r.top) / (r.height + vh), 0, 1);
    sp += (p - sp) * 0.08; smx += (mx - smx) * 0.04; smy += (my - smy) * 0.04;
    const tt = reduce ? 0 : (now - t0) / 1000;
    g.rotation.set(-0.5 + smy * 0.25 + Math.sin(tt * 0.3) * 0.03, 0.7 - sp * 1.2 + smx * 0.4, 0.62 + sp * 0.25);
    const narrow = w / h < 0.9;
    camera.position.set(narrow ? 0 : 2, 0, narrow ? 30 : 22);
    g.position.set(narrow ? 0 : 4.5, narrow ? 0 : -1.5, 0);
    camera.lookAt(narrow ? 0 : 2, 0, 0);
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  visibleWatcher(view, v => { if (v && !on) { on = true; requestAnimationFrame(frame); } else if (!v) on = false; });
})();
