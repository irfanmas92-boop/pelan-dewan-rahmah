import test from 'node:test';
import assert from 'node:assert/strict';
import {
  colIndex, rangeRect, PLAN_W, PLAN_H, zones, seats, seatCounts, fitText,
} from '../src/plan-data.js';

test('colIndex menukar huruf lajur kepada indeks', () => {
  assert.equal(colIndex('A'), 0);
  assert.equal(colIndex('Z'), 25);
  assert.equal(colIndex('AA'), 26);
  assert.equal(colIndex('AM'), 38);
});

test('rangeRect mengikut lebar lajur dan tinggi baris helaian', () => {
  assert.deepEqual(rangeRect('A1'), { x: 0, y: 0, w: 26, h: 29 });
  const pentas = rangeRect('AC8:AG24');
  assert.equal(pentas.w, 190);
  assert.equal(pentas.h, 444);
  // Lajur Y hanya 2 px dalam helaian
  assert.equal(rangeRect('Y5').w, 2);
});

test('bilangan kerusi sama dengan helaian', () => {
  assert.equal(seatCounts.bapa, 99);
  assert.equal(seatCounts.ibu, 93);
  assert.equal(seatCounts.vip, 18);
  assert.equal(seatCounts.vipUtama, 6);
  assert.equal(seatCounts.mc, 4);
});

test('tiada dua kerusi bertindih', () => {
  for (let i = 0; i < seats.length; i++) {
    for (let j = i + 1; j < seats.length; j++) {
      const a = seats[i], b = seats[j];
      const overlap = a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
      assert.ok(!overlap, `${a.cell} bertindih dengan ${b.cell}`);
    }
  }
});

test('semua zon dan kerusi berada dalam sempadan pelan', () => {
  for (const it of [...zones, ...seats]) {
    assert.ok(it.x >= 0 && it.y >= 0, `${it.id || it.cell} di luar kiri/atas`);
    assert.ok(it.x + it.w <= PLAN_W + 0.001, `${it.id || it.cell} di luar kanan`);
    assert.ok(it.y + it.h <= PLAN_H + 0.001, `${it.id || it.cell} di luar bawah`);
  }
});

test('id zon unik dan zon penting wujud', () => {
  const ids = zones.map((z) => z.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const id of ['pentas', 'laluan-vip', 'ruang-murid', 'hadiah-sijil', 'media-teknikal']) {
    assert.ok(ids.includes(id), `zon ${id} tiada`);
  }
});

test('fitText memuatkan label dalam kotak', () => {
  const r = fitText('LALUAN KELUAR PENERIMA ANUGERAH & PERSEMBAHAN', 40, 290);
  assert.ok(r.rotate, 'kotak tinggi dan sempit patut diputar');
  assert.ok(r.lines.length >= 1);
  const longest = Math.max(...r.lines.map((l) => l.length));
  assert.ok(longest * r.size * 0.6 <= 290, 'baris terpanjang muat');
  const kecil = fitText('PENTAS', 190, 444);
  assert.equal(kecil.rotate, false);
  assert.deepEqual(kecil.lines, ['PENTAS']);
});
