# Entity Relationship Diagram (ERD)

## Diagram (Mermaid)

```mermaid
erDiagram
    USERS ||--o{ REGISTRATIONS : "melayani (dokter)"
    USERS }o--|| POLIS : "bertugas di"
    POLIS ||--o{ REGISTRATIONS : "tujuan"
    POLIS ||--o{ QUEUES : "poli"
    PATIENTS ||--o{ REGISTRATIONS : "mendaftar"
    REGISTRATIONS ||--|| QUEUES : "memiliki"
    REGISTRATIONS ||--o{ MEDICAL_RECORDS : "menghasilkan"
    PATIENTS ||--o{ MEDICAL_RECORDS : "punya riwayat"
    USERS ||--o{ MEDICAL_RECORDS : "memeriksa (dokter)"
    MEDICAL_RECORDS ||--o{ MEDICAL_ACTIONS : "tindakan"
    MEDICAL_RECORDS ||--o{ PRESCRIPTIONS : "resep"
    PRESCRIPTIONS ||--o{ PRESCRIPTION_ITEMS : "item obat"
    PATIENTS ||--o{ PRESCRIPTIONS : "penerima"

    USERS {
        int id PK
        varchar name
        varchar username UK
        varchar password_hash
        enum role "admin|dokter|petugas"
        int poli_id FK
        tinyint is_active
        datetime created_at
    }

    POLIS {
        int id PK
        varchar name UK
        char code UK "prefix antrean"
    }

    PATIENTS {
        int id PK
        varchar medical_record_no UK "RM-000001"
        varchar nik UK "16 digit, unik"
        varchar name
        enum gender "L|P"
        date birth_date
        varchar phone
        text address
    }

    REGISTRATIONS {
        int id PK
        int patient_id FK
        int doctor_id FK
        int poli_id FK
        date visit_date
        enum payment_type "BPJS|Umum"
        text complaint
        enum status "menunggu|check_in|pemeriksaan|selesai"
    }

    QUEUES {
        int id PK
        int registration_id FK UK
        int poli_id FK
        varchar queue_number "A001"
        date queue_date
        enum status "menunggu|dipanggil|selesai|dilewati"
        datetime called_at
    }

    MEDICAL_RECORDS {
        int id PK
        int registration_id FK
        int patient_id FK
        int doctor_id FK
        text subjective "S: keluhan"
        varchar blood_pressure "O: tekanan darah"
        decimal temperature "O: suhu"
        decimal weight "O: berat badan"
        decimal height "O: tinggi badan"
        int pulse "O: nadi"
        text diagnosis "A: diagnosa"
        text therapy_plan "P: rencana terapi"
    }

    MEDICAL_ACTIONS {
        int id PK
        int medical_record_id FK
        varchar action_name
        varchar notes
    }

    PRESCRIPTIONS {
        int id PK
        int medical_record_id FK
        int patient_id FK
        varchar notes
    }

    PRESCRIPTION_ITEMS {
        int id PK
        int prescription_id FK
        varchar drug_name
        varchar dosage
        varchar instruction "aturan pakai"
        int quantity
    }
```

## Relasi

| Relasi | Kardinalitas | Keterangan |
|---|---|---|
| PATIENTS → REGISTRATIONS | 1 : N | Satu pasien bisa memiliki banyak kunjungan |
| USERS(dokter) → REGISTRATIONS | 1 : N | Satu dokter melayani banyak pendaftaran |
| POLIS → REGISTRATIONS | 1 : N | Satu poli untuk banyak pendaftaran |
| REGISTRATIONS → QUEUES | 1 : 1 | Setiap pendaftaran memiliki satu nomor antrean |
| REGISTRATIONS → MEDICAL_RECORDS | 1 : N | Pemeriksaan atas suatu kunjungan |
| MEDICAL_RECORDS → MEDICAL_ACTIONS | 1 : N | Tindakan medis pada satu pemeriksaan |
| MEDICAL_RECORDS → PRESCRIPTIONS | 1 : N | Resep pada satu pemeriksaan |
| PRESCRIPTIONS → PRESCRIPTION_ITEMS | 1 : N | Detail obat pada satu resep |

> Tip: Tempelkan blok Mermaid di atas ke https://mermaid.live untuk melihat/ekspor diagram sebagai gambar.
