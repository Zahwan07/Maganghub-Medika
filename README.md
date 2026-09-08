# Maganghub-Medika



Aplikasi berbasis web untuk membantu proses administrasi dan pelayanan pasien pada klinik pratama secara terintegrasi — mulai dari pengelolaan data pasien, pendaftaran kunjungan, antrean, hingga pencatatan hasil pemeriksaan dokter (metode SOAP).

## Fitur Utama

- **Authentication (JWT)** 3 role: `Administrator`, `Dokter`, `Petugas Pendaftaran` + otorisasi berbasis role.
- **Master Data Pasien** — CRUD, pencarian, pagination, detail, No. Rekam Medis auto-generate, validasi NIK.
- **Pendaftaran Kunjungan** — pilih pasien/dokter/poli, jenis pembayaran (BPJS/Umum), keluhan awal, status kunjungan.
- **Antrean** — nomor antrean otomatis (mis. `A001`), panggil antrean berikutnya, ubah status.
- **Pemeriksaan Dokter (SOAP)** — Subjective, Objective (vital), Assessment, Plan + Tindakan Medis + Resep Obat + Riwayat.
- **Dashboard** — Total Pasien, Pasien Hari Ini, Antrean Hari Ini, Pasien Menunggu, Selesai Dilayani.