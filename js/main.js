// Artmeru AR: logika kartu edukasi.
// TODO:
// - muat data/artworks.json
// - mulai MindAR setelah tombol Mulai Pindai ditekan (RF-AR-02)
// - event targetFound / targetLost per kartu (RF-AR-03, RF-AR-04)
// - kontrol putar, perbesar, reset (RF-AR-05)
// - panel info karya (RF-AR-06) dan tombol Lihat di Galeri ke Artmeru VR (RF-AR-07)

async function loadArtworks() {
  const res = await fetch('data/artworks.json');
  return res.json();
}

loadArtworks()
  .then((data) => console.log('Karya dimuat:', data.artworks.length))
  .catch((err) => console.error('Gagal memuat artworks.json', err));
