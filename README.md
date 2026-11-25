# Artmeru AR

Kartu edukasi augmented reality untuk empat karya patung Artmeru Gallery, berbasis MindAR dan A-Frame.

## Struktur

- `index.html`: halaman awal, tampilan pindai, dan lembar info
- `js/main.js`: membangun scene MindAR dari data, deteksi kartu, interaksi model, panel info
- `css/style.css`: gaya antarmuka (palet artmeru.com, huruf Inter)
- `data/artworks.json`: data empat karya (judul, seniman, media, model, gambar, suara, skala, posisi, scene VR)
- `assets/img/`: gambar untuk antarmuka. `karya-0X.webp` potongan foto patung, `kartu-0X.webp` kartu ukuran kecil untuk kartu 3D di halaman awal
- `assets/cards/`: desain kartu yang dicetak
- `assets/targets/`: `targets.mind` dan gambar sumbernya di `src/`
- `assets/models/`: model 3D `.glb` hasil pindaian karya (izin seniman dan galeri)
- `assets/audio/`: narasi deskripsi tiap karya, `karya-0X.mp3`

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

Model sudah dikompres (geometri disederhanakan, tekstur WebP 1024 px) dan dimuat tanpa decoder tambahan di A-Frame 1.5.0. Model berdiri di sumbu Y dengan titik pusat di dasarnya, jadi di atas kartu perlu `rotation="90 0 0"`. Nilai `scale` dan `position` tiap model ada di `data/artworks.json`. `position` menaruh model di dasar gambar patung pada kartu, dan `scale` membuat tinggi model 1,15 kali tinggi gambar patung di kartu (sekitar 52 sampai 79 mm). Keduanya baru diuji di simulasi, jadi masih perlu disetel di HP.

## Narasi

Tombol pengeras suara membacakan deskripsi karya. Tombolnya ada di lembar info tampilan pindai dan di tiap kartu daftar karya di halaman awal. Narasinya berkas MP3 siap pakai yang dibuat sekali dengan ElevenLabs Eleven v4 (suara Matilda) lewat OpenRouter, jadi aplikasi tidak memanggil layanan apa pun saat dipakai. Teks yang dibacakan sama persis dengan `description` di `data/artworks.json`: kalau deskripsi diubah, narasinya perlu dibuat ulang. Karya tanpa kunci `audio` tidak menampilkan tombol suara.

## Cara kerja

1. Halaman awal berisi kartu 3D yang patungnya berdiri dari gambarnya dan bergantian memperlihatkan keempat karya (ketuk untuk pindah, tahan untuk berhenti sejenak), tiga langkah pemakaian, daftar karya, dan tautan lembar kartu. Kamera baru diminta setelah tombol **Mulai pindai** ditekan.
2. `js/main.js` membaca `data/artworks.json`, lalu membuat satu `mindar-image-target` per karya. Menambah atau mengubah karya cukup lewat file JSON itu.
3. Saat kartu terdeteksi, model muncul di atas kartu dan lembar info meluncur naik berisi judul, seniman, tahun, media, ukuran, dan deskripsi. Lembar bisa dilipat lewat pegangannya (ketuk atau usap), dan turun lagi sekitar satu detik setelah kartu lepas dari kamera.
4. Geser satu jari untuk memutar model, cubit (atau roda mouse) untuk memperbesar, **Atur ulang** untuk mengembalikan.
5. Tombol pengeras suara membacakan deskripsi karya; ketuk lagi untuk menghentikan. Narasi tetap berjalan sampai habis kalau kartu lepas dari kamera, dan berhenti saat kartu lain terdeteksi atau **Selesai** ditekan.
6. Tombol **Lihat di galeri** muncul kalau `vrUrl` (alamat Artmeru VR) dan `vrScene` karya itu sudah diisi di `artworks.json`. Tautannya `vrUrl?scene=vrScene`.

## Pelacakan

Tiga penyetelan di luar bawaan MindAR, semuanya bisa diubah lewat `tracking` di `data/artworks.json`:

| Kunci | Nilai | Guna |
| --- | --- | --- |
| `cameraWidth`, `cameraHeight` | 1920 × 1080 | MindAR tidak meminta resolusi, sehingga HP hanya memberi sekitar 640 × 480 dan kartu yang kecil atau jauh sulit dikenali. |
| `cameraFov` | 70 | Sudut pandang kamera pada sisi panjang gambar. MindAR menganggap 45° pada tinggi gambar; di HP yang dipegang tegak itu meleset jauh, sehingga kemiringan kartu salah dihitung dan model bergetar. Isi 0 untuk kembali ke bawaan MindAR. |
| `filterMinCF`, `filterBeta` | 0,001 dan 0,1 | Penghalus gerak. Makin kecil makin halus, tetapi model makin terlambat mengikuti kartu. |
| `warmupTolerance`, `missTolerance` | 2 dan 12 | Jumlah frame terlacak sebelum model muncul, dan jumlah frame hilang sebelum model disembunyikan. |

Kalau HP terasa berat di 1080p, buka dengan `?res=480` di ujung alamat. Hindari 720: MindAR hanya memeriksa potongan 256 piksel di tengah gambar pada resolusi itu, sehingga kartu yang dekat tidak muat.

Di simulasi dengan kamera bersudut lebar, getaran puncak model turun dari 1 sampai 42 piksel (bawaan MindAR, 480p) menjadi 0 sampai 4 piksel, dan kartu terdeteksi sampai kemiringan 50° pada jarak 20 sampai 40 cm. Ini belum diukur di HP sungguhan. Kartu di layar HP lain jauh lebih sulit daripada kartu cetak: ukurannya separuh, dan layarnya memantulkan cahaya.

## Menjalankan secara lokal

```bash
npm run dev
```

Halaman ini statis dan tidak perlu proses build. Di laptop, `http://localhost:5174` sudah cukup untuk memakai webcam.

## Mencoba di HP

Kamera di HP hanya bisa diakses lewat HTTPS, jadi alamat `http://192.168.x.x` dari laptop tidak bisa dipakai. Pilihannya:

- **GitHub Pages**: Settings → Pages → Deploy from a branch → `main`, folder `/ (root)`. Semua alamat file di aplikasi ini relatif, jadi bisa langsung jalan di alamat Pages.
- **Tunnel** seperti ngrok ke `localhost:5174` untuk uji cepat tanpa push.

Buka alamatnya di Chrome (Android) atau Safari (iPhone), tekan Mulai pindai, izinkan kamera, lalu arahkan ke kartu cetak atau ke gambar kartu di layar laptop.

## Bagian dari MeruVerse

Final project Realitas Terkembang (Kelas A), Kelompok 3. Aplikasi pasangannya: Artmeru VR (virtual tour 360°).

- Muhammad Wildan Zhafiri (235150707111048)
- Pramudhia Ananda Kresna (235150707111044)
- Ahsanta Khalqi Imany (235150707111045)
- Humaam Ahmad Yaasiin (235150707111049)
