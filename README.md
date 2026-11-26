# Moneo v1.1.17 — Source React Native + Expo (Offline Advanced)

© 2026 Na. All rights reserved.

## Mulai di komputer pengembang

Persyaratan: Node.js, npm, Android Emulator / iOS Simulator di macOS atau HP yang mendukung Expo SDK proyek.

```bash
npm install
npm start
```

**Untuk fitur widget harus gunakan development/native build, bukan Expo Go.** Expo Go tidak menyertakan modul `expo-widgets`. Untuk membuat build Android/iOS, gunakan EAS Build dan akun Expo yang Anda kelola; proses ini terpisah dari GitHub Pages dan kebijakan/biaya build dapat berubah sesuai layanan. Source ini tidak berisi APK atau IPA.

Workflow GitHub Actions ada di `.github/workflows/moneo-native.yml` dan mencari `package.json`, `app.json`, serta `assets/` langsung di root repository. Unggah isi source ke repository, termasuk `assets/icon.png`; jangan unggah ZIP sebagai satu file.

Untuk menguji source aplikasi secara mandiri:

```bash
npm test
```

Tes integrasi website terpisah tersedia lewat `npm run test:web` bila source aplikasi ditempatkan sebagai folder `mobile/` di samping folder `site/`.

`src/advanced.js` dipakai oleh aplikasi native dan website. `src/finance.ts` menghitung saldo termasuk transfer, pencairan/pelunasan utang, dan penyesuaian saldo. `src/manage.ts` mencegah penghapusan rekening/kategori yang masih digunakan. `src/ledger.ts` mengelola pencatatan/transaksi dan format backup.

## Widget maskot untuk layar utama (Android dan iPhone)

Ketuk permukaan widget untuk membuka Moneo. Tombol mata di samping judul menyembunyikan atau menampilkan saldo total, pemasukan, dan pengeluaran tanpa mengubah transaksi (iPhone memerlukan iOS 17+ untuk tombol interaktif). Kartu Android berukuran visual 320 × 180 dp dan dipusatkan di area widget agar proporsinya mendatar. Logo dari aset asli, maskot yang aktif, saldo besar, serta kartu pemasukan dan pengeluaran mengikuti contoh desain Moneo. Angka asli tetap ada pada snapshot agar bisa dibuka kembali; ini privasi tampilan, bukan enkripsi. Preferensi Android di widget saat aplikasi tertutup belum tentu tercermin pada Pengaturan saat aplikasi dibuka ulang.

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

Saat mengisi nominal, angka ditampilkan dengan titik pemisah ribuan (contoh `68.888`); nilai tetap disimpan sebagai angka Rupiah. Form kategori menyediakan pilihan ikon saat membuat maupun mengedit kategori. Saat membuat atau mengedit dompet, pilih salah satu dari 12 ikon dan 6 warna; pilihannya tersimpan bersama data dompet. Form dompet, transaksi, kategori, Keuangan, dan Tabungan dapat digulir di atas keyboard agar kolom input dan tombol simpan tetap bisa dijangkau.

Ketuk kolom tanggal untuk membuka kalender perangkat pada transaksi, transfer, jadwal bulanan, utang/piutang, rekonsiliasi, alokasi, pencairan, dan tenggat tujuan. Tanggal di Aktivitas juga memakai kalender perangkat. Tenggat tujuan dapat dikosongkan dengan **Hapus tenggat**. Pilihan bulan laporan tetap terpisah karena memilih periode bulan, bukan tanggal harian. Tanggal disimpan sebagai hari lokal `YYYY-MM-DD` tanpa konversi UTC.

Untuk pembayaran mendatang, ketuk **Tambah jadwal** di Beranda atau **Jadwalkan bayar** di Keuangan. Isi nama tagihan, kategori pengeluaran, dompet, nominal, dan jatuh tempo melalui kalender perangkat. Beranda menampilkan tiga jadwal terdekat, jumlah tagihan 30 hari termasuk tunggakan, perkiraan sisa saldo jika semuanya dibayar, serta dompet yang dananya belum cukup. Daftar di Keuangan menandai jadwal hari ini dan yang terlambat; delapan jadwal pertama ditampilkan, dengan tombol untuk melihat semuanya. Ketuk tagihan di Beranda atau **Catat bayar** di Keuangan saat membayar: formulir pengeluaran terisi otomatis dan masih bisa diperiksa sebelum disimpan. Jadwal saja tidak mengurangi saldo. Setelah transaksi disimpan, jadwal menjadi **Sudah dicatat**; tombol **Lihat transaksi** membuka catatan terkait. Pengeluaran masuk laporan serta peringatan batas harian. Jika transaksi pembayaran dihapus, jadwal kembali belum dibayar. Jadwal ikut dalam backup JSON. Pengingat tampil di aplikasi; belum ada notifikasi saat aplikasi tertutup.

Saat menambah transaksi, dompet diurutkan menurut jumlah transaksi pada jenis yang dipilih (pengeluaran, pemasukan, atau tabungan); jika jumlahnya sama, yang lebih baru dipakai tampil lebih dulu. Dompet teratas otomatis dipilih untuk transaksi baru. Urutan daftar dompet asli tidak berubah. Pada **Pengaturan → Batas pengeluaran harian**, isi jumlah maksimal untuk semua dompet atau 0 untuk mematikan. Beranda menampilkan pengeluaran dan sisa batas hari ini. Form transaksi memperlihatkan perkiraan saldo dompet setelah transaksi, memperingatkan mulai 80% batas harian, dan meminta konfirmasi jika pengeluaran melewati batas atau membuat saldo dompet semakin minus. Transaksi yang sedang diedit tidak dihitung dua kali. Batas ikut tersimpan dalam backup JSON dan kembali ke 0 saat Reset semua data.

Buka tab **Keuangan** pada navigasi bawah. Pintasan Backup duplikat di Keuangan tidak ada lagi; Backup & Pemulihan JSON tetap berada di **Pengaturan**. Tombol duplikat **Buka fitur Keuangan** di **Pengaturan** dihapus. Tidak ada banner promosi pada Beranda. Ada menu transfer internal, rekonsiliasi saldo, target tabungan (alokasi virtual), transaksi rutin bulanan (diposting manual), utang/piutang pokok, estimasi kekayaan bersih, opsi budget rollover, peringatan budget, dan proyeksi sederhana berbasis jadwal. Fitur dompet, kategori, edit transaksi, kalender harian, grafik, dan backup dari v1.1.3 tetap ada.

Untuk memindahkan saldo, ketuk **Transfer** pada Akses cepat di Beranda atau **Transfer antar-dompet** pada daftar Dompet & rekening. Pilih dompet asal, dompet tujuan yang berbeda, nominal, dan tanggal, lalu Simpan. Saldo asal berkurang dan saldo tujuan bertambah; total uang dan pengeluaran tidak berubah.

**Data hanya tersimpan pada perangkat** melalui AsyncStorage; tidak ada WhatsApp, AI berbayar, cloud, database server, atau sinkronisasi. Untuk memindahkan antar-perangkat gunakan backup JSON manual dari Pengaturan. Backup native dibagikan sebagai teks JSON lewat Share Sheet; restore menerima paste JSON. Perangkat/app tujuan sharing bisa membatasi panjang teks, jadi uji sebelum mengandalkan satu-satunya backup. Di Pengaturan juga ada **Reset semua data** dengan konfirmasi; tindakan ini mengembalikan dompet dan kategori bawaan serta menghapus transaksi, target, dan salinan pembersihan lama.

## Tabungan, investasi, dan saldo siap pakai

Beranda menampilkan **saldo siap pakai**, yaitu jumlah saldo dompet setelah dikurangi dana yang dialokasikan ke tujuan tabungan. Di bawahnya, kartu **Tabungan & investasi** menampilkan dana tujuan ditambah simpanan dari transaksi tabungan. Tab **Tabungan** berisi jenis simpanan, pencairan, dan kemajuan tujuan; tab **Analisis** menampilkan pergerakan setoran/pencairan serta ringkasan tujuan.

Untuk dana yang tetap berada di rekening seperti Bank Jago, buat tujuan di tab Tabungan lalu pilih **Alokasi** dari rekening tersebut. Saldo tercatat rekening tetap memuat dananya, tetapi saldo siap pakai berkurang. **Lepas** alokasi saat dana ingin digunakan. Untuk dana yang dipindahkan ke simpanan atau investasi di luar saldo dompet, catat transaksi **Tabungan** dari rekening sumber dan pilih jenis seperti Dana darurat, Saham, atau Reksa dana. Transaksi ini mengurangi saldo sumber; tombol **Cairkan** mengembalikan dana tercatat ke dompet pilihan. Jenis tabungan baru dapat ditambahkan dari tab Tabungan. Catat perpindahan yang sama sekali saja, sebagai alokasi atau transaksi tabungan, agar ringkasan tidak menghitungnya dua kali.

Angka Saham/Reksa dana adalah total setoran dikurangi pencairan yang dicatat manual, **bukan nilai pasar**. Aplikasi tidak tersambung ke bank, broker, atau harga aset. Transaksi `saving` dari versi lama tetap mengurangi dompet sumber sesuai perilaku sebelumnya.

Kelemahan yang tersisa: AsyncStorage tidak terenkripsi, tidak tersedia PIN/biometrik, transaksi rutin tidak otomatis berjalan saat app ditutup, tidak ada notifikasi OS otomatis, bunga pinjaman dicatat manual, ekspor/impor CSV tersedia di web saja, dan tidak ada impor `.xlsb` asli. Jangan simpan rahasia perbankan di aplikasi sebelum keamanan tambahan dibuat. Pengujian build native dan perangkat fisik **belum dilakukan**.

Versi aplikasi **1.1.17** (build Android/iPhone **17**), copyright **© 2026 Na**.
