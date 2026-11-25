// Artmeru AR: kartu edukasi karya patung (MindAR + A-Frame).
// Scene dibangun dari data/artworks.json: satu target per kartu, model berdiri di dasar gambar patung.
(() => {
  'use strict';

  const JEDA_LEPAS = 900; // ms menunggu sebelum lembar info turun setelah kartu hilang dari kamera
  const ZOOM_MIN = 0.5;
  const ZOOM_MAKS = 2.5;
  const DERAJAT_PER_PIKSEL = 0.5;
  const ISYARAT = 'Geser untuk memutar, cubit untuk memperbesar';
  const PETUNJUK = 'Arahkan kamera ke kartu Artmeru AR';
  // Ditampilkan bergantian kalau kartu belum juga terdeteksi
  const SARAN = [
    'Dekatkan sampai gambar kartu mengisi bidikan',
    'Hindari pantulan cahaya di kartu atau layar',
    'Lihat agak dari atas, jangan terlalu miring',
  ];
  const JEDA_SARAN = 6000;

  // Nilai bawaan pelacakan. Bisa ditimpa lewat "tracking" di data/artworks.json.
  // - filterMinCF, filterBeta: penghalus gerak MindAR. Makin kecil makin halus, tetapi model makin terlambat mengikuti kartu.
  // - warmupTolerance: jumlah frame terlacak sebelum model muncul. missTolerance: jumlah frame hilang sebelum model disembunyikan.
  // - cameraWidth, cameraHeight: resolusi kamera yang diminta. MindAR sendiri tidak meminta resolusi, sehingga HP memberi
  //   gambar kecil (sekitar 640 x 480) dan kartu yang jauh atau kecil sulit dikenali.
  // - cameraFov: sudut pandang kamera pada sisi panjang gambar, dalam derajat (0 = biarkan bawaan MindAR).
  //   MindAR menganggap sudut pandang 45 derajat pada tinggi gambar. Itu cocok untuk webcam mendatar, tetapi pada HP
  //   yang dipegang tegak sisi tingginya justru sisi panjang (sekitar 65 sampai 75 derajat), sehingga kemiringan kartu
  //   salah dihitung dan model bergetar atau tampak miring.
  const PELACAKAN = { filterMinCF: 0.001, filterBeta: 0.1, warmupTolerance: 2, missTolerance: 12, cameraWidth: 1920, cameraHeight: 1080, cameraFov: 70 };

  const $ = (id) => document.getElementById(id);
  const ui = {
    awal: $('awal'), pesan: $('pesan'), panggung: $('panggung'), ruas: $('ruas'), daftar: $('daftar-karya'),
    ket: $('ket'), ketJudul: $('ket-judul'), ketSub: $('ket-sub'),
    pindai: $('pindai'), ar: $('ar'), selesai: $('selesai'), petunjuk: $('petunjuk-teks'),
    panel: $('panel'), kepala: $('p-kepala'), no: $('p-no'), judul: $('p-judul'), sub: $('p-sub'),
    media: $('p-media'), ukuran: $('p-ukuran'), deskripsi: $('p-deskripsi'), sumber: $('p-sumber'),
    isi: $('p-isi'), lipat: $('p-lipat'), status: $('p-status'), reset: $('reset'), vr: $('p-vr'),
  };

  const st = {
    data: null,
    karya: [],       // { info, target, jangkar, putar, model, dimuat, gagal, yaw, zoom }
    scene: null,
    sistem: null,    // sistem MindAR milik scene
    menunggu: false, // start() sudah dipanggil, arReady belum datang
    siap: false,     // kamera dan pelacakan berjalan
    batal: false,    // pengguna menekan Selesai sebelum arReady
    aktif: null,     // karya yang sedang ditampilkan di lembar info
    timerLepas: null,
    timerSaran: null,
    slide: 0,
  };

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const batasi = (v, a, b) => Math.min(b, Math.max(a, v));
  const duaAngka = (n) => String(n).padStart(2, '0');
  const tanpaGerak = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Halaman awal ----------

  function pesan(teks) {
    ui.pesan.textContent = teks || '';
    ui.pesan.hidden = !teks;
  }

  // Ukuran kartu cetak (mm) dan letak pusat target di kartu, untuk menaruh patung di kartu 3D halaman awal
  const KARTU = { lebar: 95, tinggi: 133, pusatX: 47.5, pusatY: 47.47 };

  // Adegan 3D: kartu tergeletak miring dan potongan foto patung berdiri dari gambarnya di kartu.
  // Keempat karya bergantian. Ruas kemajuan yang selesai terisi memicu karya berikutnya.
  function buatPanggung(data) {
    const lebarTarget = Number(data.targetWidthMm) || 87;
    const lapis = data.artworks.map((k, i) => {
      const [px, py] = String(k.position).split(' ').map(Number);
      const x = (KARTU.pusatX + px * lebarTarget) / KARTU.lebar;
      const y = (KARTU.pusatY - py * lebarTarget) / KARTU.tinggi;
      const kartu = `assets/img/kartu-${duaAngka(i + 1)}.webp`;
      return `
      <div class="lapis" style="--x: ${x.toFixed(4)}; --y: ${y.toFixed(4)}; --h: 1.15">
        <img class="kartu3d" src="${kartu}" alt="" decoding="async">
        <div class="bayang"></div>
        ${k.image ? `<img class="tegak" src="${esc(k.image)}" alt="${esc(k.title)}, patung karya ${esc(k.artist)}" decoding="async">` : ''}
      </div>`;
    }).join('');
    ui.panggung.innerHTML = `<div class="melayang"><div class="meja">${lapis}</div></div>`;
    ui.ruas.innerHTML = data.artworks.map(() => '<i><u></u></i>').join('');
    ui.panggung.tabIndex = 0;
    ui.panggung.setAttribute('role', 'button');
    ui.panggung.setAttribute('aria-label', 'Empat karya di kartu Artmeru AR. Tekan untuk melihat karya berikutnya.');

    // Tinggi patung mengikuti bentuk fotonya: karya yang melebar dibuat lebih pendek
    ui.panggung.querySelectorAll('.tegak').forEach((img) => {
      const atur = () => { if (img.naturalWidth) img.parentElement.style.setProperty('--h', Math.min(1.15, 0.94 * img.naturalHeight / img.naturalWidth).toFixed(3)); };
      if (img.complete) atur(); else img.addEventListener('load', atur, { once: true });
    });

    const hero = ui.panggung.closest('.hero');
    ui.ruas.addEventListener('animationend', (e) => { if (e.animationName === 'isi') tampilSlide(st.slide + 1); });
    ui.panggung.addEventListener('click', () => tampilSlide(st.slide + 1));
    ui.panggung.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); tampilSlide(st.slide + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); tampilSlide(st.slide - 1); }
    });
    // Tahan jari di adegan untuk berhenti sejenak
    ui.panggung.addEventListener('pointerdown', () => hero.classList.add('jeda'));
    ['pointerup', 'pointercancel', 'pointerleave'].forEach((n) => ui.panggung.addEventListener(n, () => hero.classList.remove('jeda')));

    // Dengan mouse, kartu ikut miring mengikuti penunjuk
    const meja = ui.panggung.querySelector('.meja');
    hero.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse' || tanpaGerak()) return;
      const r = hero.getBoundingClientRect();
      meja.style.setProperty('--rz', `${(((e.clientX - r.left) / r.width) - 0.5) * 16}deg`);
      meja.style.setProperty('--rx', `${(0.5 - ((e.clientY - r.top) / r.height)) * 10}deg`);
    });
    hero.addEventListener('pointerleave', () => { meja.style.removeProperty('--rz'); meja.style.removeProperty('--rx'); });

    requestAnimationFrame(() => tampilSlide(0));
  }

  function tampilSlide(i) {
    const lapis = ui.panggung.querySelectorAll('.lapis');
    const ruas = ui.ruas.querySelectorAll('i');
    if (!lapis.length) return;
    st.slide = (i + lapis.length) % lapis.length;
    lapis.forEach((l, n) => l.classList.toggle('aktif', n === st.slide));
    const k = st.data.artworks[st.slide];
    // Foto latar ikut berganti. Foto berikutnya dimuat lebih dulu supaya pergantiannya mulus
    const latar = [...document.querySelectorAll('#latar img')];
    const muat = (img) => { if (img && img.dataset.src) { img.srcset = img.dataset.srcset || ''; img.src = img.dataset.src; delete img.dataset.src; } };
    if (latar.length) {
      muat(latar[st.slide % latar.length]);
      muat(latar[(st.slide + 1) % latar.length]);
      latar.forEach((img, n) => img.classList.toggle('aktif', n === st.slide % latar.length));
    }
    ui.ketJudul.textContent = k.title;
    ui.ketSub.textContent = [k.artist, k.year].filter(Boolean).join(', ');
    ui.ket.classList.remove('ganti');
    ruas.forEach((r, n) => {
      r.classList.remove('jalan');
      r.classList.toggle('lewat', n < st.slide);
    });
    void ui.ruas.offsetWidth; // mulai ulang animasi ruas dan keterangan
    ui.ket.classList.add('ganti');
    ruas[st.slide].classList.add('jalan');
  }

  // Mainkan lagi animasi patung berdiri pada karya yang sedang tampil (dipakai js/landing.js setelah pramuat)
  window.artmeruUlangSlide = () => {
    ui.panggung.querySelectorAll('.lapis').forEach((l) => l.classList.remove('aktif'));
    void ui.panggung.offsetWidth;
    tampilSlide(st.slide);
  };

  // Alamat ruang tempat karya ini berada di tur virtual MeruVerse (kosong kalau belum diisi di artworks.json)
  function tautanVr(k) {
    const dasar = st.data && st.data.vrUrl;
    if (!dasar || !k.vrScene) return '';
    return `${dasar}${dasar.includes('?') ? '&' : '?'}scene=${encodeURIComponent(k.vrScene)}`;
  }

  // Bagian "Empat karya": satu panel per karya
  function buatDaftarKarya(data) {
    ui.daftar.innerHTML = data.artworks.map((k, i) => `
      <article class="karya-item">
        <div class="karya-gambar">
          <span class="karya-angka" aria-hidden="true">${duaAngka(i + 1)}</span>
          ${k.image ? `<img src="${esc(k.image)}" alt="${esc(k.title)}, patung karya ${esc(k.artist)}" loading="lazy" decoding="async">` : ''}
        </div>
        <div class="karya-teks">
          <p class="alis">${esc([k.artist, k.year].filter(Boolean).join(', '))}</p>
          <h3>${esc(k.title)}</h3>
          <p class="uraian">${esc(k.description || '')}</p>
          <dl>
            <div><dt class="alis">Media</dt><dd>${esc(k.medium || '-')}</dd></div>
            <div><dt class="alis">Ukuran</dt><dd>${esc(k.size || '-')}</dd></div>
          </dl>
          ${tautanVr(k) ? `<a class="garis-api karya-vr" href="${esc(tautanVr(k))}" target="_blank" rel="noopener">Lihat di tur virtual</a>` : ''}
        </div>
      </article>`).join('');
  }

  // Beri tahu js/landing.js bahwa isi halaman sudah dibuat, atau bahwa tampilan pindai dibuka dan ditutup
  const kabari = (nama, detail) => document.dispatchEvent(new CustomEvent(`artmeru:${nama}`, { detail }));

  function bisaMemindai() {
    if (!window.AFRAME || !AFRAME.systems['mindar-image-system']) {
      pesan('Pustaka AR gagal dimuat. Periksa koneksi internet, lalu muat ulang halaman.');
      return false;
    }
    if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      pesan('Kamera hanya bisa dibuka lewat alamat HTTPS (atau localhost). Buka halaman ini dari alamat HTTPS.');
      return false;
    }
    if (!st.data) {
      pesan('Data karya belum termuat. Muat ulang halaman.');
      return false;
    }
    return true;
  }

  // ---------- Scene ----------

  function buatScene() {
    const { data } = st;
    const target = data.artworks.map((k) => `
      <a-entity class="target" mindar-image-target="targetIndex: ${Number(k.targetIndex)}">
        <a-entity class="jangkar" position="${esc(k.position)}">
          <a-entity rotation="${esc(k.rotation)}">
            <a-entity class="putar">
              <a-entity class="model" gltf-model="url(${esc(k.model)})" scale="${Number(k.scale)} ${Number(k.scale)} ${Number(k.scale)}"></a-entity>
            </a-entity>
          </a-entity>
        </a-entity>
      </a-entity>`).join('');

    const t = { ...PELACAKAN, ...(data.tracking || {}) };
    const pelacakan = ['filterMinCF', 'filterBeta', 'warmupTolerance', 'missTolerance'].map((n) => `${n}: ${Number(t[n])}`).join('; ');

    ui.ar.insertAdjacentHTML('afterbegin', `
      <a-scene embedded
        mindar-image="imageTargetSrc: ${esc(data.targets)}; autoStart: false; maxTrack: 1; uiLoading: no; uiScanning: no; uiError: no; ${pelacakan}"
        vr-mode-ui="enabled: false"
        device-orientation-permission-ui="enabled: false"
        loading-screen="enabled: false"
        renderer="colorManagement: true; antialias: true; alpha: true">
        <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
        ${target}
      </a-scene>`);

    st.scene = ui.ar.querySelector('a-scene');
    st.scene.addEventListener('arReady', saatSiap);
    st.scene.addEventListener('arError', saatGalat);

    const entitas = st.scene.querySelectorAll('.target');
    st.karya = data.artworks.map((info, i) => {
      const k = {
        info, nomor: i + 1,
        target: entitas[i],
        jangkar: entitas[i].querySelector('.jangkar'),
        putar: entitas[i].querySelector('.putar'),
        model: entitas[i].querySelector('.model'),
        dimuat: false, gagal: false, yaw: 0, zoom: 1,
      };
      k.target.addEventListener('targetFound', () => saatDitemukan(k));
      k.target.addEventListener('targetLost', () => saatHilang(k));
      k.model.addEventListener('model-loaded', () => { k.dimuat = true; if (st.aktif === k) perbaruiStatus(); });
      k.model.addEventListener('model-error', () => { k.gagal = true; if (st.aktif === k) perbaruiStatus(); });
      return k;
    });
  }

  // MindAR memanggil getUserMedia tanpa ukuran. Tambahkan resolusi yang diinginkan ke permintaan itu.
  function mintaResolusiKamera() {
    const md = navigator.mediaDevices;
    if (md.artmeruAsli) return;
    const t = { ...PELACAKAN, ...(st.data.tracking || {}) };
    const dari = new URLSearchParams(location.search).get('res'); // misalnya ?res=720 untuk HP yang berat di 1080
    const tinggi = Number(dari) || Number(t.cameraHeight);
    const lebar = Number(dari) ? Math.round(Number(dari) * 16 / 9) : Number(t.cameraWidth);
    if (!lebar || !tinggi) return;
    md.artmeruAsli = md.getUserMedia.bind(md);
    md.getUserMedia = (c) => {
      if (!c || !c.video || typeof c.video !== 'object') return md.artmeruAsli(c);
      const video = { ...c.video, width: { ideal: lebar }, height: { ideal: tinggi } };
      return md.artmeruAsli({ ...c, video }); // "ideal" tidak pernah membuat permintaan gagal; HP memberi ukuran terdekat
    };
  }

  // Ganti anggapan sudut pandang MindAR sebelum pelacak dibuat. _resize() dipanggil MindAR tepat setelah
  // controller dibuat dan sebelum target dimuat, jadi di situlah proyeksi kamera diganti.
  function pasangSudutPandang(sistem) {
    const fov = Number({ ...PELACAKAN, ...(st.data.tracking || {}) }.cameraFov);
    if (!fov || sistem.artmeruFov) return;
    sistem.artmeruFov = true;
    const resizeAsli = sistem._resize;
    let terpasang = null;
    sistem._resize = function resize() {
      const c = this.controller;
      if (c && c !== terpasang && typeof c._glProjectionMatrix === 'function') {
        terpasang = c;
        const f = Math.max(c.inputWidth, c.inputHeight) / 2 / Math.tan(fov * Math.PI / 360);
        c.projectionTransform = [[f, 0, c.inputWidth / 2], [0, f, c.inputHeight / 2], [0, 0, 1]];
        c.projectionMatrix = c._glProjectionMatrix({ projectionTransform: c.projectionTransform, width: c.inputWidth, height: c.inputHeight, near: 10, far: 100000 });
      }
      return resizeAsli.call(this);
    };
  }

  // ---------- Mulai dan selesai memindai (RF-AR-02) ----------

  // memuat | mencari | karya
  function keadaan(k) {
    ui.pindai.dataset.keadaan = k;
    clearInterval(st.timerSaran);
    if (k !== 'mencari') return;
    ui.petunjuk.textContent = PETUNJUK;
    let n = 0;
    st.timerSaran = setInterval(() => { ui.petunjuk.textContent = SARAN[n++ % SARAN.length]; }, JEDA_SARAN);
  }

  function mulai() {
    pesan('');
    if (!bisaMemindai()) return;

    keadaan('memuat');
    ui.pindai.hidden = false;
    ui.awal.inert = true;
    document.documentElement.classList.add('memindai');
    kabari('pindai', { buka: true });
    st.batal = false;

    mintaResolusiKamera();
    if (!st.scene) buatScene();
    st.scene.play();
    if (st.menunggu) return; // start sebelumnya masih berjalan, tunggu arReady

    st.menunggu = true;
    const jalankan = () => {
      st.sistem = st.scene.systems['mindar-image-system'];
      pasangSudutPandang(st.sistem);
      st.scene.resize();
      st.sistem.start();
    };
    if (st.scene.renderStarted) jalankan();
    else st.scene.addEventListener('renderstart', jalankan, { once: true });
  }

  function saatSiap() {
    st.menunggu = false;
    st.siap = true;
    if (st.batal) { matikanKamera(); return; }
    keadaan('mencari');
  }

  function saatGalat() {
    st.menunggu = false;
    st.siap = false;
    if (st.sistem && st.sistem.video) st.sistem.video.remove();
    kembaliKeAwal();
    pesan('Kamera tidak bisa dibuka. Izinkan akses kamera untuk situs ini di pengaturan browser, lalu coba lagi.');
  }

  function matikanKamera() {
    if (st.siap && st.sistem) {
      try { st.sistem.stop(); } catch (e) { console.warn('Gagal menghentikan MindAR', e); }
    }
    st.siap = false;
  }

  function kembaliKeAwal() {
    clearTimeout(st.timerLepas);
    clearInterval(st.timerSaran);
    st.aktif = null;
    st.karya.forEach((k) => { k.target.object3D.visible = false; });
    if (st.scene) st.scene.pause();
    ui.pindai.hidden = true;
    ui.awal.inert = false;
    document.documentElement.classList.remove('memindai');
    kabari('pindai', { buka: false });
    tampilSlide(st.slide);
  }

  function selesai() {
    if (st.menunggu) st.batal = true; // kamera dimatikan begitu arReady datang
    matikanKamera();
    kembaliKeAwal();
  }

  // ---------- Kartu terdeteksi dan hilang (RF-AR-03, RF-AR-04) ----------

  function saatDitemukan(k) {
    clearTimeout(st.timerLepas);
    if (st.aktif !== k) {
      k.yaw = 0;
      k.zoom = 1;
      terapkan(k);
      st.aktif = k;
      isiLembar(k);
      muncul(k);
    }
    keadaan('karya');
  }

  function saatHilang(k) {
    clearTimeout(st.timerLepas);
    st.timerLepas = setTimeout(() => {
      if (st.aktif !== k || k.target.object3D.visible) return;
      st.aktif = null;
      if (st.siap) keadaan('mencari');
    }, JEDA_LEPAS);
  }

  // Model membesar dari 60% saat pertama muncul
  function muncul(k) {
    const o = k.jangkar.object3D;
    if (tanpaGerak()) { o.scale.setScalar(1); return; }
    const t0 = performance.now();
    const langkah = (t) => {
      const p = batasi((t - t0) / 420, 0, 1);
      o.scale.setScalar(0.6 + 0.4 * (1 - Math.pow(1 - p, 3)));
      if (p < 1 && st.aktif === k) requestAnimationFrame(langkah);
      else o.scale.setScalar(1);
    };
    requestAnimationFrame(langkah);
  }

  // ---------- Lembar info (RF-AR-06) dan tautan ke Artmeru VR (RF-AR-07) ----------

  function isiLembar(k) {
    const { info } = k;
    ui.no.textContent = duaAngka(k.nomor);
    ui.judul.textContent = info.title;
    ui.sub.textContent = [info.artist, info.year].filter(Boolean).join(', ');
    ui.media.textContent = info.medium || '-';
    ui.ukuran.textContent = info.size || '-';
    ui.deskripsi.textContent = info.description || '';
    ui.sumber.hidden = !info.source;
    if (info.source) ui.sumber.href = info.source;

    const vr = tautanVr(info);
    ui.vr.hidden = !vr;
    if (vr) ui.vr.href = vr;

    ui.isi.firstElementChild.scrollTop = 0;
    perbaruiStatus();

    // mulai ulang animasi masuk isi lembar
    ui.panel.classList.remove('ganti');
    void ui.panel.offsetWidth;
    ui.panel.classList.add('ganti');
  }

  function perbaruiStatus() {
    const k = st.aktif;
    if (!k) return;
    ui.status.textContent = k.gagal ? 'Model 3D gagal dimuat' : k.dimuat ? ISYARAT : 'Memuat model 3D…';
    ui.reset.disabled = !k.dimuat;
  }

  function lipat(buka) {
    const terbuka = typeof buka === 'boolean' ? buka : ui.isi.classList.contains('tutup');
    ui.isi.classList.toggle('tutup', !terbuka);
    ui.isi.inert = !terbuka;
    ui.lipat.setAttribute('aria-expanded', String(terbuka));
    ui.lipat.setAttribute('aria-label', terbuka ? 'Sembunyikan keterangan' : 'Tampilkan keterangan');
  }

  // Usap kepala lembar ke bawah untuk melipat, ke atas untuk membuka
  function pasangUsapLembar() {
    let y0 = null;
    const mulaiUsap = (e) => { y0 = e.clientY; };
    const akhirUsap = (e) => {
      if (y0 === null) return;
      const dy = e.clientY - y0;
      y0 = null;
      if (dy > 24) lipat(false);
      else if (dy < -24) lipat(true);
    };
    [ui.kepala, ui.lipat].forEach((el) => {
      el.addEventListener('pointerdown', mulaiUsap);
      el.addEventListener('pointerup', akhirUsap);
      el.addEventListener('pointercancel', () => { y0 = null; });
    });
  }

  // ---------- Putar, perbesar, atur ulang (RF-AR-05) ----------

  function terapkan(k) {
    k.putar.object3D.rotation.y = k.yaw * Math.PI / 180;
    k.putar.object3D.scale.setScalar(k.zoom);
  }

  const jari = new Map();
  let jarakAwal = 0;
  let zoomAwal = 1;
  const jarakJari = () => {
    const [a, b] = [...jari.values()];
    return Math.hypot(a.x - b.x, a.y - b.y) || 1;
  };

  function pasangGestur() {
    const lepas = (e) => {
      jari.delete(e.pointerId);
      if (jari.size === 2) { jarakAwal = jarakJari(); zoomAwal = st.aktif ? st.aktif.zoom : 1; }
    };
    ui.ar.addEventListener('pointerdown', (e) => {
      if (!st.aktif) return;
      jari.set(e.pointerId, { x: e.clientX, y: e.clientY });
      try { ui.ar.setPointerCapture(e.pointerId); } catch (_) { /* pointer sudah lepas */ }
      if (jari.size === 2) { jarakAwal = jarakJari(); zoomAwal = st.aktif.zoom; }
    });
    ui.ar.addEventListener('pointermove', (e) => {
      const lama = jari.get(e.pointerId);
      const k = st.aktif;
      if (!lama || !k) return;
      jari.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (jari.size === 1) k.yaw += (e.clientX - lama.x) * DERAJAT_PER_PIKSEL;
      else if (jari.size === 2) k.zoom = batasi(zoomAwal * jarakJari() / jarakAwal, ZOOM_MIN, ZOOM_MAKS);
      terapkan(k);
    });
    ui.ar.addEventListener('pointerup', lepas);
    ui.ar.addEventListener('pointercancel', lepas);
    ui.ar.addEventListener('wheel', (e) => {
      const k = st.aktif;
      if (!k) return;
      e.preventDefault();
      k.zoom = batasi(k.zoom * Math.exp(-e.deltaY * 0.0015), ZOOM_MIN, ZOOM_MAKS);
      terapkan(k);
    }, { passive: false });
    // Safari iOS: cegah halaman ikut diperbesar saat mencubit model
    document.addEventListener('gesturestart', (e) => { if (!ui.pindai.hidden) e.preventDefault(); });
  }

  // Kembali ke posisi awal dengan gerakan halus
  function aturUlang() {
    const k = st.aktif;
    if (!k) return;
    if (tanpaGerak()) { k.yaw = 0; k.zoom = 1; terapkan(k); return; }
    const yaw0 = ((k.yaw + 180) % 360 + 360) % 360 - 180; // putar lewat jalan terpendek
    const zoom0 = k.zoom;
    const t0 = performance.now();
    const langkah = (t) => {
      const p = batasi((t - t0) / 380, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      k.yaw = yaw0 * (1 - e);
      k.zoom = zoom0 + (1 - zoom0) * e;
      terapkan(k);
      if (p < 1 && st.aktif === k && !jari.size) requestAnimationFrame(langkah);
    };
    requestAnimationFrame(langkah);
  }

  // ---------- Awal ----------

  document.querySelectorAll('[data-mulai]').forEach((b) => b.addEventListener('click', mulai));
  ui.selesai.addEventListener('click', selesai);
  ui.reset.addEventListener('click', aturUlang);
  ui.lipat.addEventListener('click', () => lipat());
  pasangUsapLembar();
  pasangGestur();

  // Kamera berhenti mengirim gambar saat tab disembunyikan; lanjutkan lagi saat kembali
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !st.siap || !st.sistem || !st.sistem.video) return;
    st.sistem.video.play().catch(() => {});
  });

  fetch('data/artworks.json')
    .then((res) => { if (!res.ok) throw new Error(`HTTP ${res.status}`); return res.json(); })
    .then((data) => { st.data = data; buatPanggung(data); buatDaftarKarya(data); window.artmeruSiap = true; kabari('siap'); })
    .catch((err) => { console.error('Gagal memuat artworks.json', err); window.artmeruSiap = true; kabari('siap'); pesan('Data karya gagal dimuat. Muat ulang halaman.'); });
})();
