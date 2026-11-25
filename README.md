# Artmeru AR

Kartu edukasi augmented reality untuk empat karya patung Artmeru Gallery, berbasis MindAR dan A-Frame.

## Struktur

- `index.html`: halaman dan scene MindAR
- `js/main.js`: logika deteksi kartu, interaksi model, panel info
- `css/style.css`: gaya antarmuka
- `data/artworks.json`: data empat karya (judul, seniman, media, model, scene VR)
- `assets/cards/`: desain kartu yang dicetak
- `assets/targets/`: `targets.mind` hasil MindAR Image Target Compiler
- `assets/models/`: model 3D `.glb` hasil pindaian karya (izin seniman dan galeri)

## Urutan kartu

Urutan gambar saat dikompilasi ke `targets.mind` menentukan `targetIndex`:
karya-01 = 0, karya-02 = 1, karya-03 = 2, karya-04 = 3.

## Menjalankan secara lokal

```bash
npm run dev
```

Halaman ini statis dan tidak perlu proses build. Kamera di ponsel hanya bisa diakses lewat HTTPS, jadi uji di ponsel memakai hosting HTTPS (GitHub Pages / Netlify) atau tunnel seperti ngrok.

## Bagian dari MeruVerse

Final project Realitas Terkembang (Kelas A), Kelompok 3. Aplikasi pasangannya: Artmeru VR (virtual tour 360°).

- Muhammad Wildan Zhafiri (235150707111048)
- Pramudhia Ananda Kresna (235150707111044)
- Ahsanta Khalqi Imany (235150707111045)
- Humaam Ahmad Yaasiin (235150707111049)
