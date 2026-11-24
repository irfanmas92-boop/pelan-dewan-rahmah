// Data pelan Dewan Rahmah, Hari Apresiasi 2026.
// Sumber: tab "KEDUDUKAN DEWAN RAHMAH" dalam helaian JK Protokol.
// Setiap zon ditulis sebagai julat sel helaian (contoh "AC8:AG24") supaya
// kedudukan dan saiznya sama dengan helaian. Unit ialah piksel helaian.

// Lebar lajur A..AL dan tinggi baris 1..36, disalin daripada helaian.
export const COL_W = [
  26, 34, 29, 15, 38, 38, 38, 38, 38, 11, 38, 38, 38, 37, 38, 38, 38, 40, 39,
  38, 38, 38, 38, 38, 2, 35, 32, 7, 38, 38, 38, 38, 38, 43, 43, 43, 48, 48, 38,
];
export const ROW_H = [
  29, 8, 25, 4, 28, 29, 29, 29, 29, 29, 29, 29, 29, 29, 5, 29, 4, 29, 29, 29,
  29, 29, 29, 29, 29, 29, 5, 26, 4, 29, 33, 29, 29, 29, 29, 29,
];

const prefix = (arr) => arr.reduce((acc, v) => (acc.push(acc[acc.length - 1] + v), acc), [0]);
const COL_X = prefix(COL_W);
const ROW_Y = prefix(ROW_H);

// Lajur AM hanya memuatkan tajuk menegak dalam helaian, jadi pelan berakhir di AL.
export const PLAN_W = COL_X[38];
export const PLAN_H = ROW_Y[36];

export function colIndex(letters) {
  let n = 0;
  for (const ch of letters.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

function parseCell(cell) {
  const m = /^([A-Z]+)(\d+)$/i.exec(cell.trim());
  if (!m) throw new Error(`Sel tidak sah: ${cell}`);
  return { c: colIndex(m[1]), r: Number(m[2]) - 1 };
}

export function rangeRect(range) {
  const [a, b = a] = range.split(':');
  const s = parseCell(a);
  const e = parseCell(b);
  const x = COL_X[s.c];
  const y = ROW_Y[s.r];
  return { x, y, w: COL_X[e.c + 1] - x, h: ROW_Y[e.r + 1] - y };
}

// Warna. Zon yang berwarna dalam helaian mengekalkan warna helaian;
// kerusi Bapa dan Ibu (putih dalam helaian) diberi warna sendiri supaya mudah dibezakan.
export const COLORS = {
  paper: '#f7f4ec',
  ink: '#1e2733',
  hall: '#fffdf8',
  room: '#ebe6da',
  walk: '#cfccc4',
  lane: '#c2bfb6',
  vipLane: '#d63a2f',
  stage: '#d9d9d9',
  stageExt: '#e6e6e6',
  stairs: '#f1f1f1',
  media: '#9fc5e8',
  students: '#f9cb9c',
  prizes: '#d5a6bd',
  family: '#cfe2f3',
  covered: '#eef3ea',
  tent: '#ffffff',
  bapa: '#bfe0db',
  bapaLine: '#2f7d74',
  ibu: '#fbe7a6',
  ibuLine: '#a3832a',
  vip: '#cfe2f3',
  vipLine: '#4a7fb0',
  vipUtama: '#d9ead3',
  vipUtamaLine: '#5c9451',
  mc: '#b4a7d6',
  mcLine: '#6a5aa0',
};

const Z = (id, range, kind, label = '', extra = {}) => ({ id, range, kind, label, ...rangeRect(range), ...extra });

export const zones = [
  Z('dewan', 'J4:AJ31', 'hall'),

  // Bilik dan bangunan sekeliling
  Z('kabin-stor', 'B2:C4', 'room', 'KABIN STOR'),
  Z('pejabat', 'E2:F22', 'room', 'PEJABAT'),
  Z('kedai-rahmah', 'G4:H22', 'room', 'KEDAI RAHMAH'),
  Z('bilik-guru-besar', 'E23:E29', 'room', 'BILIK GURU BESAR'),
  Z('stor', 'F23:F29', 'room', 'STOR'),
  Z('pejabat-sih-niaga', 'G23:H29', 'room', 'PEJABAT SIH NIAGA'),
  Z('tandas-tetamu-lelaki', 'AK5:AK6', 'room', 'Tandas tetamu (lelaki)'),
  Z('tandas-lelaki', 'AL5:AL8', 'room', 'Tandas lelaki'),
  Z('tandas-tetamu-perempuan', 'AK7:AK8', 'room', 'Tandas tetamu (perempuan)'),
  Z('tandas-wanita', 'AK24:AK28', 'room', 'Tandas wanita'),
  Z('tempat-wuduk', 'AL24:AL27', 'room', 'Tempat wuduk (banat)'),

  // Kaki lima (kelabu dalam helaian)
  Z('kaki-lima-atas', 'G2:Q3', 'walk', 'KAKI LIMA'),
  Z('kaki-lima-r', 'R2:R3', 'walk'),
  Z('kaki-lima-s', 'S2:V2', 'walk'),
  Z('kaki-lima-w', 'W2:AB3', 'walk'),
  Z('kaki-lima-ak', 'AK2:AL3', 'walk'),
  Z('kaki-lima-kiri', 'I4:I29', 'walk'),
  Z('kaki-lima-bawah-kiri', 'E30:I31', 'walk'),
  Z('kaki-lima-awning', 'AH30:AI30', 'walk', 'KAKI LIMA & AWNING'),
  Z('kaki-lima-awning-2', 'AJ30:AL30', 'walk'),

  // Laluan penerima anugerah dan persembahan
  Z('laluan-masuk', 'AC2:AG3', 'lane', 'LALUAN MASUK PENERIMA ANUGERAH & PERSEMBAHAN', { arah: 'masuk' }),
  Z('beratur', 'AH2:AJ3', 'lane', 'BERATUR PERSEMBAHAN / ANUGERAH'),
  Z('laluan-keluar-atas', 'R4:R15', 'lane', 'LALUAN KELUAR PENERIMA ANUGERAH & PERSEMBAHAN', { arah: 'keluar' }),
  Z('laluan-keluar-tengah', 'R16', 'lane'),
  Z('laluan-keluar-bawah', 'R17:R30', 'lane', 'LALUAN KELUAR PENERIMA ANUGERAH & PERSEMBAHAN', { arah: 'keluar' }),
  Z('laluan-keluar-kanan', 'AA29:AF30', 'lane', 'LALUAN KELUAR PENERIMA ANUGERAH & PERSEMBAHAN', { arah: 'keluar' }),

  // Laluan VIP (merah dalam helaian)
  Z('laluan-vip', 'J31:X31', 'vipLane', 'LALUAN VIP'),
  Z('laluan-vip-hujung', 'Y30:Z31', 'vipLane'),

  // Pentas
  Z('pentas', 'AC8:AG24', 'stage', 'PENTAS'),
  Z('pentas-tambahan-atas', 'AC6:AG7', 'stageExt', 'PENTAS TAMBAHAN'),
  Z('pentas-tambahan-bawah', 'AC25:AG26', 'stageExt', 'PENTAS TAMBAHAN'),
  Z('tangga-atas', 'AD5:AF5', 'stairs', 'TANGGA', { naik: 'bawah' }),
  Z('tangga-bawah', 'AD27:AF28', 'stairs', 'TANGGA', { naik: 'atas' }),

  // Zon khas
  Z('media-teknikal', 'S3:V3', 'media', 'MEDIA & TEKNIKAL'),
  Z('ruang-murid', 'AH4:AJ28', 'students', '1AF & 6AN: RUANG MURID BERKUMPUL'),
  Z('hadiah-sijil', 'AG29:AG31', 'prizes', 'HADIAH & SIJIL'),
  Z('tokoh-banat', 'W7:W14', 'family', 'Ibu, ayah & adik-beradik Tokoh Murid Banat'),
  Z('tokoh-aulad', 'X7:X14', 'family', 'Ibu, ayah & adik-beradik Tokoh Murid Aulad'),

  // Luar dewan
  Z('berbumbung-1', 'J32:O33', 'covered', 'KAWASAN BERBUMBUNG IBU BAPA'),
  Z('berbumbung-2', 'P32:U33', 'covered', 'KAWASAN BERBUMBUNG IBU BAPA'),
  Z('berbumbung-3', 'V32:AA33', 'covered', 'KAWASAN BERBUMBUNG IBU BAPA'),
  Z('khemah-1', 'J34:O36', 'tent', 'KHEMAH IBU BAPA'),
  Z('khemah-2', 'P34:U36', 'tent', 'KHEMAH IBU BAPA'),
  Z('khemah-3', 'V34:AA36', 'tent', 'KHEMAH IBU BAPA'),
];

export const zoneById = Object.fromEntries(zones.map((z) => [z.id, z]));

const S = (cell, type) => ({ cell, type, ...rangeRect(cell) });
const cols = (...list) => list.flatMap((c) => c);
const span = (from, to) => {
  const out = [];
  for (let i = colIndex(from); i <= colIndex(to); i++) {
    let n = i + 1, s = '';
    while (n) { const m = (n - 1) % 26; s = String.fromCharCode(65 + m) + s; n = Math.floor((n - 1) / 26); }
    out.push(s);
  }
  return out;
};

export const seats = [];

// Bapa: blok atas, baris 6 hingga 14
for (const c of cols(span('K', 'Q'), span('S', 'V'))) {
  for (let r = 6; r <= 14; r++) seats.push(S(`${c}${r}`, 'bapa'));
}
// Ibu: blok bawah, baris 18 hingga 26, kemudian sel bercantum 27:28
for (const c of cols(span('K', 'Q'), ['S'])) {
  for (let r = 18; r <= 26; r++) seats.push(S(`${c}${r}`, 'ibu'));
  seats.push(S(`${c}27:${c}28`, 'ibu'));
}
// Ibu: satu barisan di tepi bawah (baris 30)
for (const c of cols(span('K', 'Q'), span('S', 'X'))) seats.push(S(`${c}30`, 'ibu'));

// VIP (biru dalam helaian): setiap kerusi mengambil dua baris helaian
const pasangan = [[18, 19], [20, 21], [22, 23], [24, 25]];
for (const c of ['T', 'U', 'X']) for (const [a, b] of pasangan) seats.push(S(`${c}${a}:${c}${b}`, 'vip'));
for (const c of ['V', 'W']) for (const [a, b] of pasangan.slice(0, 3)) seats.push(S(`${c}${a}:${c}${b}`, 'vip'));

// Kotak hijau di barisan paling depan
for (const [a, b] of [[9, 10], [11, 12], [13, 14], [18, 19], [20, 21], [22, 23]]) {
  seats.push(S(`Z${a}:Z${b}`, 'vipUtama'));
}

// MC
for (const cell of ['W5', 'X5', 'Y5:Z5', 'AA5']) seats.push(S(cell, 'mc'));

export const seatCounts = seats.reduce((acc, s) => ((acc[s.type] = (acc[s.type] || 0) + 1), acc), {});

export const SEAT_LABEL = { bapa: 'Bapa', ibu: 'Ibu', vip: 'VIP', vipUtama: 'VIP utama', mc: 'MC' };

export const parking = [
  ['Parking SRIHBP', 'tetamu PPD, tetamu Hidayah JB'],
  ['Parking SMIH', 'tetamu LPS, PIBG, jemputan khas, ibu ayah tokoh, staf'],
  ['Parking tengah', 'staf, ibu bapa'],
];

export const TITLE = 'Susunan Kedudukan Dewan Rahmah';
export const SUBTITLE = 'Hari Apresiasi 2026';

// Muatkan label dalam kotak w x h. Pulangkan baris teks, saiz fon dan sama ada perlu diputar.
const CHAR_W = 0.62;
const LINE_H = 1.18;

function wrap(words, maxChars) {
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (w.length > maxChars) return null;
    if (!cur) cur = w;
    else if (cur.length + 1 + w.length <= maxChars) cur += ` ${w}`;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

function fitBox(words, w, h, max, min) {
  for (let size = max; size >= min; size -= 0.5) {
    const maxChars = Math.floor(w / (size * CHAR_W));
    if (maxChars < 1) continue;
    const lines = wrap(words, maxChars);
    if (lines && lines.length * size * LINE_H <= h) return { lines, size };
  }
  return null;
}

export function fitText(label, w, h, { max = 13, min = 5, pad = 3 } = {}) {
  const words = label.split(/\s+/).filter(Boolean);
  const flat = fitBox(words, w - pad * 2, h - pad * 2, max, min);
  const turned = fitBox(words, h - pad * 2, w - pad * 2, max, min);
  if (flat && (!turned || flat.size >= turned.size)) return { ...flat, rotate: false };
  if (turned) return { ...turned, rotate: true };
  return { lines: [label], size: min, rotate: h > w };
}
