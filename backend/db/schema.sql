-- =====================================================================
--  Mini Clinic Information System - Database Schema (MySQL / MariaDB)
-- =====================================================================
--  Jalankan: mysql -u <user> -p mini_clinic < db/schema.sql
--  atau gunakan: npm run migrate
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS prescription_items;
DROP TABLE IF EXISTS prescriptions;
DROP TABLE IF EXISTS medical_actions;
DROP TABLE IF EXISTS medical_records;
DROP TABLE IF EXISTS queues;
DROP TABLE IF EXISTS registrations;
DROP TABLE IF EXISTS patients;
DROP TABLE IF EXISTS polis;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------
-- Users (Administrator, Dokter, Petugas Pendaftaran)
-- ----------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(120) NOT NULL,
  username      VARCHAR(60)  NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('admin','dokter','petugas') NOT NULL,
  poli_id       INT UNSIGNED NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Poli / Poliklinik (menentukan prefix nomor antrean)
-- ----------------------------------------------------------------------
CREATE TABLE polis (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name          VARCHAR(80) NOT NULL,
  code          CHAR(1)     NOT NULL,          -- prefix antrean, cth: A, B, C
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_polis_code (code),
  UNIQUE KEY uq_polis_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

ALTER TABLE users
  ADD CONSTRAINT fk_users_poli FOREIGN KEY (poli_id) REFERENCES polis(id) ON DELETE SET NULL;

-- ----------------------------------------------------------------------
-- Pasien (Master Data)
-- ----------------------------------------------------------------------
CREATE TABLE patients (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  medical_record_no  VARCHAR(20) NOT NULL,      -- auto generate cth: RM-000001
  nik                VARCHAR(20) NOT NULL,       -- tidak boleh duplikat
  name               VARCHAR(120) NOT NULL,
  gender             ENUM('L','P') NOT NULL,     -- L = Laki-laki, P = Perempuan
  birth_date         DATE NOT NULL,
  phone              VARCHAR(20) NULL,
  address            TEXT NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_patients_mrn (medical_record_no),
  UNIQUE KEY uq_patients_nik (nik),
  KEY idx_patients_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Pendaftaran Kunjungan
-- ----------------------------------------------------------------------
CREATE TABLE registrations (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  patient_id    INT UNSIGNED NOT NULL,
  doctor_id     INT UNSIGNED NOT NULL,
  poli_id       INT UNSIGNED NOT NULL,
  visit_date    DATE NOT NULL,
  payment_type  ENUM('BPJS','Umum') NOT NULL DEFAULT 'Umum',
  complaint     TEXT NULL,                       -- keluhan awal
  status        ENUM('menunggu','check_in','pemeriksaan','selesai') NOT NULL DEFAULT 'menunggu',
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_reg_visit_date (visit_date),
  CONSTRAINT fk_reg_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_reg_doctor  FOREIGN KEY (doctor_id)  REFERENCES users(id),
  CONSTRAINT fk_reg_poli    FOREIGN KEY (poli_id)    REFERENCES polis(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Antrean
-- ----------------------------------------------------------------------
CREATE TABLE queues (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  registration_id INT UNSIGNED NOT NULL,
  poli_id         INT UNSIGNED NOT NULL,
  queue_number    VARCHAR(10) NOT NULL,          -- cth: A001
  queue_date      DATE NOT NULL,
  status          ENUM('menunggu','dipanggil','selesai','dilewati') NOT NULL DEFAULT 'menunggu',
  called_at       DATETIME NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_queue_reg (registration_id),
  KEY idx_queue_date (queue_date),
  CONSTRAINT fk_queue_reg  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_queue_poli FOREIGN KEY (poli_id) REFERENCES polis(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Rekam Medis / Pemeriksaan (SOAP)
-- ----------------------------------------------------------------------
CREATE TABLE medical_records (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  registration_id INT UNSIGNED NOT NULL,
  patient_id      INT UNSIGNED NOT NULL,
  doctor_id       INT UNSIGNED NOT NULL,
  -- Subjective
  subjective      TEXT NULL,                     -- keluhan pasien
  -- Objective (tanda vital)
  blood_pressure  VARCHAR(20) NULL,              -- tekanan darah, cth 120/80
  temperature     DECIMAL(4,1) NULL,             -- suhu tubuh (C)
  weight          DECIMAL(5,2) NULL,             -- berat badan (kg)
  height          DECIMAL(5,2) NULL,             -- tinggi badan (cm)
  pulse           INT NULL,                      -- nadi (bpm)
  -- Assessment
  diagnosis       TEXT NULL,
  -- Plan
  therapy_plan    TEXT NULL,
  created_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_mr_patient (patient_id),
  CONSTRAINT fk_mr_reg     FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
  CONSTRAINT fk_mr_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  CONSTRAINT fk_mr_doctor  FOREIGN KEY (doctor_id)  REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Tindakan Medis (relasi ke rekam medis)
-- ----------------------------------------------------------------------
CREATE TABLE medical_actions (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  medical_record_id INT UNSIGNED NOT NULL,
  action_name       VARCHAR(150) NOT NULL,
  notes             VARCHAR(255) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_ma_mr FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Resep Obat
-- ----------------------------------------------------------------------
CREATE TABLE prescriptions (
  id                INT UNSIGNED NOT NULL AUTO_INCREMENT,
  medical_record_id INT UNSIGNED NOT NULL,
  patient_id        INT UNSIGNED NOT NULL,
  notes             VARCHAR(255) NULL,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_presc_mr      FOREIGN KEY (medical_record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
  CONSTRAINT fk_presc_patient FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prescription_items (
  id              INT UNSIGNED NOT NULL AUTO_INCREMENT,
  prescription_id INT UNSIGNED NOT NULL,
  drug_name       VARCHAR(150) NOT NULL,
  dosage          VARCHAR(80) NULL,              -- cth: 500mg
  instruction     VARCHAR(150) NULL,             -- aturan pakai, cth: 3x1 sesudah makan
  quantity        INT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_pi_presc FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------
-- Seed data awal untuk Poli
-- ----------------------------------------------------------------------
INSERT INTO polis (name, code) VALUES
  ('Poli Umum', 'A'),
  ('Poli Gigi', 'B'),
  ('Poli KIA',  'C');
