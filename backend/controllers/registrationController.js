const pool = require('../db/pool');
const { success, created, error } = require('../utils/response');

const REG_SELECT = `
  SELECT r.*, p.name AS patient_name, p.medical_record_no, p.nik,
         u.name AS doctor_name, pol.name AS poli_name, pol.code AS poli_code,
         q.queue_number, q.status AS queue_status
  FROM registrations r
  JOIN patients p ON p.id = r.patient_id
  JOIN users u ON u.id = r.doctor_id
  JOIN polis pol ON pol.id = r.poli_id
  LEFT JOIN queues q ON q.registration_id = r.id
`;

async function generateQueueNumber(poli_id, visit_date) {
  const [poliRow] = await pool.query('SELECT code FROM polis WHERE id = :id', { id: poli_id });
  if (poliRow.length === 0) return null;
  const code = poliRow[0].code;
  const [cnt] = await pool.query(
    'SELECT COUNT(*) AS c FROM queues WHERE poli_id = :poli AND queue_date = :d',
    { poli: poli_id, d: visit_date }
  );
  const seq = cnt[0].c + 1;
  return code + String(seq).padStart(3, '0');
}

async function list(req, res, next) {
  try {
    const where = [];
    const params = {};
    if (req.query.date) { where.push('r.visit_date = :date'); params.date = req.query.date; }
    if (req.query.status) { where.push('r.status = :status'); params.status = req.query.status; }
    if (req.query.poli_id) { where.push('r.poli_id = :poli'); params.poli = req.query.poli_id; }
    if (req.query.doctor_id) { where.push('r.doctor_id = :doc'); params.doc = req.query.doctor_id; }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await pool.query(`${REG_SELECT} ${whereSql} ORDER BY r.id DESC`, params);
    return success(res, { items: rows });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const [rows] = await pool.query(`${REG_SELECT} WHERE r.id = :id`, { id: req.params.id });
    if (rows.length === 0) return error(res, 'Pendaftaran tidak ditemukan', {}, 404);
    return success(res, { registration: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { patient_id, doctor_id, poli_id, payment_type = 'Umum', complaint = null } = req.body;
    const visit_date = req.body.visit_date || new Date().toISOString().slice(0, 10);

    const errors = {};
    if (!patient_id) errors.patient_id = 'Pasien wajib dipilih';
    if (!doctor_id) errors.doctor_id = 'Dokter wajib dipilih';
    if (!poli_id) errors.poli_id = 'Poli wajib dipilih';
    if (!['BPJS', 'Umum'].includes(payment_type)) errors.payment_type = 'Jenis pembayaran tidak valid';
    if (Object.keys(errors).length) return error(res, 'Validation Error', errors, 422);

    await conn.beginTransaction();
    const [reg] = await conn.query(
      `INSERT INTO registrations (patient_id, doctor_id, poli_id, visit_date, payment_type, complaint, status)
       VALUES (:patient_id, :doctor_id, :poli_id, :visit_date, :payment_type, :complaint, 'menunggu')`,
      { patient_id, doctor_id, poli_id, visit_date, payment_type, complaint }
    );

    // generate nomor antrean (dalam transaksi yang sama)
    const [poliRow] = await conn.query('SELECT code FROM polis WHERE id = :id', { id: poli_id });
    const code = poliRow[0].code;
    const [cnt] = await conn.query(
      'SELECT COUNT(*) AS c FROM queues WHERE poli_id = :poli AND queue_date = :d',
      { poli: poli_id, d: visit_date }
    );
    const queue_number = code + String(cnt[0].c + 1).padStart(3, '0');
    await conn.query(
      `INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status)
       VALUES (:reg, :poli, :qn, :d, 'menunggu')`,
      { reg: reg.insertId, poli: poli_id, qn: queue_number, d: visit_date }
    );
    await conn.commit();

    const [rows] = await pool.query(`${REG_SELECT} WHERE r.id = :id`, { id: reg.insertId });
    return created(res, { registration: rows[0] }, 'Pendaftaran berhasil, nomor antrean ' + queue_number);
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function update(req, res, next) {
  try {
    const [exist] = await pool.query('SELECT * FROM registrations WHERE id = :id', { id: req.params.id });
    if (exist.length === 0) return error(res, 'Pendaftaran tidak ditemukan', {}, 404);

    const cur = exist[0];
    const status = req.body.status ?? cur.status;
    if (!['menunggu', 'check_in', 'pemeriksaan', 'selesai'].includes(status)) {
      return error(res, 'Validation Error', { status: 'Status tidak valid' }, 422);
    }
    const merged = {
      doctor_id: req.body.doctor_id ?? cur.doctor_id,
      poli_id: req.body.poli_id ?? cur.poli_id,
      payment_type: req.body.payment_type ?? cur.payment_type,
      complaint: req.body.complaint ?? cur.complaint,
      status,
      id: req.params.id,
    };
    await pool.query(
      `UPDATE registrations SET doctor_id=:doctor_id, poli_id=:poli_id, payment_type=:payment_type,
       complaint=:complaint, status=:status WHERE id=:id`,
      merged
    );
    const [rows] = await pool.query(`${REG_SELECT} WHERE r.id = :id`, { id: req.params.id });
    return success(res, { registration: rows[0] }, 'Pendaftaran berhasil diperbarui');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create, update };
