# Langit Jingga — Vol. 1 Web Reader

Static web reader siap di-host di **GitHub Pages** atau **Netlify**.

## Isi paket

- `index.html` berada langsung di root dan menjadi halaman utama.
- Semua data bab ada di `data/bab-1.js` sampai `data/bab-8.js` dan dimuat dengan `<script>`.
- Tidak menggunakan `fetch()`, jadi tetap bisa dibuka lewat `file://`.
- Musik lokal ada di folder `audio/`.
- CSS dan JavaScript ada di `style.css` dan `js/`.
- `.nojekyll` disertakan untuk GitHub Pages.
- `netlify.toml` disertakan dengan publish directory `.`.

## GitHub Pages

1. Buat repository GitHub baru.
2. Upload **semua isi folder ini** ke root repository.
3. Buka `Settings` → `Pages`.
4. Pilih sumber deploy dari branch utama (`main`) dan folder root (`/`).
5. Simpan dan tunggu GitHub Pages menerbitkan situs.

Alamat situs biasanya akan berbentuk:

`https://USERNAME.github.io/NAMA-REPOSITORY/`

## Netlify

### Cara paling mudah

1. Buka Netlify dan pilih opsi untuk menambahkan/deploy site secara manual.
2. Upload folder **ini** sebagai folder publish, atau hubungkan repository GitHub yang berisi isi paket.
3. Netlify akan menggunakan `netlify.toml` yang sudah disertakan.

## Menjalankan lokal

Klik dua kali `index.html` untuk membuka versi `file://`.

Atau jalankan server lokal:

```bash
python -m http.server 8000
```

lalu buka `http://localhost:8000/`.

## Catatan musik

Browser modern biasanya memblokir autoplay audio sebelum ada interaksi pengguna. Karena itu musik mulai setelah tombol **Mulai Membaca** ditekan.
