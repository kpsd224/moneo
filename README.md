# Moneo v1.1.15 — Source React Native + Expo (Offline Advanced)

© 2026 Na. All rights reserved.

## Mulai di komputer pengembang

Persyaratan: Node.js, npm, Android Emulator / iOS Simulator di macOS atau HP yang mendukung Expo SDK proyek.

```bash
npm install
npm start
```

**Untuk fitur widget harus gunakan development/native build, bukan Expo Go.** Expo Go tidak menyertakan modul `expo-widgets`. Untuk membuat build Android/iOS, gunakan EAS Build dan akun Expo yang Anda kelola; proses ini terpisah dari GitHub Pages dan kebijakan/biaya build dapat berubah sesuai layanan. Source ini tidak berisi APK atau IPA.

Workflow GitHub Actions ada di `.github/workflows/moneo-native.yml` dan mencari `package.json`, `app.json`, serta `assets/` langsung di root repository. Unggah isi source ke repository, termasuk `assets/icon.png`; jangan unggah ZIP sebagai satu file.

Untuk menguji keuangan **tanpa Expo**:

```bash
npm run test:core
node tests/advanced-web.test.cjs
```

`src/advanced.js` dipakai oleh aplikasi native dan website. `src/finance.ts` menghitung saldo termasuk transfer, pencairan/pelunasan utang, dan penyesuaian saldo. `src/manage.ts` mencegah penghapusan rekening/kategori yang masih digunakan. `src/ledger.ts` mengelola pencatatan/transaksi dan format backup.

## Widget maskot untuk layar utama (Android dan iPhone)

Ketuk permukaan widget untuk membuka Moneo. Tombol mata di ujung kanan menyembunyikan atau menampilkan saldo total, pemasukan, dan pengeluaran tanpa mengubah transaksi (iPhone memerlukan iOS 17+ untuk tombol interaktif). Maskot mengisi sisi kiri dan latar widget transparan. Angka asli tetap ada pada snapshot agar bisa dibuka kembali; ini privasi tampilan, bukan enkripsi. Preferensi Android di widget saat aplikasi tertutup belum tentu tercermin pada Pengaturan saat aplikasi dibuka ulang.

Source widget asli ada di `widgets/AnaFinanceWidget.android.tsx` dan `.ios.tsx`. Aset wajah ada di `assets/widget`. Pada Android, keempat gambar maskot dimasukkan ke drawable APK oleh plugin `expo-asset`, lalu widget memilihnya langsung dari status keuangan. Saat `npm install`, skrip `postinstall` memasang ikon mata serta aksi buka aplikasi pada sumber native `expo-widgets` versi 58.0.28; jalankan `npm run test:widget-build` untuk memeriksanya. Pada iOS, publisher `src/publishWidget.ts` menyalin maskot ke direktori bersama sebelum mengirim lokasinya ke widget. Ringkasan diperbarui **setelah AsyncStorage berhasil menyimpan data**. Widget Android meminta lebar awal lima kolom dan bisa diubah lebarnya; launcher tetap menentukan ukuran yang tersedia. **Tidak ada server/API/AI berbayar.**

**Langkah developer dari root source aplikasi:**

```bash
npm install
npx expo prebuild --clean
# Android: gunakan Android Studio/SDK, emulator, atau EAS Build:
npx expo run:android
# iOS: dari macOS dengan Xcode, bukan Windows/Linux:
npx expo run:ios
```

Pada build Android/iOS yang selesai terpasang, tahan bagian kosong layar utama → pilih **Widget** → cari **Moneo: Saldo & Maskot** → tambahkan. Buka aplikasi minimal sekali agar ringkasan data dan gambar maskot tersimpan. Di Pengaturan, atur hanya privasi nominal widget. Widget tampil di home screen setelah build native dipasang.

**Penting:** perintah native di atas memerlukan SDK/alat build yang sesuai. **Proyek ini belum saya build menjadi APK/IPA ataupun uji pada perangkat fisik**; hasil integrasi perlu diverifikasi pada build nyata. Adanya plugin dan source saja tidak membuktikan widget sudah tampil di layar utama semua HP. Build via EAS merupakan alternatif; layanan build pihak ketiga dapat menerapkan kuota/biaya, tetapi aplikasi sendiri tidak membutuhkan server berbayar.

Aturan ekspresi: >80% Aman/gembira, >50–80% Waspada/berpikir, 25–50% Hemat/khawatir, <25% Kritis/panik. Saldo negatif ditangani sebagai kritis. Nilai berangkat dari saldo semua dompet dibandingkan saldo tersisa ditambah pengeluaran/tabungan model lama pada **bulan sekarang**, bukan tagihan belum jatuh tempo. Transfer antar-dompet tidak mengubah status jika total saldo tidak berubah. Snapshot baru ketika data disimpan/app dibuka, **tidak dijamin berubah otomatis saat app tertutup dan hari/bulan berganti**. Gambar sepenuhnya lokal. Backup/transaksi lama tidak dimigrasi atau dihapus.

## Cara menggunakan

Saat mengisi nominal, angka ditampilkan dengan titik pemisah ribuan (contoh `68.888`); nilai tetap disimpan sebagai angka Rupiah. Form kategori menyediakan pilihan ikon saat membuat maupun mengedit kategori. Saat membuat atau mengedit dompet, pilih salah satu dari 12 ikon dan 6 warna; pilihannya tersimpan bersama data dompet. Form dompet, transaksi, kategori, dan Keuangan/Target dapat digulir di atas keyboard Android agar kolom input dan tombol simpan tetap bisa dijangkau.

Buka tab **Keuangan** pada navigasi bawah. Pintasan Backup duplikat di Keuangan tidak ada lagi; Backup & Pemulihan JSON tetap berada di **Pengaturan**. Tombol duplikat **Buka fitur Keuangan** di **Pengaturan** dihapus. Tidak ada banner promosi pada Beranda. Ada menu transfer internal, rekonsiliasi saldo, target tabungan (alokasi virtual), transaksi rutin bulanan (diposting manual), utang/piutang pokok, estimasi kekayaan bersih, opsi budget rollover, peringatan budget, dan proyeksi sederhana berbasis jadwal. Fitur dompet, kategori, edit transaksi, kalender harian, grafik, dan backup dari v1.1.3 tetap ada.

**Data hanya tersimpan pada perangkat** melalui AsyncStorage; tidak ada WhatsApp, AI berbayar, cloud, database server, atau sinkronisasi. Untuk memindahkan antar-perangkat gunakan backup JSON manual dari Pengaturan. Backup native dibagikan sebagai teks JSON lewat Share Sheet; restore menerima paste JSON. Perangkat/app tujuan sharing bisa membatasi panjang teks, jadi uji sebelum mengandalkan satu-satunya backup. Di Pengaturan juga ada **Reset semua data** dengan konfirmasi; tindakan ini mengembalikan dompet dan kategori bawaan serta menghapus transaksi, target, dan salinan pembersihan lama.

**Peringatan penting:** transaksi `saving` lama tetap mengurangi saldo sumber (semantik lama). Alokasi Target adalah pemisahan virtual yang tidak mengurangi saldo total, sedangkan Transfer antar-dompet mengurangi sumber + menambah tujuan secara berimbang. Hindari memasukkan perpindahan yang sama ke dua mekanisme berbeda.

Kelemahan yang tersisa: AsyncStorage tidak terenkripsi, tidak tersedia PIN/biometrik, transaksi rutin tidak otomatis berjalan saat app ditutup, tidak ada notifikasi OS otomatis, bunga pinjaman dicatat manual, ekspor/impor CSV tersedia di web saja, dan tidak ada impor `.xlsb` asli. Jangan simpan rahasia perbankan di aplikasi sebelum keamanan tambahan dibuat. Pengujian build native dan perangkat fisik **belum dilakukan**.

Versi aplikasi **1.1.15**, copyright **© 2026 Na**.
