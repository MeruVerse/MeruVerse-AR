# Artmeru AR

Kartu edukasi augmented reality untuk empat karya patung Artmeru Gallery, berbasis MindAR dan A-Frame.

## Struktur

- `index.html`: halaman dan scene MindAR
- `js/main.js`: logika deteksi kartu, interaksi model, panel info
- `css/style.css`: gaya antarmuka
- `data/artworks.json`: data empat karya (judul, seniman, media, model, scene VR)
- `assets/cards/`: desain kartu yang dicetak
- `assets/targets/`: `targets.mind` dan gambar sumbernya di `src/`
- `assets/models/`: model 3D `.glb` hasil pindaian karya (izin seniman dan galeri)

## Kartu dan target

| Kartu | targetIndex | Karya | Model |
| --- | --- | --- | --- |
| 01 | 0 | Kait (2025) | `karya-01.glb` |
| 02 | 1 | Relax (1995) | `karya-02.glb` |
| 03 | 2 | Kawan Bergelut (2024) | `karya-03.glb` |
| 04 | 3 | Menetes (1995) | `karya-04.glb` |

Semua karya oleh Gatot Kumaidi. Data karya diambil dari artmeru.com.

- `assets/cards/karya-0X.jpg`: kartu utuh (95 × 133 mm). `kartu-cetak-a4.pdf`: lembar cetak A4 berisi keempat kartu, cetak 100% tanpa "fit to page".
- `assets/targets/src/karya-0X.jpg`: gambar yang dikompilasi menjadi `targets.mind`. Ini **area gambar kartu saja** (kotak abu-abu berisi nomor dan patung; 87 × 73 mm), bukan kartu utuh. Bingkai, kepala kartu, tabel label, dan kaki kartu sama di keempat kartu, dan judul "Kait" dan "Kawan Bergelut" sama-sama berawalan "Ka" di posisi yang sama, jadi kalau ikut dikompilasi MindAR bisa salah mengenali kartu.
- Titik (0,0,0) target ada di tengah area gambar itu (47,5 mm dari tepi kiri dan 47,5 mm dari tepi atas kartu), dan 1 satuan = lebar area gambar (87 mm).
- Kalau desain atau foto kartu diubah, kompilasi ulang keempat gambar di `assets/targets/src/` dengan urutan 01 sampai 04.

## Model

Model sudah dikompres (geometri disederhanakan, tekstur WebP 1024 px) dan dimuat tanpa decoder tambahan di A-Frame 1.5.0. Model berdiri di sumbu Y dengan titik pusat di dasarnya, jadi di atas kartu perlu `rotation="90 0 0"`. Nilai `scale` dan `position` awal tiap model ada di `data/artworks.json`. `position` menaruh model di dasar gambar patung pada kartu. Keduanya masih perlu disetel di HP.

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
