const pool = require('../db/pool');
const { success, created, error } = require('../utils/response');

const QUEUE_SELECT = `
  SELECT q.*, r.status AS registration_status, r.payment_type, r.complaint,
         p.name AS patient_name, p.medical_record_no,
         u.name AS doctor_name, pol.name AS poli_name
  FROM queues q
  JOIN registrations r ON r.id = q.registration_id
  JOIN patients p ON p.id = r.patient_id
  JOIN users u ON u.id = r.doctor_id
  JOIN polis pol ON pol.id = q.poli_id
`;

async function list(req, res, next) {
  try {
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const where = ['q.queue_date = :date'];
    const params = { date };
    if (req.query.poli_id) { where.push('q.poli_id = :poli'); params.poli = req.query.poli_id; }
    if (req.query.status) { where.push('q.status = :status'); params.status = req.query.status; }
    const [rows] = await pool.query(
      `${QUEUE_SELECT} WHERE ${where.join(' AND ')} ORDER BY q.queue_number ASC`,
      params
    );
    return success(res, { items: rows });
  } catch (err) {
    next(err);
  }
}

// POST /queues -> generate nomor antrean untuk registration yang belum punya antrean
async function create(req, res, next) {
  try {
    const { registration_id } = req.body;
    if (!registration_id) return error(res, 'Validation Error', { registration_id: 'registration_id wajib diisi' }, 422);

    const [reg] = await pool.query('SELECT * FROM registrations WHERE id = :id', { id: registration_id });
    if (reg.length === 0) return error(res, 'Pendaftaran tidak ditemukan', {}, 404);

    const [existing] = await pool.query('SELECT id FROM queues WHERE registration_id = :id', { id: registration_id });
    if (existing.length) return error(res, 'Antrean sudah ada untuk pendaftaran ini', {}, 409);

    const { poli_id, visit_date } = reg[0];
    const [poliRow] = await pool.query('SELECT code FROM polis WHERE id = :id', { id: poli_id });
    const code = poliRow[0].code;
    const [cnt] = await pool.query(
      'SELECT COUNT(*) AS c FROM queues WHERE poli_id = :poli AND queue_date = :d',
      { poli: poli_id, d: visit_date }
    );
    const queue_number = code + String(cnt[0].c + 1).padStart(3, '0');
    const [q] = await pool.query(
      `INSERT INTO queues (registration_id, poli_id, queue_number, queue_date, status)
       VALUES (:reg, :poli, :qn, :d, 'menunggu')`,
      { reg: registration_id, poli: poli_id, qn: queue_number, d: visit_date }
    );
    const [rows] = await pool.query(`${QUEUE_SELECT} WHERE q.id = :id`, { id: q.insertId });
    return created(res, { queue: rows[0] }, 'Nomor antrean ' + queue_number + ' dibuat');
  } catch (err) {
    next(err);
  }
}

// PUT /queues/:id/call -> panggil antrean (set dipanggil + registration check_in)
async function call(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const [rows] = await conn.query('SELECT * FROM queues WHERE id = :id', { id: req.params.id });
    if (rows.length === 0) return error(res, 'Antrean tidak ditemukan', {}, 404);

    await conn.beginTransaction();
    await conn.query(
      `UPDATE queues SET status = 'dipanggil', called_at = NOW() WHERE id = :id`,
      { id: req.params.id }
    );
    await conn.query(
      `UPDATE registrations SET status = 'pemeriksaan' WHERE id = :reg AND status IN ('menunggu','check_in')`,
      { reg: rows[0].registration_id }
    );
    await conn.commit();
    const [updated] = await pool.query(`${QUEUE_SELECT} WHERE q.id = :id`, { id: req.params.id });
    return success(res, { queue: updated[0] }, 'Antrean dipanggil');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

// PUT /queues/:id/status -> ubah status antrean
async function updateStatus(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { status } = req.body;
    if (!['menunggu', 'dipanggil', 'selesai', 'dilewati'].includes(status)) {
      return error(res, 'Validation Error', { status: 'Status tidak valid' }, 422);
    }
    const [rows] = await conn.query('SELECT * FROM queues WHERE id = :id', { id: req.params.id });
    if (rows.length === 0) return error(res, 'Antrean tidak ditemukan', {}, 404);

    await conn.beginTransaction();
    await conn.query('UPDATE queues SET status = :status WHERE id = :id', { status, id: req.params.id });
    if (status === 'selesai') {
      await conn.query(`UPDATE registrations SET status = 'selesai' WHERE id = :reg`, { reg: rows[0].registration_id });
    }
    await conn.commit();
    const [updated] = await pool.query(`${QUEUE_SELECT} WHERE q.id = :id`, { id: req.params.id });
    return success(res, { queue: updated[0] }, 'Status antrean diperbarui');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { list, create, call, updateStatus };
