const pool = require('../db/pool');
const { success, created, error } = require('../utils/response');

// POST /prescriptions -> buat resep untuk sebuah medical_record
async function create(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { medical_record_id, notes = null, items = [] } = req.body;
    const errors = {};
    if (!medical_record_id) errors.medical_record_id = 'medical_record_id wajib diisi';
    if (!Array.isArray(items) || items.length === 0) errors.items = 'Minimal 1 item obat';
    if (Object.keys(errors).length) return error(res, 'Validation Error', errors, 422);

    const [mr] = await conn.query('SELECT patient_id FROM medical_records WHERE id = :id', { id: medical_record_id });
    if (mr.length === 0) return error(res, 'Rekam medis tidak ditemukan', {}, 404);

    await conn.beginTransaction();
    const [pr] = await conn.query(
      `INSERT INTO prescriptions (medical_record_id, patient_id, notes)
       VALUES (:mr, :pid, :notes)`,
      { mr: medical_record_id, pid: mr[0].patient_id, notes }
    );
    for (const it of items) {
      if (!it.drug_name) continue;
      await conn.query(
        `INSERT INTO prescription_items (prescription_id, drug_name, dosage, instruction, quantity)
         VALUES (:pid, :drug, :dosage, :instr, :qty)`,
        { pid: pr.insertId, drug: it.drug_name, dosage: it.dosage || null, instr: it.instruction || null, qty: it.quantity || null }
      );
    }
    await conn.commit();
    const prescription = await fetchPrescription(pr.insertId);
    return created(res, { prescription }, 'Resep obat tersimpan');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function fetchPrescription(id) {
  const [rows] = await pool.query(
    `SELECT pr.*, p.name AS patient_name, p.medical_record_no
     FROM prescriptions pr JOIN patients p ON p.id = pr.patient_id WHERE pr.id = :id`,
    { id }
  );
  if (rows.length === 0) return null;
  const [items] = await pool.query('SELECT * FROM prescription_items WHERE prescription_id = :id', { id });
  rows[0].items = items;
  return rows[0];
}

// GET /prescriptions/:id
async function detail(req, res, next) {
  try {
    const prescription = await fetchPrescription(req.params.id);
    if (!prescription) return error(res, 'Resep tidak ditemukan', {}, 404);
    return success(res, { prescription });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, detail };
