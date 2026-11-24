import { mount2d, downloadPng } from './view2d.js';
import { init3d } from './view3d.js';

const $ = (sel) => document.querySelector(sel);
const tab2d = $('#tab-2d');
const tab3d = $('#tab-3d');
const panel2d = $('#panel-2d');
const panel3d = $('#panel-3d');

mount2d($('#plan2d'));

let view3d = null;

function show(mode) {
  const is3d = mode === '3d';
  tab2d.setAttribute('aria-selected', String(!is3d));
  tab3d.setAttribute('aria-selected', String(is3d));
  panel2d.hidden = is3d;
  panel3d.hidden = !is3d;
  document.body.dataset.mode = is3d ? '3d' : '2d';
  if (is3d) {
    if (!view3d) {
      try {
        view3d = init3d($('#plan3d'));
        window.__pelan3d = view3d;
      } catch (err) {
        $('#plan3d').innerHTML = '<p class="gagal">Pandangan 3D tidak dapat dibuka pada peranti ini. Sila guna Pelan 2D.</p>';
        console.error(err);
      }
    } else {
      view3d.resume();
    }
  } else if (view3d) {
    view3d.pause();
  }
  if (location.hash !== `#${mode}`) history.replaceState(null, '', `#${mode}`);
}

tab2d.addEventListener('click', () => show('2d'));
tab3d.addEventListener('click', () => show('3d'));

$('#btn-cetak').addEventListener('click', () => window.print());
$('#btn-png').addEventListener('click', async (e) => {
  const btn = e.currentTarget;
  btn.disabled = true;
  try {
    await downloadPng();
  } catch (err) {
    console.error(err);
    alert('PNG tidak dapat dihasilkan. Cuba butang Cetak dan pilih "Simpan sebagai PDF".');
  } finally {
    btn.disabled = false;
  }
});

document.querySelectorAll('[data-view]').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('[data-view]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
    if (view3d) view3d.setView(btn.dataset.view);
  });
});

$('#btn-gambar3d').addEventListener('click', () => {
  if (!view3d) return;
  const aktif = document.querySelector('[data-view][aria-pressed="true"]');
  view3d.snapshot(`pelan-dewan-rahmah-3d-${aktif ? aktif.dataset.view : 'semua'}.png`);
});

$('#toggle-label').addEventListener('change', (e) => {
  if (view3d) view3d.setLabels(e.currentTarget.checked);
});

// Mod gambar: ?foto=semua|atas|penonton|pentas|vip memaparkan 3D sahaja tanpa butang,
// untuk menghasilkan fail gambar. Tambah &label=0 untuk sembunyikan label terapung.
const params = new URLSearchParams(location.search);
const foto = params.get('foto');
const KAPSYEN = {
  semua: 'Pandangan keseluruhan',
  atas: 'Pandangan dari atas',
  penonton: 'Pandangan dari tempat duduk',
  pentas: 'Pandangan dari pentas',
  vip: 'Laluan VIP',
};

if (foto && KAPSYEN[foto]) {
  document.body.classList.add('foto');
  show('3d');
  const kapsyen = $('#kapsyen');
  kapsyen.querySelector('span').textContent = KAPSYEN[foto];
  kapsyen.hidden = false;
  if (view3d) {
    view3d.setView(foto, true);
    if (params.get('label') === '0') view3d.setLabels(false);
  }
} else {
  show(location.hash === '#3d' ? '3d' : '2d');
}
