# Moneo v1.1.19 — Build Android + iPhone Native
© 2026 Na. Data tetap lokal di perangkat.

## Sudah dibuat apa?
- Satu proyek Expo/React Native untuk **Android APK** dan **iOS IPA/TestFlight**.
- File `eas.json` memiliki profil `android-apk`, `ios-iphone` (perangkat terdaftar), `ios-testflight` (distribusi melalui TestFlight) dan `ios-simulator`.
- Widget maskot asli Android dan iOS tetap berada di `widgets/`, tanpa preview besar di dalam aplikasi.
- Pilih karakter widget Bibble, Kelinci, atau Sehun di Pengaturan. Untuk menerapkan ukuran widget Android yang lebih rapat, hapus widget lama dari layar utama lalu tambahkan lagi setelah APK baru terpasang.
- Form transaksi mengutamakan dompet yang paling sering dipakai, memperlihatkan saldo dompet setelah transaksi, dan meminta pemeriksaan jika saldo menjadi minus. Batas pengeluaran harian dapat diatur di Pengaturan; Beranda dan form transaksi menampilkan peringatannya.
- Untuk memindahkan saldo antar-dompet, ketuk Transfer di Beranda atau buka Dompet & rekening lalu pilih Transfer antar-dompet.
- Semua kolom tanggal harian kini membuka kalender asli perangkat; tenggat tujuan tabungan tetap boleh kosong.
- Jadwalkan pembayaran mendatang dari Beranda atau Keuangan: isi nama, dompet, kategori, nominal, dan jatuh tempo. Beranda merangkum kebutuhan 30 hari dan menandai dompet yang dananya belum cukup. Ketuk Catat bayar ketika sudah dibayar. Jadwal tidak mengurangi saldo sebelum transaksi disimpan; pengingat jatuh tempo tampil di aplikasi.
- Beranda memisahkan saldo siap pakai dari Tabungan & investasi. Tab Tabungan menyediakan tujuan, alokasi dana yang tetap di dompet, transaksi simpanan/investasi di luar dompet, dan pencairan. Analisis menampilkan setoran, pencairan, dan kemajuan tujuan. Nilai investasi adalah catatan setoran dikurangi pencairan, bukan harga pasar.
- Bug teknis widget diperbaiki: fungsi pembantu dipindahkan ke dalam komponen `widget` agar dapat diakses oleh runtime widget yang terisolasi.
- Identitas aplikasi Moneo; logo, keuangan, saldo, anggaran, transaksi, tabungan, dan copyright tidak diubah.
- `android.package` dan `ios.bundleIdentifier` tetap `com.anabudget.app` **sengaja** untuk menjaga jalur upgrade dari aplikasi lama serta data lokal.

## Perhatikan: source ini belum file APK atau IPA
Build APK/IPA asli memerlukan proses kompilasi di EAS Build atau SDK lokal. Untuk membuat file bertanda tangan, Anda harus login ke akun Expo. Untuk iPhone fisik, akun Apple Developer berbayar dan proses signing/provisioning juga diperlukan. Tanpa itu build iOS bisa tersedia untuk simulator, tetapi bukan instalasi iPhone biasa.

## Cara termudah dari laptop Windows
1. Instal Node.js versi LTS dari https://nodejs.org/ dan buat akun di https://expo.dev/.
2. Ekstrak ZIP ini. Buka folder berisi `package.json` dan `eas.json`.
3. Jalankan `BUILD-ANDROID-APK.bat` untuk menghasilkan Android APK melalui EAS Build. Login Expo saat diminta dan ikuti instruksi pembuatan proyek/keystore. Link unduhan APK muncul setelah build di server selesai.
4. Untuk iPhone, daftarkan Apple Developer Program dan masuk ke akun Apple ketika EAS meminta. Jalankan `BUILD-IOS-TESTFLIGHT.bat`, kemudian `npx eas-cli@latest submit --platform ios --latest`. Install melalui aplikasi TestFlight setelah Apple memproses build.

## Opsi iPhone untuk perangkat terdaftar (bukan TestFlight)
Jalankan `npx eas-cli@latest build -p ios --profile ios-iphone`. Pendaftaran iPhone via `npx eas-cli@latest device:create` dan provisioning Apple Developer diperlukan. Hasilnya adalah build iOS ad hoc untuk perangkat yang didaftarkan, **bukan APK** dan tidak bebas dipasang ke sembarang iPhone.

## Terminal manual (jika file .bat tidak berjalan)
```bash
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile android-apk
npx eas-cli@latest build --platform ios --profile ios-testflight
npx eas-cli@latest submit --platform ios --latest
```
Jangan jalankan perintah build secara bersamaan pada setup awal sebelum konfigurasi proyek EAS lengkap.

## Github
Workflow GitHub Actions tersedia di `.github/workflows/moneo-native.yml`. Source aplikasi harus berada di root repository: `package.json`, `app.json`, dan folder `assets/` termasuk `assets/icon.png`. Unggah isi ZIP ke repository, jangan ZIP-nya sebagai satu file. Rilis ini memakai versi **1.1.19** dan nomor build **19**; artefak APK GitHub mencantumkan versinya. GitHub Pages hanya membuat web/PWA. Untuk widget asli, workflow ini menyiapkan build Android dan mengirim build iOS ke Expo; jangan upload backup keuangan pribadi ke GitHub.

Pembaruan di atas aplikasi yang sudah terpasang memerlukan **kunci penandatanganan yang sama** dengan build lama. Jika instalasi pembaruan ditolak, periksa apakah APK lama dan baru dibuat lewat jalur build yang sama. Buat backup JSON sebelum mengganti metode build atau memasang ulang aplikasi.

## Verifikasi
Jalankan `npm test` untuk menguji perhitungan dan struktur source aplikasi. Tes integrasi website memerlukan folder `site/` di samping folder aplikasi bernama `mobile/`, lalu dapat dijalankan dengan `npm run test:web`. Pengujian ini tidak menggantikan build native dan uji pada HP fisik.

## Data dan widget
Widget mendapat snapshot terakhir dari aplikasi setelah penyimpanan lokal berhasil. Pada Android gambar maskot sudah dibundel di APK sebagai drawable, sehingga dapat tampil saat widget baru ditambahkan. Pada iOS gambar disalin ke folder bersama saat aplikasi dibuka. Tidak ada server, AI berbayar, WhatsApp, atau sync. Tampilan iOS medium/large; Android meminta lebar awal 5×2 dan dapat diubah secara horizontal, sesuai ruang yang diizinkan launcher. Komponen utama: maskot, Saldo Total, status/progress bar, Pemasukan, Pengeluaran. Perubahan aset dan ukuran Android memerlukan prebuild dan build native baru; ukuran aktual dipengaruhi launcher.
