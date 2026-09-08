/**
 * Seed: akun default (Admin, Dokter, Petugas) + data pasien contoh + kunjungan.
 * Aman dijalankan berulang (idempotent untuk users berdasarkan username).
 * Usage: npm run seed
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./pool');

async function upsertUser({ name, username, password, role, poli_id = null }) {
  const [rows] = await pool.query('SELECT id FROM users WHERE username = :username', { username });
  const hash = await bcrypt.hash(password, 10);
  if (rows.length === 0) {
    const [res] = await pool.query(
      `INSERT INTO users (name, username, password_hash, role, poli_id)
       VALUES (:name, :username, :hash, :role, :poli_id)`,
      { name, username, hash, role, poli_id }
    );
    console.log(`  + user "${username}" (${role}) dibuat`);
    return res.insertId;
  } else {
    await pool.query(
      `UPDATE users SET name=:name, password_hash=:hash, role=:role, poli_id=:poli_id WHERE username=:username`,
      { name, username, hash, role, poli_id }
    );
    console.log(`  ~ user "${username}" (${role}) diperbarui`);
    return rows[0].id;
  }
}

function mrn(n) {
  return 'RM-' + String(n).padStart(6, '0');
}

async function seed() {
  console.log('» Seeding users...');
  const [polis] = await pool.query('SELECT id, name FROM polis ORDER BY id');
  const poliUmum = polis.find((p) => p.name === 'Poli Umum');
  const poliGigi = polis.find((p) => p.name === 'Poli Gigi');

  await upsertUser({
    name: process.env.ADMIN_NAME || 'Administrator',
    username: process.env.ADMIN_USERNAME || 'admin',
    password: process.env.ADMIN_PASSWORD || 'admin123',
    role: 'admin',
  });
  const drBudi = await upsertUser({
    name: 'dr. Rica Octaviyani', username: 'dokter', password: 'dokter123', role: 'dokter', poli_id: poliUmum?.id || null,
  });
  const drSari = await upsertUser({
    name: 'drg. Sari Dewi', username: 'dokter2', password: 'dokter123', role: 'dokter', poli_id: poliGigi?.id || null,
  });
  await upsertUser({
    name: 'Petugas Pendaftaran', username: 'petugas', password: 'petugas123', role: 'petugas',
  });

  // Data pasien contoh
  console.log('» Seeding pasien contoh...');
  const [pcount] = await pool.query('SELECT COUNT(*) AS c FROM patients');
  if (pcount[0].c === 0) {
    const samples = [
      ['3201010101900001', 'Ahmad Fauzi',      'L', '1990-01-01', '081234567001', 'Jl. Merdeka No. 10, Jakarta'],
      ['3201010202850002', 'Siti Rahayu',       'P', '1985-02-02', '081234567002', 'Jl. Sudirman No. 22, Bandung'],
      ['3201010303920003', 'Rudi Hartono',      'L', '1992-03-03', '081234567003', 'Jl. Diponegoro No. 5, Surabaya'],
      ['3201010404880004', 'Dewi Lestari',      'P', '1988-04-04', '081234567004', 'Jl. Gatot Subroto No. 8, Medan'],
      ['3201010505950005', 'Bagus Prasetyo',    'L', '1995-05-05', '081234567005', 'Jl. Ahmad Yani No. 12, Semarang'],
      ['3201010606910006', 'Rina Wulandari',    'P', '1991-06-06', '081234567006', 'Jl. Pahlawan No. 3, Yogyakarta'],
      ['3201010707870007', 'Joko Susilo',       'L', '1987-07-07', '081234567007', 'Jl. Veteran No. 17, Malang'],
      ['3201010808930008', 'Maya Anggraini',    'P', '1993-08-08', '081234567008', 'Jl. Imam Bonjol No. 9, Solo'],
    ];
    let i = 1;
    for (const [nik, name, gender, birth, phone, addr] of samples) {
      await pool.query(
        `INSERT INTO patients (medical_record_no, nik, name, gender, birth_date, phone, address)
         VALUES (:mrn, :nik, :name, :gender, :birth, :phone, :addr)`,
        { mrn: mrn(i), nik, name, gender, birth, phone, addr }
      );
      i++;
    }
    console.log(`  + ${samples.length} pasien contoh dibuat`);

    // Contoh pendaftaran + antrean hari ini untuk 3 pasien pertama
    console.log('» Seeding pendaftaran & antrean hari ini...');
    const today = new Date().toISOString().slice(0, 10);
    const regs = [
      { patient_id: 1, doctor_id: drBudi, poli_id: poliUmum.id, payment: 'BPJS', complaint: 'Demam dan batuk 3 hari', status: 'menunggu' },
      { patient_id: 2, doctor_id: drBudi, poli_id: poliUmum.id, payment: 'Umum', complaint: 'Sakit kepala', status: 'menunggu' },
      { patient_id: 4, doctor_id: drSari, poli_id: poliGigi.id, payment: 'Umum', complaint: 'Gigi berlubang nyeri', status: 'menunggu' },
    ];
    const counters = {};
    for (const r of regs) {
      const [rr] = await pool.query(
        `INSERT INTO registrations (patient_id, doctor_id, poli_id, visit_date, payment_type, complaint, status)
         VALUES (:patient_id, :doctor_id, :poli_id, :visit_date, :payment, :complaint, :status)`,
        { ...r, visit_date: today }
      );
      const [poliRow] = await pool.query('SELECT code FROM polis WHERE id = :id', { id: r.poli_id });
      const code = poliRow[0].code;
      counters[code] = (counters[code] || 0) + 1;
      const qn = code + String(counters[code]).padStart(3, '0');
      await pool.query(
        `INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status)
         VALUES (:reg, :poli, :qn, :d, 'menunggu')`,
        { reg: rr.insertId, poli: r.poli_id, qn, d: today }
      );
    }
    console.log(`  + ${regs.length} pendaftaran + antrean dibuat`);
  } else {
    console.log('  ~ pasien sudah ada, lewati seed pasien');
  }

  console.log('✔ Seed selesai.');
  await pool.end();
}

seed().catch((err) => {
  console.error('✼ Seed gagal:', err.message);
  process.exit(1);
});
