// Pandangan 3D gaya maket: dibina terus daripada data pelan yang sama dengan paparan 2D.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import {
  PLAN_W, PLAN_H, COLORS, zones, zoneById, seats, seatCounts, fitText, rangeRect,
} from './plan-data.js';

const U = 38; // satu sel helaian (38 px) = 1 unit
const OX = (26 + PLAN_W) / 2;
const OY = PLAN_H / 2;
const box = (r) => ({ cx: (r.x + r.w / 2 - OX) / U, cz: (r.y + r.h / 2 - OY) / U, w: r.w / U, d: r.h / U });
const at = (range) => box(rangeRect(range));

const FLOOR = 0.04; // aras lantai dewan
const STAGE_TOP = 1.05;
const FONT = "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif";

const C3 = {
  base: '#f3efe4', hall: '#fbf8f0', hallEdge: '#b9b2a1',
  wall: '#f4efe3', roof: '#dcd4c2',
  walk: '#cbc7bd', lane: '#b9b5aa',
  stageSkirt: '#2c3848', stageTop: '#c79a68', stageExtTop: '#d6b189',
  backdrop: '#17313f', frame: '#3b4250',
  bapa: '#3f9c90', ibu: '#e3b33a', vip: '#5b8fc7', vipUtama: '#6fae62', mc: '#8a78c4', family: '#8fb9e0',
  leg: '#4a4f58', gold: '#d9b45a', tent: '#ffffff', post: '#8d9098',
};

export function init3d(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  container.appendChild(renderer.domElement);
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.3, 400);

  const world = new THREE.Group();
  const tags = new THREE.Group();
  scene.add(world, tags);

  const matCache = new Map();
  const mat = (color, opts = {}) => {
    const key = color + JSON.stringify(opts);
    if (!matCache.has(key)) matCache.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.88, metalness: 0, ...opts }));
    return matCache.get(key);
  };

  function block(b, y0, h, color, { shadow = true, opts, inset = 0, parent = world } = {}) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(b.w - inset * 2, h, b.d - inset * 2), mat(color, opts));
    m.position.set(b.cx, y0 + h / 2, b.cz);
    m.castShadow = shadow;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  // Teks rata di atas permukaan, sama orientasi dengan pelan 2D.
  function decal(text, rect, y, { max = 11, color = COLORS.ink, weight = 600 } = {}) {
    if (!text) return;
    const S = 5;
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(8, Math.round(rect.w * S));
    canvas.height = Math.max(8, Math.round(rect.h * S));
    const ctx = canvas.getContext('2d');
    const fit = fitText(text, rect.w, rect.h, { max });
    ctx.translate(canvas.width / 2, canvas.height / 2);
    if (fit.rotate) ctx.rotate(-Math.PI / 2);
    ctx.font = `${weight} ${fit.size * S}px ${FONT}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lh = fit.size * S * 1.18;
    fit.lines.forEach((line, i) => ctx.fillText(line, 0, (i - (fit.lines.length - 1) / 2) * lh));
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = maxAniso;
    const b = box(rect);
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(b.w, b.d),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }),
    );
    m.rotation.x = -Math.PI / 2;
    m.position.set(b.cx, y, b.cz);
    m.renderOrder = 2;
    world.add(m);
  }

  // Label terapung yang sentiasa menghadap kamera.
  function tag(text, x, z, yBase, yTop, dot) {
    const pad = 22, h = 64, fs = 30;
    const canvas = document.createElement('canvas');
    let ctx = canvas.getContext('2d');
    ctx.font = `600 ${fs}px ${FONT}`;
    const tw = Math.ceil(ctx.measureText(text).width);
    const w = tw + pad * 2 + (dot ? 30 : 0);
    canvas.width = w + 4;
    canvas.height = h + 4;
    ctx = canvas.getContext('2d');
    ctx.translate(2, 2);
    ctx.beginPath();
    ctx.roundRect(0, 0, w, h, h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = 'rgba(30,39,51,0.28)';
    ctx.stroke();
    let tx = pad;
    if (dot) {
      ctx.beginPath();
      ctx.arc(pad + 9, h / 2, 10, 0, Math.PI * 2);
      ctx.fillStyle = dot;
      ctx.fill();
      tx += 30;
    }
    ctx.font = `600 ${fs}px ${FONT}`;
    ctx.fillStyle = COLORS.ink;
    ctx.textBaseline = 'middle';
    ctx.fillText(text, tx, h / 2 + 1);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, sizeAttenuation: false }));
    const k = 0.027;
    sprite.scale.set((k * canvas.width) / canvas.height, k, 1);
    sprite.center.set(0.5, 0);
    sprite.position.set(x, yTop, z);
    sprite.renderOrder = 10;
    const stem = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, yBase, z), new THREE.Vector3(x, yTop, z)]),
      new THREE.LineBasicMaterial({ color: COLORS.ink, transparent: true, opacity: 0.4 }),
    );
    tags.add(stem, sprite);
  }

  // ---------- Tapak ----------
  const baseW = (PLAN_W - 26) / U + 1.4;
  const baseD = PLAN_H / U + 1.4;
  const base = new THREE.Mesh(new RoundedBoxGeometry(baseW, 0.4, baseD, 4, 0.18), mat(C3.base));
  base.position.set(0, -0.2, 0);
  base.receiveShadow = true;
  base.castShadow = true;
  world.add(base);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.ShadowMaterial({ opacity: 0.16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.4;
  ground.receiveShadow = true;
  world.add(ground);

  // ---------- Zon ----------
  for (const z of zones) {
    const b = box(z);
    switch (z.kind) {
      case 'hall': {
        block(b, 0, FLOOR, C3.hall, { shadow: false });
        // bingkai nipis menandakan sempadan dewan
        const t = 0.07;
        for (const [w, d, x, zz] of [
          [b.w, t, b.cx, b.cz - b.d / 2], [b.w, t, b.cx, b.cz + b.d / 2],
          [t, b.d, b.cx - b.w / 2, b.cz], [t, b.d, b.cx + b.w / 2, b.cz],
        ]) {
          const e = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), mat(C3.hallEdge));
          e.position.set(x, FLOOR + 0.025, zz);
          world.add(e);
        }
        break;
      }
      case 'room': {
        const small = z.w < 60;
        const h = small ? 1.55 : z.id === 'kabin-stor' ? 1.5 : 2.0;
        block(b, 0, h, C3.wall, { inset: 0.04 });
        const roof = new THREE.Mesh(new THREE.BoxGeometry(b.w + 0.06, 0.1, b.d + 0.06), mat(C3.roof));
        roof.position.set(b.cx, h + 0.05, b.cz);
        roof.castShadow = true;
        roof.receiveShadow = true;
        world.add(roof);
        decal(z.label, z, h + 0.105, { max: 11 });
        break;
      }
      case 'walk':
        block(b, 0, 0.03, C3.walk, { shadow: false });
        decal(z.label, z, 0.036, { max: 9, color: '#4b4f55' });
        break;
      case 'lane':
        block(b, 0, FLOOR + 0.02, C3.lane, { shadow: false });
        decal(z.label, z, FLOOR + 0.026, { max: 8.5, color: '#2d3137' });
        break;
      case 'vipLane': {
        block(b, 0, FLOOR + 0.05, '#c9342a', { shadow: false });
        const along = b.w >= b.d;
        for (const s of [-1, 1]) {
          const g = new THREE.Mesh(
            new THREE.BoxGeometry(along ? b.w : 0.05, 0.012, along ? 0.05 : b.d),
            mat(C3.gold, { metalness: 0.5, roughness: 0.45 }),
          );
          g.position.set(b.cx + (along ? 0 : s * (b.w / 2 - 0.09)), FLOOR + 0.056, b.cz + (along ? s * (b.d / 2 - 0.09) : 0));
          world.add(g);
        }
        decal(z.label, z, FLOOR + 0.066, { max: 13, color: '#ffffff', weight: 700 });
        break;
      }
      case 'stage': {
        block(b, 0, STAGE_TOP - 0.07, C3.stageSkirt);
        const top = block({ ...b, w: b.w + 0.06, d: b.d + 0.06 }, STAGE_TOP - 0.07, 0.07, C3.stageTop, { opts: { roughness: 0.6 } });
        top.castShadow = true;
        decal(z.label, z, STAGE_TOP + 0.006, { max: 30, color: '#3a2815', weight: 700 });
        // latar pentas
        const bx = b.cx + b.w / 2 - 0.1;
        const H = 3.5;
        const back = new THREE.Mesh(new THREE.BoxGeometry(0.16, H, b.d - 0.5), mat(C3.backdrop, { roughness: 0.7 }));
        back.position.set(bx, STAGE_TOP + H / 2, b.cz);
        back.castShadow = true;
        back.receiveShadow = true;
        world.add(back);
        for (const s of [-1, 1]) {
          const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, H + 0.25, 0.22), mat(C3.frame));
          post.position.set(bx, STAGE_TOP + (H + 0.25) / 2, b.cz + s * (b.d / 2 - 0.2));
          post.castShadow = true;
          world.add(post);
        }
        const bc = document.createElement('canvas');
        bc.width = 2048; bc.height = 560;
        const bctx = bc.getContext('2d');
        bctx.textAlign = 'center';
        bctx.textBaseline = 'middle';
        bctx.fillStyle = '#f6efdc';
        bctx.font = `700 190px ${FONT}`;
        bctx.fillText('HARI APRESIASI', 1024, 210);
        bctx.fillStyle = '#e2bd62';
        bctx.font = `700 170px ${FONT}`;
        bctx.fillText('2026', 1024, 420);
        const btex = new THREE.CanvasTexture(bc);
        btex.colorSpace = THREE.SRGBColorSpace;
        btex.anisotropy = maxAniso;
        const bw = b.d - 2.2;
        const banner = new THREE.Mesh(
          new THREE.PlaneGeometry(bw, (bw * 560) / 2048),
          new THREE.MeshBasicMaterial({ map: btex, transparent: true }),
        );
        banner.rotation.y = -Math.PI / 2;
        banner.position.set(bx - 0.09, STAGE_TOP + H / 2 + 0.2, b.cz);
        world.add(banner);
        break;
      }
      case 'stageExt':
        block(b, 0, STAGE_TOP - 0.07, C3.stageSkirt);
        block({ ...b, w: b.w + 0.06 }, STAGE_TOP - 0.07, 0.07, C3.stageExtTop, { opts: { roughness: 0.6 } });
        decal(z.label, z, STAGE_TOP + 0.006, { max: 11, color: '#3a2815' });
        break;
      case 'stairs': {
        const steps = 4;
        const stepD = b.d / steps;
        for (let i = 0; i < steps; i++) {
          const h = (STAGE_TOP * (i + 1)) / (steps + 1);
          // naik ke arah pentas tambahan yang bersebelahan
          const k = z.naik === 'bawah' ? i : steps - 1 - i;
          const s = new THREE.Mesh(new THREE.BoxGeometry(b.w, h, stepD), mat('#8f6f4c', { roughness: 0.7 }));
          s.position.set(b.cx, h / 2, b.cz - b.d / 2 + stepD * (k + 0.5));
          s.castShadow = true;
          s.receiveShadow = true;
          world.add(s);
        }
        break;
      }
      case 'students':
        block(b, 0, FLOOR + 0.03, '#f3bd85', { shadow: false });
        decal(z.label, z, FLOOR + 0.036, { max: 15, color: '#5a3410', weight: 700 });
        break;
      case 'family': {
        block(b, 0, FLOOR + 0.03, '#c3daf0', { shadow: false });
        break;
      }
      case 'media': {
        const y = FLOOR + 0.02;
        const table = block({ ...b, w: b.w - 0.5, d: 0.5 }, y, 0.74, '#5f97cf');
        table.castShadow = true;
        const ty = y + 0.74;
        for (const dx of [-1.1, 0.2]) {
          const lb = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.02, 0.25), mat('#2b2f36', { roughness: 0.5 }));
          lb.position.set(b.cx + dx, ty + 0.01, b.cz + 0.02);
          const ls = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.24, 0.015), mat('#2b2f36', { roughness: 0.5 }));
          ls.position.set(b.cx + dx, ty + 0.125, b.cz - 0.12);
          ls.rotation.x = -0.25;
          world.add(lb, ls);
        }
        const mixer = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.36), mat('#2b2f36', { roughness: 0.5 }));
        mixer.position.set(b.cx - 0.45, ty + 0.04, b.cz);
        world.add(mixer);
        // kamera atas tripod
        const cx = b.cx + b.w / 2 - 0.55, cz = b.cz + 0.05;
        for (let i = 0; i < 3; i++) {
          const a = (i / 3) * Math.PI * 2;
          const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.25, 6), mat(C3.leg));
          leg.position.set(cx + Math.cos(a) * 0.14, y + 0.6, cz + Math.sin(a) * 0.14);
          leg.rotation.z = -Math.cos(a) * 0.22;
          leg.rotation.x = Math.sin(a) * 0.22;
          leg.castShadow = true;
          world.add(leg);
        }
        const cam = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.2, 0.18), mat('#23262c', { roughness: 0.45 }));
        cam.position.set(cx + 0.03, y + 1.3, cz);
        cam.castShadow = true;
        const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.16, 16), mat('#111317', { roughness: 0.3 }));
        lens.rotation.z = Math.PI / 2;
        lens.position.set(cx + 0.27, y + 1.3, cz);
        world.add(cam, lens);
        tag('Media & teknikal', b.cx - 0.6, b.cz, ty + 0.3, 2.3, COLORS.media);
        break;
      }
      case 'prizes': {
        const y = FLOOR;
        const table = block({ ...b, w: 0.7, d: b.d - 0.3 }, y, 0.74, '#c98aa9');
        table.castShadow = true;
        const gold = mat(C3.gold, { metalness: 0.75, roughness: 0.3 });
        const nT = 5;
        for (let i = 0; i < nT; i++) {
          const tz = b.cz - (b.d - 0.7) / 2 + ((b.d - 0.7) * i) / (nT - 1);
          const g = new THREE.Group();
          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.05, 16), mat('#3a2815'));
          foot.position.y = 0.025;
          const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), gold);
          stem.position.y = 0.11;
          const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.035, 0.15, 16), gold);
          cup.position.y = 0.245;
          g.add(foot, stem, cup);
          g.position.set(b.cx + (i % 2 ? 0.1 : -0.1), y + 0.74, tz);
          g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
          world.add(g);
        }
        tag('Hadiah & sijil', b.cx, b.cz, y + 1.1, 2.3, COLORS.prizes);
        break;
      }
      case 'covered': {
        block(b, 0, 0.03, '#e6e3d8', { shadow: false });
        const H = 2.5;
        for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, H, 10), mat(C3.post, { metalness: 0.3, roughness: 0.5 }));
          p.position.set(b.cx + sx * (b.w / 2 - 0.15), H / 2, b.cz + sz * (b.d / 2 - 0.15));
          p.castShadow = true;
          world.add(p);
        }
        const roof = block({ ...b, w: b.w - 0.04, d: b.d + 0.1 }, H, 0.08, '#dfe6d8');
        roof.castShadow = true;
        decal(z.label, z, H + 0.086, { max: 11, color: '#33402f' });
        break;
      }
      case 'tent': {
        block(b, 0, 0.03, '#e6e3d8', { shadow: false });
        const H = 2.1;
        const half = b.w / 2;
        for (const s of [-1, 1]) {
          const tx = b.cx + s * (half / 2);
          const tw = half - 0.12, td = b.d - 0.12;
          for (const px of [-1, 1]) for (const pz of [-1, 1]) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, H, 8), mat(C3.post, { metalness: 0.3, roughness: 0.5 }));
            p.position.set(tx + px * (tw / 2 - 0.05), H / 2, b.cz + pz * (td / 2 - 0.05));
            p.castShadow = true;
            world.add(p);
          }
          const val = new THREE.Mesh(new THREE.BoxGeometry(tw, 0.24, td), mat(C3.tent));
          val.position.set(tx, H + 0.12, b.cz);
          val.castShadow = true;
          const pyr = new THREE.Mesh(new THREE.ConeGeometry(1, 0.95, 4, 1), mat(C3.tent, { flatShading: true }));
          pyr.rotation.y = Math.PI / 4;
          pyr.scale.set(tw / Math.SQRT2, 1, td / Math.SQRT2);
          pyr.position.set(tx, H + 0.24 + 0.475, b.cz);
          pyr.castShadow = true;
          world.add(val, pyr);
        }
        tag('Khemah ibu bapa', b.cx, b.cz, H + 1.2, 4.0, '#ffffff');
        break;
      }
      default:
        break;
    }
  }

  // ---------- Kerusi ----------
  function instanced(geometry, material, transforms) {
    const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    transforms.forEach((t, i) => {
      m.compose(new THREE.Vector3(t.x, t.y, t.z), q, new THREE.Vector3(t.sx || 1, t.sy || 1, t.sz || 1));
      mesh.setMatrixAt(i, m);
    });
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    world.add(mesh);
    return mesh;
  }

  // Kerusi biasa menghadap +x (ke arah pentas)
  const cushionGeo = (() => {
    const seat = new THREE.BoxGeometry(0.5, 0.06, 0.54).translate(0, 0.45, 0);
    const back = new THREE.BoxGeometry(0.06, 0.48, 0.54).translate(-0.24, 0.72, 0);
    return mergeGeometries([seat, back]);
  })();
  const legGeo = mergeGeometries(
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => new THREE.BoxGeometry(0.04, 0.42, 0.04).translate(sx * 0.21, 0.21, sz * 0.23)),
  );
  // Kerusi VIP berlengan
  const armGeo = mergeGeometries([
    new RoundedBoxGeometry(0.74, 0.36, 1.1, 3, 0.07).translate(0.02, 0.29, 0),
    new RoundedBoxGeometry(0.2, 0.66, 1.1, 3, 0.07).translate(-0.29, 0.62, 0),
    new RoundedBoxGeometry(0.66, 0.22, 0.17, 3, 0.06).translate(0.04, 0.56, 0.47),
    new RoundedBoxGeometry(0.66, 0.22, 0.17, 3, 0.06).translate(0.04, 0.56, -0.47),
  ]);
  const footGeo = mergeGeometries(
    [[-1, -1], [-1, 1], [1, -1], [1, 1]].map(([sx, sz]) => new THREE.BoxGeometry(0.07, 0.11, 0.07).translate(sx * 0.27, 0.055, sz * 0.45)),
  );

  const byType = { bapa: [], ibu: [], vip: [], vipUtama: [], mc: [], family: [] };
  for (const s of seats) {
    const b = box(s);
    byType[s.type].push({ x: b.cx, y: FLOOR, z: b.cz });
  }
  // Keluarga Tokoh Murid: lapan kerusi setiap jalur (baris 7 hingga 14)
  for (const col of ['W', 'X']) {
    for (let r = 7; r <= 14; r++) {
      const b = at(`${col}${r}`);
      byType.family.push({ x: b.cx, y: FLOOR + 0.03, z: b.cz });
    }
  }
  const legMat = mat(C3.leg, { roughness: 0.6 });
  for (const type of ['bapa', 'ibu', 'mc', 'family']) {
    instanced(cushionGeo, mat(C3[type], { roughness: 0.75 }), byType[type]);
    instanced(legGeo, legMat, byType[type]);
  }
  for (const type of ['vip', 'vipUtama']) {
    const list = byType[type].map((t) => (type === 'vipUtama' ? { ...t, sx: 0.96, sy: 1.1 } : t));
    instanced(armGeo, mat(C3[type], { roughness: 0.8 }), list);
    instanced(footGeo, legMat, list);
  }

  // ---------- Label terapung ----------
  const mid = (range) => at(range);
  let p = mid('K6:V14'); tag(`Bapa · ${seatCounts.bapa} kerusi`, p.cx, p.cz, 1.0, 2.6, C3.bapa);
  p = mid('K18:S28'); tag(`Ibu · ${seatCounts.ibu} kerusi`, p.cx, p.cz, 1.0, 2.6, C3.ibu);
  p = mid('T18:X25'); tag(`VIP · ${seatCounts.vip} kerusi`, p.cx, p.cz, 1.0, 2.4, C3.vip);
  p = mid('Z9:Z14'); tag('VIP utama', p.cx, p.cz, 1.1, 2.9, C3.vipUtama);
  p = mid('Z18:Z23'); tag('VIP utama', p.cx, p.cz, 1.1, 2.9, C3.vipUtama);
  p = mid('W7:X14'); tag('Keluarga Tokoh Murid', p.cx, p.cz, 1.0, 2.2, C3.family);
  p = mid('W5:AA5'); tag('MC', p.cx, p.cz, 1.0, 1.9, C3.mc);

  // ---------- Cahaya ----------
  scene.add(new THREE.HemisphereLight('#ffffff', '#b9ad98', 0.62));
  const sun = new THREE.DirectionalLight('#fff1dc', 2.1);
  sun.position.set(-16, 30, 14);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -27, right: 27, top: 22, bottom: -22, near: 1, far: 90 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 4;
  scene.add(sun);
  const fill = new THREE.DirectionalLight('#dfe8ff', 0.35);
  fill.position.set(18, 14, -16);
  scene.add(fill);

  // ---------- Kamera ----------
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.screenSpacePanning = false;
  controls.minDistance = 2.5;
  controls.maxDistance = 150;
  controls.maxPolarAngle = Math.PI / 2 - 0.04;

  const aisleBack = at('K16');
  const aisleMid = at('R16');
  const stageMid = at('AE16');
  const vipIn = at('J31');
  const vipSeats = at('Y22');
  const VIEWS = {
    semua: { pos: [-19.5, 21, 25], target: [0.2, 0, 1.4], fit: true },
    atas: { pos: [0.6, 43, 0.05], target: [0.6, 0, 0], fit: true },
    penonton: { pos: [aisleBack.cx - 2.2, 2.6, aisleBack.cz], target: [stageMid.cx, 2.0, stageMid.cz] },
    pentas: { pos: [stageMid.cx + 0.6, 3.6, stageMid.cz], target: [aisleMid.cx, 0.2, aisleMid.cz] },
    vip: { pos: [vipIn.cx + 0.3, 2.4, vipIn.cz + 0.15], target: [vipSeats.cx, 0.5, vipIn.cz - 2.4] },
  };

  let needsRender = true;
  let tween = null;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function resolveView(name) {
    const v = VIEWS[name] || VIEWS.semua;
    const target = new THREE.Vector3(...v.target);
    const pos = new THREE.Vector3(...v.pos);
    if (v.fit) {
      // skrin sempit (telefon menegak) perlukan kamera lebih jauh supaya seluruh pelan muat
      const f = Math.max(1, 1.7 / camera.aspect);
      pos.sub(target).multiplyScalar(f).add(target);
    }
    return { pos, target };
  }

  function setView(name, instant = false) {
    const to = resolveView(name);
    if (instant || reduceMotion) {
      camera.position.copy(to.pos);
      controls.target.copy(to.target);
      controls.update();
      tween = null;
    } else {
      tween = { t0: performance.now(), dur: 900, p0: camera.position.clone(), q0: controls.target.clone(), ...to };
    }
    needsRender = true;
  }

  function setLabels(on) {
    tags.visible = on;
    needsRender = true;
  }

  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    needsRender = true;
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();
  setView('semua', true);
  controls.addEventListener('change', () => { needsRender = true; });
  renderer.shadowMap.needsUpdate = true;

  let raf = 0;
  let running = true;
  function frame(now) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      camera.position.lerpVectors(tween.p0, tween.pos, e);
      controls.target.lerpVectors(tween.q0, tween.target, e);
      if (k >= 1) tween = null;
      needsRender = true;
    }
    if (controls.update()) needsRender = true;
    if (needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  }
  raf = requestAnimationFrame(frame);
  renderer.domElement.addEventListener('pointerdown', () => { tween = null; });

  return {
    setView,
    setLabels,
    pause() { running = false; cancelAnimationFrame(raf); },
    resume() { if (!running) { running = true; needsRender = true; raf = requestAnimationFrame(frame); } },
    // untuk semakan automatik
    _debug: { scene, camera, renderer, controls, render: () => renderer.render(scene, camera) },
  };
}

export { zoneById };
