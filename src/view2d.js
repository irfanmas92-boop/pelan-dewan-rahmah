// Pelan 2D: membina satu SVG lengkap (tajuk, pelan, petunjuk, parking)
// supaya paparan skrin, cetakan dan muat turun PNG datang daripada sumber yang sama.
import {
  PLAN_W, PLAN_H, COLORS, zones, seats, seatCounts, SEAT_LABEL, parking, TITLE, SUBTITLE,
  fitText, rangeRect,
} from './plan-data.js';

const FONT = "'Segoe UI', system-ui, -apple-system, Roboto, Arial, sans-serif";
const HEAD_H = 74;
const FOOT_H = 104;
const OFF_X = -8; // lajur A kosong dalam helaian
export const SVG_W = PLAN_W + OFF_X + 18;
export const SVG_H = HEAD_H + PLAN_H + FOOT_H;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 100) / 100;

const ZONE_STYLE = {
  hall: { fill: COLORS.hall, stroke: COLORS.ink, sw: 1.4 },
  room: { fill: COLORS.room, stroke: COLORS.ink, sw: 1, max: 11 },
  walk: { fill: COLORS.walk, max: 9, text: '#4b4f55' },
  lane: { fill: COLORS.lane, max: 8.5, text: '#33373d' },
  vipLane: { fill: COLORS.vipLane, max: 13, text: '#ffffff' },
  stage: { fill: COLORS.stage, stroke: COLORS.ink, sw: 1.8, max: 30 },
  stageExt: { fill: COLORS.stageExt, stroke: COLORS.ink, sw: 1, max: 11 },
  stairs: { fill: COLORS.stairs, stroke: COLORS.ink, sw: 1, max: 8 },
  media: { fill: COLORS.media, stroke: '#3f76a8', sw: 1, max: 10 },
  students: { fill: COLORS.students, stroke: '#b9762f', sw: 1, max: 15 },
  prizes: { fill: COLORS.prizes, stroke: '#8f5574', sw: 1, max: 9 },
  family: { fill: COLORS.family, stroke: COLORS.vipLine, sw: 1, max: 9 },
  covered: { fill: COLORS.covered, stroke: '#6b7a66', sw: 1, dash: '5 3', max: 11 },
  tent: { fill: COLORS.tent, stroke: COLORS.ink, sw: 1, max: 12 },
};

const SEAT_STYLE = {
  bapa: { fill: COLORS.bapa, stroke: COLORS.bapaLine, size: 7.5 },
  ibu: { fill: COLORS.ibu, stroke: COLORS.ibuLine, size: 7.5 },
  vip: { fill: COLORS.vip, stroke: COLORS.vipLine, size: 8.5 },
  vipUtama: { fill: COLORS.vipUtama, stroke: COLORS.vipUtamaLine, size: 7 },
  mc: { fill: COLORS.mc, stroke: COLORS.mcLine, size: 8 },
};

function label(text, r, { max = 11, fill = COLORS.ink, weight = 600 } = {}) {
  if (!text) return '';
  const fit = fitText(text, r.w, r.h, { max });
  const cx = r.x + r.w / 2;
  const cy = r.y + r.h / 2;
  const lh = fit.size * 1.18;
  const y0 = cy - ((fit.lines.length - 1) * lh) / 2;
  const tspans = fit.lines
    .map((line, i) => `<tspan x="${n(cx)}" y="${n(y0 + i * lh)}">${esc(line)}</tspan>`)
    .join('');
  const rot = fit.rotate ? ` transform="rotate(-90 ${n(cx)} ${n(cy)})"` : '';
  return `<text${rot} font-size="${fit.size}" font-weight="${weight}" fill="${fill}" text-anchor="middle" dominant-baseline="central">${tspans}</text>`;
}

function zoneShape(z) {
  const st = ZONE_STYLE[z.kind];
  const stroke = st.stroke ? ` stroke="${st.stroke}" stroke-width="${st.sw}"` : '';
  const dash = st.dash ? ` stroke-dasharray="${st.dash}"` : '';
  let extra = '';
  if (z.kind === 'stairs') {
    // garisan anak tangga
    const steps = 4;
    for (let i = 1; i < steps; i++) {
      const y = z.y + (z.h * i) / steps;
      extra += `<line x1="${n(z.x)}" y1="${n(y)}" x2="${n(z.x + z.w)}" y2="${n(y)}" stroke="${COLORS.ink}" stroke-width="0.6" opacity="0.55"/>`;
    }
  }
  if (z.kind === 'tent') {
    // simbol khemah: dua puncak
    const half = z.w / 2;
    for (const x0 of [z.x, z.x + half]) {
      extra += `<path d="M${n(x0)} ${n(z.y)} L${n(x0 + half)} ${n(z.y + z.h)} M${n(x0 + half)} ${n(z.y)} L${n(x0)} ${n(z.y + z.h)}" stroke="${COLORS.ink}" stroke-width="0.6" opacity="0.22"/>`;
    }
    extra += `<line x1="${n(z.x + half)}" y1="${n(z.y)}" x2="${n(z.x + half)}" y2="${n(z.y + z.h)}" stroke="${COLORS.ink}" stroke-width="0.6" opacity="0.35"/>`;
  }
  return `<rect x="${n(z.x)}" y="${n(z.y)}" width="${n(z.w)}" height="${n(z.h)}" fill="${st.fill}"${stroke}${dash}/>${extra}`;
}

function zoneLabel(z) {
  const st = ZONE_STYLE[z.kind];
  if (!z.label) return '';
  if (z.kind === 'stairs') return ''; // terlalu kecil; diterangkan oleh garisan anak tangga
  if (z.kind === 'tent') {
    // letak label atas latar putih supaya garisan simbol tidak mengganggu
    const fit = fitText(z.label, z.w, z.h, { max: st.max });
    const w = Math.max(...fit.lines.map((l) => l.length)) * fit.size * 0.62 + 14;
    const h = fit.lines.length * fit.size * 1.18 + 8;
    const cx = z.x + z.w / 2, cy = z.y + z.h / 2;
    return `<rect x="${n(cx - w / 2)}" y="${n(cy - h / 2)}" width="${n(w)}" height="${n(h)}" rx="3" fill="#ffffff"/>${label(z.label, z, { max: st.max })}`;
  }
  return label(z.label, z, { max: st.max, fill: st.text || COLORS.ink });
}

function seatShape(s) {
  const st = SEAT_STYLE[s.type];
  const inset = s.w < 10 ? 0 : 2;
  const x = s.x + inset, y = s.y + inset, w = s.w - inset * 2, h = s.h - inset * 2;
  const text = SEAT_LABEL[s.type];
  const r = { x, y, w, h };
  return `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="3.5" fill="${st.fill}" stroke="${st.stroke}" stroke-width="0.9"/>${label(text, r, { max: st.size, weight: 600 })}`;
}

function legend(x, y) {
  const items = [
    ['Bapa', COLORS.bapa, COLORS.bapaLine],
    ['Ibu', COLORS.ibu, COLORS.ibuLine],
    ['VIP', COLORS.vip, COLORS.vipLine],
    ['VIP utama', COLORS.vipUtama, COLORS.vipUtamaLine],
    ['MC', COLORS.mc, COLORS.mcLine],
    ['Keluarga Tokoh Murid', COLORS.family, COLORS.vipLine],
    ['Media & teknikal', COLORS.media, '#3f76a8'],
    ['Ruang murid berkumpul', COLORS.students, '#b9762f'],
    ['Hadiah & sijil', COLORS.prizes, '#8f5574'],
    ['Laluan VIP', COLORS.vipLane, '#9c2219'],
    ['Laluan penerima & kaki lima', COLORS.lane, '#8a877f'],
  ];
  let out = '';
  let cx = x;
  for (const [name, fill, stroke] of items) {
    out += `<rect x="${n(cx)}" y="${y - 7}" width="16" height="14" rx="3" fill="${fill}" stroke="${stroke}" stroke-width="1"/>`;
    out += `<text x="${n(cx + 22)}" y="${y}" font-size="12" font-weight="500" fill="${COLORS.ink}" dominant-baseline="central">${esc(name)}</text>`;
    cx += 22 + name.length * 6.4 + 20;
  }
  return out;
}

export function buildSvg() {
  const aisle = rangeRect('K15:Q17');
  const aisleFront = rangeRect('S15:X17');
  const ay = aisleFront.y + aisleFront.h / 2;
  const ax0 = aisleFront.x + 8;
  const ax1 = aisleFront.x + aisleFront.w - 6;

  const order = ['hall', 'walk', 'lane', 'room', 'covered', 'tent', 'vipLane', 'students', 'family', 'media', 'prizes', 'stairs', 'stageExt', 'stage'];
  const sorted = [...zones].sort((a, b) => order.indexOf(a.kind) - order.indexOf(b.kind));

  const counts = [
    ['Bapa', seatCounts.bapa], ['Ibu', seatCounts.ibu], ['VIP', seatCounts.vip],
    ['VIP utama', seatCounts.vipUtama], ['MC', seatCounts.mc],
  ].map(([k, v]) => `${k} ${v}`).join('   ·   ');

  const footY = HEAD_H + PLAN_H;
  const parkingLines = parking
    .map(([k, v], i) => `<text x="${20 + i * 430}" y="${footY + 72}" font-size="12" fill="${COLORS.ink}"><tspan font-weight="700">${esc(k)}:</tspan> ${esc(v)}</text>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_W} ${SVG_H}" width="${SVG_W}" height="${SVG_H}" font-family="${FONT}" role="img" aria-label="${esc(TITLE)}, ${esc(SUBTITLE)}">
<rect width="${SVG_W}" height="${SVG_H}" fill="${COLORS.paper}"/>
<text x="20" y="34" font-size="27" font-weight="700" fill="${COLORS.ink}" letter-spacing="-0.3">${esc(TITLE)}</text>
<text x="20" y="57" font-size="14" font-weight="600" fill="#1f5d57" letter-spacing="1.6">${esc(SUBTITLE.toUpperCase())}</text>
<text x="${SVG_W - 20}" y="34" font-size="13" font-weight="600" fill="${COLORS.ink}" text-anchor="end">Bilangan kerusi</text>
<text x="${SVG_W - 20}" y="54" font-size="13" fill="${COLORS.ink}" text-anchor="end" xml:space="preserve">${esc(counts)}</text>
<line x1="20" y1="${HEAD_H - 6}" x2="${SVG_W - 20}" y2="${HEAD_H - 6}" stroke="${COLORS.ink}" stroke-width="1.2"/>
<g transform="translate(${OFF_X} ${HEAD_H})">
${sorted.map(zoneShape).join('\n')}
${sorted.map(zoneLabel).join('\n')}
${seats.map(seatShape).join('\n')}
<text x="${n(aisle.x + aisle.w / 2)}" y="${n(aisle.y + aisle.h / 2)}" font-size="12" font-weight="700" fill="${COLORS.ink}" opacity="0.42" letter-spacing="5" text-anchor="middle" dominant-baseline="central">DEWAN RAHMAH</text>
<g opacity="0.55" stroke="${COLORS.ink}" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round">
<line x1="${n(ax0 + 92)}" y1="${n(ay)}" x2="${n(ax1)}" y2="${n(ay)}"/>
<path d="M${n(ax1 - 7)} ${n(ay - 5)} L${n(ax1)} ${n(ay)} L${n(ax1 - 7)} ${n(ay + 5)}"/>
</g>
<text x="${n(ax0)}" y="${n(ay)}" font-size="9.5" font-weight="600" fill="${COLORS.ink}" opacity="0.6" dominant-baseline="central">Menghadap pentas</text>
</g>
<line x1="20" y1="${footY + 14}" x2="${SVG_W - 20}" y2="${footY + 14}" stroke="${COLORS.ink}" stroke-width="0.8" opacity="0.5"/>
${legend(20, footY + 40)}
${parkingLines}
<text x="${SVG_W - 20}" y="${footY + 92}" font-size="10" fill="${COLORS.ink}" opacity="0.6" text-anchor="end">Sumber: Dokumen JK Protokol Hari Apresiasi 2026, tab "Kedudukan Dewan Rahmah". Ukuran ikut nisbah helaian, bukan meter sebenar.</text>
</svg>`;
}

export function mount2d(container) {
  container.innerHTML = buildSvg();
  const svg = container.querySelector('svg');
  svg.removeAttribute('width');
  svg.removeAttribute('height');
  return svg;
}

// Muat turun pelan sebagai PNG (resolusi tinggi untuk WhatsApp atau slaid).
export function downloadPng(filename = 'pelan-dewan-rahmah.png', scale = 2.5) {
  const blob = new Blob([buildSvg()], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  return new Promise((resolve, reject) => {
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(SVG_W * scale);
      canvas.height = Math.round(SVG_H * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob((png) => {
        if (!png) return reject(new Error('Gagal menghasilkan PNG'));
        const a = document.createElement('a');
        a.href = URL.createObjectURL(png);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        resolve();
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal memuatkan SVG')); };
    img.src = url;
  });
}
