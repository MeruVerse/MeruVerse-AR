// Artmeru AR: gerak halaman awal dengan GSAP, ScrollTrigger, dan Lenis.
// Nilai durasi, easing, dan jarak mengikuti situs tur virtual MeruVerse supaya keduanya terasa satu keluarga.
(() => {
  'use strict';

  const akar = document.documentElement;
  const g = window.gsap;
  const ST = window.ScrollTrigger;
  const kurangiGerak = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const penunjukHalus = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const DURASI = { cepat: 0.25, dasar: 0.6, lambat: 1.2 };
  const EASE = { keluar: 'expo.out', masukKeluar: 'power3.inOut', lurus: 'none' };
  const NAIK = 40;          // jarak naik saat elemen muncul
  const JEDA_BARIS = 0.08;
  const JEDA_ITEM = 0.06;
  const PRAMUAT_MIN = 1.1;  // detik
  const SCRUB = 0.7;

  const $ = (s, akar_ = document) => akar_.querySelector(s);
  const $$ = (s, akar_ = document) => [...akar_.querySelectorAll(s)];
  const pramuat = $('#pramuat');
  const kop = $('.kop');
  const hero = $('.hero');
  const tombolApung = $('#mulai');

  // ---------- Kop dan tombol mengambang: berjalan juga tanpa GSAP ----------
  function pasangGulir() {
    let yLama = window.scrollY;
    let ajakanTampak = false;
    const tombolAjakan = $('.ajakan [data-mulai]');
    const bagianBernada = $$('main [data-tone]');
    if (tombolAjakan && 'IntersectionObserver' in window) {
      new IntersectionObserver(([m]) => { ajakanTampak = m.isIntersecting; perbarui(); }).observe(tombolAjakan);
    }
    function perbarui() {
      const y = window.scrollY;
      const tinggi = window.innerHeight;
      const diBawahKop = bagianBernada.find((el) => { const k = el.getBoundingClientRect(); return k.top <= 36 && k.bottom > 36; });
      if (diBawahKop) kop.dataset.tone = diBawahKop.dataset.tone;
      tombolApung.classList.toggle('tampak', y > tinggi * 0.75 && !ajakanTampak);
      const beda = y - yLama;
      if (Math.abs(beda) < 4) return;
      kop.classList.toggle('sembunyi', y > tinggi * 0.6 && beda > 0);
      yLama = y;
    }
    window.addEventListener('scroll', perbarui, { passive: true });
    perbarui();
  }
  pasangGulir();

  const isiSiap = new Promise((selesai) => {
    if (window.artmeruSiap) selesai();
    else document.addEventListener('artmeru:siap', selesai, { once: true });
  });

  // Tanpa GSAP (CDN gagal) atau dengan "kurangi gerakan": halaman tampil apa adanya
  if (!g || !ST || kurangiGerak) {
    akar.classList.add('tanpa-animasi');
    if (pramuat) pramuat.remove();
    return;
  }
  g.registerPlugin(ST);

  // ---------- Gulir halus ----------
  let lenis = null;
  if (window.Lenis) {
    lenis = new window.Lenis();
    lenis.on('scroll', ST.update);
    g.ticker.add((waktu) => lenis.raf(waktu * 1000));
    g.ticker.lagSmoothing(0);
    lenis.stop();
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const tujuan = $(a.getAttribute('href'));
      if (!tujuan) return;
      e.preventDefault();
      lenis.scrollTo(tujuan);
    }));
  }
  document.addEventListener('artmeru:pindai', (e) => {
    hero.classList.toggle('jeda', e.detail.buka);
    if (!lenis) return;
    if (e.detail.buka) lenis.stop(); else lenis.start();
  });

  // ---------- Pecah judul menjadi kata bertopeng ----------
  function belahKata(el) {
    const kata = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.innerHTML = kata.map((k) => `<span class="belah-kata" aria-hidden="true"><span>${k}</span></span>`).join(' ');
    return $$('.belah-kata > span', el);
  }
  function belahHuruf(el) {
    el.innerHTML = [...el.textContent].map((h) => `<span style="display:inline-block">${h}</span>`).join('');
    return $$('span', el);
  }

  // ---------- Hero ----------
  const judul = $('.hero-judul');
  const hurufJudul = $$('.kata', judul).flatMap(belahHuruf);
  const lencana = $('.hero-lencana');
  const adegan = $('.hero-gerak');
  const heroKiri = $('.hero-kiri');
  const tombolHero = $('.hero [data-mulai]');
  g.set([lencana, heroKiri, tombolHero, adegan], { autoAlpha: 0 });
  g.set(hurufJudul, { yPercent: 110 });

  function pembukaHero() {
    g.to(hurufJudul, { yPercent: 0, duration: DURASI.lambat, ease: EASE.keluar, stagger: JEDA_ITEM / 2 });
    g.fromTo(lencana, { autoAlpha: 0, y: NAIK / 2 }, { autoAlpha: 1, y: 0, duration: DURASI.dasar, ease: EASE.keluar, delay: 0.3 });
    g.fromTo(adegan, { autoAlpha: 0, y: 90, scale: 0.9 }, { autoAlpha: 1, y: 0, scale: 1, duration: DURASI.lambat, ease: EASE.keluar, delay: 0.2 });
    g.delayedCall(0.55, () => window.artmeruUlangSlide && window.artmeruUlangSlide());
    g.fromTo(heroKiri, { autoAlpha: 0, y: NAIK }, { autoAlpha: 1, y: 0, duration: DURASI.dasar, ease: EASE.keluar, delay: 0.5 });
    g.fromTo(tombolHero, { autoAlpha: 0, scale: 0.94 }, { autoAlpha: 1, scale: 1, duration: DURASI.dasar, ease: EASE.keluar, delay: 0.7 });
  }

  // Dengan mouse, foto latar bergeser sedikit berlawanan arah (sama seperti hero tur virtual)
  function paralaksHero() {
    const latar = $('.hero-latar');
    const keX = g.quickTo(latar, 'x', { duration: 1.1, ease: EASE.keluar });
    const keY = g.quickTo(latar, 'y', { duration: 1.1, ease: EASE.keluar });
    hero.addEventListener('pointermove', (e) => {
      keX(-((e.clientX / window.innerWidth) * 2 - 1) * hero.offsetWidth * 0.04);
      keY(-((e.clientY / window.innerHeight) * 2 - 1) * 24);
    });
  }

  function gulirHero() {
    const pemicu = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    g.to(adegan, { scale: 0.86, ease: EASE.lurus, scrollTrigger: pemicu });
    g.to('.hero-panggung', { yPercent: 14, ease: EASE.lurus, scrollTrigger: pemicu });
    g.to('.hero-gerak', { yPercent: 8, ease: EASE.lurus, scrollTrigger: pemicu });
    g.to('.hero-bawah', { autoAlpha: 0, y: -30, ease: EASE.lurus, scrollTrigger: { trigger: hero, start: 'top top', end: '35% top', scrub: true } });
  }

  // ---------- Bagian-bagian ----------
  function munculSaatGulir(elemen) {
    if (!elemen.length) return;
    g.set(elemen, { opacity: 0, y: NAIK });
    ST.batch(elemen, {
      start: 'top 90%',
      once: true,
      onEnter: (kelompok) => g.to(kelompok, { opacity: 1, y: 0, duration: DURASI.dasar, ease: EASE.keluar, stagger: JEDA_ITEM, overwrite: true }),
    });
  }

  function judulBerbaris() {
    $$('[data-belah]').forEach((el) => {
      const kata = belahKata(el);
      g.from(kata, { yPercent: 115, rotation: 4, transformOrigin: '0% 100%', duration: DURASI.lambat, ease: EASE.keluar, stagger: JEDA_BARIS / 2, scrollTrigger: { trigger: el, start: 'top 88%', once: true } });
    });
  }

  // Latar abu bagian masuk seperti lembaran: menyempit dan membulat, lalu melebar penuh selagi digulir
  function tiraiBagian() {
    $$('.tirai').forEach((tirai) => {
      g.fromTo(tirai, { clipPath: 'inset(0% 6% 0% 6% round 44px)' }, {
        clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: EASE.lurus,
        scrollTrigger: { trigger: tirai.parentElement, start: 'top bottom', end: 'top 30%', scrub: true },
      });
    });
  }

  // Cara pakai: garis digambar dari kiri, lalu tiap langkah "menyala" saat melewati tengah layar
  function barisCara() {
    $$('[data-baris]').forEach((baris) => {
      const dt = $('dt', baris);
      const dd = $('dd', baris);
      g.set(baris, { '--garis': 0 });
      g.to(baris, { '--garis': 1, duration: DURASI.lambat, ease: EASE.masukKeluar, scrollTrigger: { trigger: baris, start: 'top 92%', once: true } });
      const pemicu = { trigger: baris, start: 'top 84%', end: 'top 48%', scrub: SCRUB };
      g.fromTo(dt, { color: '#cfcfcf', x: -14 }, { color: '#0a0a0a', x: 0, ease: EASE.lurus, scrollTrigger: pemicu });
      g.fromTo($('i', dt), { opacity: 0.25 }, { opacity: 1, ease: EASE.lurus, scrollTrigger: pemicu });
      g.fromTo(dd, { opacity: 0.22, y: 18 }, { opacity: 1, y: 0, ease: EASE.lurus, scrollTrigger: pemicu });
    });
  }

  // Karya: di layar lebar bagian ditahan dan rel bergeser ke kiri selagi digulir; di HP panelnya menumpuk
  function galeriKarya() {
    const rel = $('#daftar-karya');
    const item = $$('.karya-item', rel);
    const no = $('#karya-no');
    const maju = $('#karya-maju');
    if (!item.length) return;
    let nomorTampil = 0;
    const tampilkan = (p) => { // p: 0..1 sepanjang galeri
      const i = Math.round(p * (item.length - 1));
      g.set(maju, { scaleX: (p * (item.length - 1) + 1) / item.length });
      if (i === nomorTampil) return;
      const naik = i > nomorTampil;
      nomorTampil = i;
      g.timeline({ overwrite: true })
        .to(no, { yPercent: naik ? -70 : 70, opacity: 0, duration: 0.16, ease: 'power2.in' })
        .add(() => { no.textContent = String(i + 1).padStart(2, '0'); })
        .fromTo(no, { yPercent: naik ? 70 : -70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.3, ease: EASE.keluar });
    };
    g.set(no, { display: 'inline-block' });
    tampilkan(0);

    // Gambar terbuka dari bawah, patung mengecil ke ukurannya, lalu teks naik bergiliran
    const bukaPanel = (it, pemicu) => {
      const tl = g.timeline({ scrollTrigger: pemicu });
      tl.fromTo($('.karya-gambar', it), { clipPath: 'inset(100% 0% 0% 0% round 30px)' }, { clipPath: 'inset(0% 0% 0% 0% round 30px)', duration: DURASI.lambat, ease: EASE.keluar });
      tl.from($('.karya-gambar img', it), { scale: 1.28, yPercent: 10, duration: DURASI.lambat * 1.2, ease: EASE.keluar }, 0);
      tl.from($('.karya-angka', it), { yPercent: 40, opacity: 0, duration: DURASI.lambat, ease: EASE.keluar }, 0.1);
      tl.from([...$('.karya-teks', it).children], { opacity: 0, y: NAIK, duration: DURASI.dasar, ease: EASE.keluar, stagger: JEDA_ITEM }, 0.3);
      return tl;
    };

    const mm = g.matchMedia();
    mm.add('(min-width: 768px)', () => {
      const jarak = () => Math.max(0, rel.scrollWidth - window.innerWidth);
      const geser = g.to(rel, {
        x: () => -jarak(),
        ease: EASE.lurus,
        scrollTrigger: { trigger: '.karya', pin: '.karya-pin', start: 'top top', end: () => `+=${jarak()}`, scrub: SCRUB, invalidateOnRefresh: true, onUpdate: (st) => tampilkan(st.progress) },
      });
      item.forEach((it, i) => {
        const lintas = { containerAnimation: geser, trigger: it, start: 'left right', end: 'right left', scrub: true };
        g.fromTo($('.karya-angka', it), { xPercent: 16 }, { xPercent: -16, ease: EASE.lurus, scrollTrigger: lintas });
        g.fromTo($('.karya-gambar img', it), { xPercent: -9 }, { xPercent: 9, ease: EASE.lurus, scrollTrigger: lintas });
        bukaPanel(it, i === 0 ? { trigger: '.karya', start: 'top 55%', once: true } : { containerAnimation: geser, trigger: it, start: 'left 82%', once: true });
      });
    });
    mm.add('(max-width: 767.98px)', () => {
      const aturLekat = () => item.forEach((it, i) => {
        const dasar = 72 + i * 10; // tepi atas kartu sebelumnya tetap mengintip
        it.style.top = `${Math.min(dasar, window.innerHeight - it.offsetHeight - 16)}px`;
      });
      aturLekat();
      ST.addEventListener('refreshInit', aturLekat);
      item.forEach((it, i) => {
        bukaPanel(it, { trigger: it, start: 'top 82%', once: true });
        ST.create({ trigger: it, start: 'top 55%', end: 'bottom 55%', onToggle: (st) => { if (st.isActive) tampilkan(i / (item.length - 1)); } });
        if (i === item.length - 1) return;
        // kartu yang tertimpa mengecil dan meredup sedikit
        g.fromTo(it, { scale: 1, filter: 'brightness(1)' }, { scale: 0.93, filter: 'brightness(0.94)', ease: EASE.lurus, scrollTrigger: { trigger: item[i + 1], start: 'top 95%', end: 'top 20%', scrub: true } });
      });
      return () => { ST.removeEventListener('refreshInit', aturLekat); item.forEach((it) => { it.style.top = ''; }); };
    });
  }

  // Kipas kartu: dari tumpukan rapat membuka menjadi kipas, lalu terus berputar pelan selagi digulir
  function kipasKartu() {
    const kipas = $('.kipas');
    const kartu = $$('img', kipas);
    if (!kartu.length) return;
    const sudut = [21, 7, -7, -21];
    g.fromTo(kartu, { rotation: (i) => sudut[i] * 0.1, y: 90, scale: 0.86, opacity: 0 }, {
      rotation: (i) => sudut[i], y: 0, scale: 1, opacity: 1, ease: EASE.lurus, stagger: 0.05,
      scrollTrigger: { trigger: kipas, start: 'top 95%', end: 'top 38%', scrub: SCRUB },
    });
    g.fromTo(kipas, { rotation: -5 }, { rotation: 5, ease: EASE.lurus, scrollTrigger: { trigger: kipas, start: 'top bottom', end: 'bottom top', scrub: SCRUB } });
  }

  // Penghubung ke tur virtual: foto bergeser lebih lambat daripada isi (paralaks)
  function jembatanVr() {
    const foto = $('.jembatan-foto');
    if (!foto) return;
    g.fromTo(foto, { yPercent: -9 }, { yPercent: 9, ease: EASE.lurus, scrollTrigger: { trigger: '.jembatan', start: 'top bottom', end: 'bottom top', scrub: true } });
    g.fromTo($('img', foto), { scale: 1.16 }, { scale: 1, ease: EASE.lurus, scrollTrigger: { trigger: '.jembatan', start: 'top bottom', end: 'top 20%', scrub: true } });
  }

  // ---------- Tombol magnet dan kursor pengikut (hanya dengan mouse) ----------
  function magnet(el) {
    const atur = { duration: 0.7, ease: EASE.keluar };
    const keX = g.quickTo(el, 'x', atur);
    const keY = g.quickTo(el, 'y', atur);
    let tertarik = false;
    document.addEventListener('pointermove', (e) => {
      const k = el.getBoundingClientRect();
      const dx = e.clientX - (k.left + k.width / 2);
      const dy = e.clientY - (k.top + k.height / 2);
      const dekat = Math.hypot(dx, dy) < k.width * 0.9;
      if (dekat) { keX(dx * 0.35); keY(dy * 0.35); } else if (tertarik) { keX(0); keY(0); }
      tertarik = dekat;
    });
  }

  function kursor() {
    const cincin = document.createElement('div');
    cincin.className = 'kursor';
    cincin.setAttribute('aria-hidden', 'true');
    document.body.append(cincin);
    const atur = { duration: 0.35, ease: EASE.keluar };
    const keX = g.quickTo(cincin, 'x', atur);
    const keY = g.quickTo(cincin, 'y', atur);
    document.addEventListener('pointermove', (e) => {
      keX(e.clientX);
      keY(e.clientY);
      g.to(cincin, { opacity: akar.classList.contains('memindai') ? 0 : 1, duration: DURASI.cepat, overwrite: 'auto' });
    });
    document.addEventListener('pointerover', (e) => {
      const diAtas = e.target.closest && e.target.closest('a, button, .adegan') !== null;
      g.to(cincin, { scale: diAtas ? 2.6 : 1, duration: DURASI.cepat, ease: EASE.keluar, overwrite: 'auto' });
    });
  }

  // ---------- Pramuat: hitung 0 sampai 100, lalu tirai terangkat ----------
  function jalankanPramuat(tugas) {
    const angka = $('#pramuat-angka');
    const keadaan = { nilai: 0 };
    const tampil = () => { angka.textContent = String(Math.round(keadaan.nilai)); };
    let selesai = 0;
    tugas.forEach((t) => t.catch(() => undefined).then(() => {
      selesai += 1;
      g.to(keadaan, { nilai: (selesai / tugas.length) * 100, duration: DURASI.dasar, ease: EASE.keluar, onUpdate: tampil });
    }));
    const tunggu = (detik) => new Promise((lanjut) => g.delayedCall(detik, lanjut));
    const batas = tunggu(5); // jangan menahan halaman kalau ada gambar yang lambat
    return Promise.all([Promise.race([Promise.allSettled(tugas), batas]), tunggu(PRAMUAT_MIN)])
      .then(() => { g.to(keadaan, { nilai: 100, duration: DURASI.cepat, onUpdate: tampil, overwrite: true }); return tunggu(DURASI.cepat); })
      .then(() => new Promise((lanjut) => {
        g.to(pramuat, { clipPath: 'inset(0 0 100% 0)', duration: DURASI.lambat, ease: EASE.masukKeluar, onComplete: () => { pramuat.remove(); lanjut(); } });
        g.delayedCall(DURASI.lambat * 0.45, pembukaHero);
      }));
  }

  // ---------- Urutan ----------
  const gambarPertama = isiSiap.then(() => Promise.all([...$$('.lapis:first-child img'), $('#latar img')].map((img) => (img.decode ? img.decode() : Promise.resolve()))));
  const fonSiap = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();

  const bagianSiap = Promise.all([isiSiap, fonSiap]).then(() => {
    gulirHero();
    tiraiBagian();
    judulBerbaris();
    barisCara();
    galeriKarya();
    kipasKartu();
    jembatanVr();
    munculSaatGulir($$('[data-muncul]'));
    munculSaatGulir($$('.kaki .wadah > *'));
    if (penunjukHalus) { $$('[data-magnet]').forEach(magnet); kursor(); paralaksHero(); }
  });

  jalankanPramuat([bagianSiap, gambarPertama]).finally(() => {
    if (lenis) lenis.start();
    ST.refresh();
  });
  window.addEventListener('load', () => ST.refresh());
})();
