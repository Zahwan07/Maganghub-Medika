# Maganghub, Teknikal Assignment Klinik pratama

Aplikasi berbasis web untuk membantu proses administrasi dan pelayanan pasien pada klinik pratama secara terintegrasi — mulai dari pengelolaan data pasien, pendaftaran kunjungan, antrean, hingga pencatatan hasil pemeriksaan dokter (metode SOAP).

## Link Video Demonstrasi

https://youtu.be/0YDrijoHL7I


## Fitur Utama

- **Authentication (JWT)** 3 role: `Administrator`, `Dokter`, `Petugas Pendaftaran` + otorisasi berbasis role.
- **Master Data Pasien** — CRUD, pencarian, pagination, detail, No. Rekam Medis auto-generate, validasi NIK.
- **Pendaftaran Kunjungan** — pilih pasien/dokter/poli, jenis pembayaran (BPJS/Umum), keluhan awal, status kunjungan.
- **Antrean** — nomor antrean otomatis (mis. `A001`), panggil antrean berikutnya, ubah status.
- **Pemeriksaan Dokter (SOAP)** — Subjective, Objective (vital), Assessment, Plan + Tindakan Medis + Resep Obat + Riwayat.
- **Dashboard** — Total Pasien, Pasien Hari Ini, Antrean Hari Ini, Pasien Menunggu, Selesai Dilayani.

## Teknologi dipakai

| Komponen | Teknologi |
|---|---|
| Frontend | (React.js CRA + TailwindCSS + shadcn/ui) |
| Backend | (Node.js (Express.js)) |
| Database | (MySQL / MariaDB) |
| Auth | (JSON Web Token (JWT) + bcryptjs) |

## Struktur Project

```
/app
├── backend/                     # Node.js + Express (raw SQL)
│   ├── controllers/             # endpoint (auth, patient, registration, queue, ...)
│   ├── db/
│   │   ├── pool.js              # Koneksi MySQL
│   │   ├── schema.sql           # DDL + data awal poli  <-- FILE DATABASE (.sql)
│   │   ├── migrate.js           # Buat database & jalankan schema.sql
│   │   └── seed.js              # Seed akun + pasien contoh
│   ├── middleware/              # auth (JWT + role), errorHandler
│   ├── routes/index.js          # REST API (prefix /api)
│   ├── utils/response.js        # Format response
│   ├── server.js                # Entry point Express (port 8001)
│   ├── .env.example
│   └── package.json
├── frontend/                    # React.js
│   └── src/
│       ├── pages/               # Login, Dashboard, Patients, Registrations, Queues, Examination
│       ├── components/          # AppLayout, StatusBadge, ProtectedRoute, ui/ (shadcn)
│       ├── context/AuthContext.jsx
│       └── lib/                 # api.js (axios), format.js
└── docs/
    ├── ERD.md                   # Entity Relationship Diagram
    └── postman_collection.json  # Postman Collection
```

## Konfigurasi file-file`.env`

Salin `backend/.env.example` menjadi `backend/.env` lalu sesuaikan:

```env
PORT=8001
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=mini_clinic
JWT_SECRET=change_this_to_a_long_random_secret
JWT_EXPIRES_IN=1d
ADMIN_NAME=Administrator
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
CORS_ORIGINS=*
```

> Konfigurasi database, JWT Secret, dan data sensitif lainnya ada di source code di `.env`.

Frontend membaca base URL backend dari `frontend/.env`:
```env
REACT_APP_BACKEND_URL=http://localhost:8001
```
> Semua endpoint dipanggil `/api`, jadi base URL APInya = `REACT_APP_BACKEND_URL + /api`.

## Instalasi & Jalankan

### 1. Requirement
- Node.js 18+
- MySQL 8 / MariaDB 10+

### 2. Backend
```bash
cd backend
cp .env.example .env          # edit sesuai konfigurasi DB
npm install

# Migrasi database (buat DB + tabel) & isi data awal
npm run migrate               # membuat database & seluruh tabel dari db/schema.sql
npm run seed                  # akun default + pasien contoh
# atau sekaligus:
npm run db:setup

npm start                     # backend jalan di http://localhost:8001
```

### 3. Frontend
```bash
cd frontend
# Pastikan REACT_APP_BACKEND_URL di frontend/.env mengarah ke backend
yarn install
yarn start                    # frontend jalan di http://localhost:3000
```

### Cara Migrasi Database
- **Otomatis:** `npm run migrate` — script `db/migrate.js` akan membuat database `mini_clinic` bila belum ada, lalu mengeksekusi `db/schema.sql`.
- **Manual:** `mysql -u <user> -p` lalu `CREATE DATABASE mini_clinic;` terus `mysql -u <user> -p mini_clinic < db/schema.sql`.
- Data awal (akun & pasien contoh): `npm run seed`.

## Akun Login (hasil seed)

| Role | Username | Password |
|---|---|---|
| Administrator | `admin` | `admin123` |
| Dokter (Poli Umum) | `dokter` | `dokter123` |
| Dokter (Poli Gigi) | `dokter2` | `dokter123` |
| Petugas Pendaftaran | `petugas` | `petugas123` |

## REST API

Base URL: `{{BACKEND_URL}}/api`

| Method | Endpoint | Role | Keterangan |
|---|---|---|---|
| POST | `/login` | public | Login, mengembalikan JWT |
| POST | `/logout` | auth | Logout (stateless) |
| GET | `/me` | auth | Profil user aktif |
| GET | `/patients` | auth | List pasien (search, gender, page, limit) |
| GET | `/patients/:id` | auth | Detail pasien |
| POST | `/patients` | admin, petugas | Tambah pasien |
| PUT | `/patients/:id` | admin, petugas | Ubah pasien |
| DELETE | `/patients/:id` | admin | Hapus pasien |
| GET | `/registrations` | auth | List pendaftaran (date, status, poli, doctor) |
| POST | `/registrations` | admin, petugas | Daftar kunjungan (auto buat antrean) |
| PUT | `/registrations/:id` | admin, petugas, dokter | Ubah pendaftaran/status |
| GET | `/queues` | auth | List antrean (date, poli, status) |
| POST | `/queues` | admin, petugas | Generate antrean manual |
| PUT | `/queues/:id/call` | admin, petugas, dokter | Panggil antrean |
| PUT | `/queues/:id/status` | admin, petugas, dokter | Ubah status antrean |
| POST | `/medical-records` | admin, dokter | Simpan pemeriksaan SOAP + tindakan |
| GET | `/medical-records/:patientId` | auth | Riwayat pemeriksaan pasien |
| POST | `/prescriptions` | admin, dokter | Buat resep obat |
| GET | `/prescriptions/:id` | auth | Detail resep |
| GET | `/doctors`, `/polis` | auth | Master dropdown |
| GET | `/dashboard/stats` | auth | Statistik dashboard |

### Format Response
```json
// success
{ "success": true, "message": "Success", "data": {} }
// error
{ "success": false, "message": "Validation Error", "errors": {} }
```

## Deliverables
- Source code Frontend (`frontend/`) & Backend (`backend/`)
- File Database `.sql`: `backend/db/schema.sql`
- ERD: `docs/ERD.md`
- Postman Collection: `docs/postman_collection.json`
- `.env.example`: `backend/.env.example`

## Asumsi & Penyederhanaan
- **Dokter** user dengan role `dokter` (tabel ga terpisah).
- **Poli** disimpan pada tabel `polis`; kode poli (A/B/C) jadi prefix nomor antrean dan di-reset per tanggal.
- **Logout** stateless, tidak ada blacklist token.
- Nomor Rekam Medis dibuat berurutan dengan format `RM-000001`.
- Status kunjungan otomatis menjadi `selesai` setelah pemeriksaan disimpan.
