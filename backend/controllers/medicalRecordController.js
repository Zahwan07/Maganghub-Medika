const pool = require('../db/pool');
const { success, created, error } = require('../utils/response');

async function create(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const {
      registration_id, subjective = null, blood_pressure = null, temperature = null,
      weight = null, height = null, pulse = null, diagnosis = null, therapy_plan = null,
      actions = [],
    } = req.body;

    if (!registration_id) {
      return error(res, 'Validation Error', { registration_id: 'registration_id wajib diisi' }, 422);
    }
    const [reg] = await conn.query('SELECT * FROM registrations WHERE id = :id', { id: registration_id });
    if (reg.length === 0) return error(res, 'Pendaftaran tidak ditemukan', {}, 404);

    const { patient_id, doctor_id } = reg[0];

    await conn.beginTransaction();
    const [mr] = await conn.query(
      `INSERT INTO medical_records
        (registration_id, patient_id, doctor_id, subjective, blood_pressure, temperature,
         weight, height, pulse, diagnosis, therapy_plan)
       VALUES (:registration_id, :patient_id, :doctor_id, :subjective, :blood_pressure, :temperature,
         :weight, :height, :pulse, :diagnosis, :therapy_plan)`,
      { registration_id, patient_id, doctor_id, subjective, blood_pressure, temperature,
        weight, height, pulse, diagnosis, therapy_plan }
    );
    const mrId = mr.insertId;

    if (Array.isArray(actions)) {
      for (const a of actions) {
        if (a && a.action_name) {
          await conn.query(
            'INSERT INTO medical_actions (medical_record_id, action_name, notes) VALUES (:mr, :n, :notes)',
            { mr: mrId, n: a.action_name, notes: a.notes || null }
          );
        }
      }
    }

    // pendaftaran & antrean selesai
    await conn.query(`UPDATE registrations SET status = 'selesai' WHERE id = :id`, { id: registration_id });
    await conn.query(`UPDATE queues SET status = 'selesai' WHERE registration_id = :id`, { id: registration_id });
    await conn.commit();

    const record = await fetchRecord(mrId);
    return created(res, { medical_record: record }, 'Hasil pemeriksaan tersimpan');
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function fetchRecord(id) {
  const [rows] = await pool.query(
    `SELECT mr.*, p.name AS patient_name, p.medical_record_no, u.name AS doctor_name
     FROM medical_records mr
     JOIN patients p ON p.id = mr.patient_id
     JOIN users u ON u.id = mr.doctor_id
     WHERE mr.id = :id`,
    { id }
  );
  if (rows.length === 0) return null;
  const record = rows[0];
  const [actions] = await pool.query('SELECT * FROM medical_actions WHERE medical_record_id = :id', { id });
  const [prescriptions] = await pool.query('SELECT * FROM prescriptions WHERE medical_record_id = :id', { id });
  for (const pr of prescriptions) {
    const [items] = await pool.query('SELECT * FROM prescription_items WHERE prescription_id = :id', { id: pr.id });
    pr.items = items;
  }
  record.actions = actions;
  record.prescriptions = prescriptions;
  return record;
}

// GET /medical-records/:patientId -> riwayat pemeriksaan pasien
async function historyByPatient(req, res, next) {
  try {
    const [patient] = await pool.query('SELECT * FROM patients WHERE id = :id', { id: req.params.patientId });
    if (patient.length === 0) return error(res, 'Pasien tidak ditemukan', {}, 404);

    const [records] = await pool.query(
      `SELECT mr.*, u.name AS doctor_name, pol.name AS poli_name
       FROM medical_records mr
       JOIN users u ON u.id = mr.doctor_id
       JOIN registrations r ON r.id = mr.registration_id
       JOIN polis pol ON pol.id = r.poli_id
       WHERE mr.patient_id = :pid ORDER BY mr.created_at DESC`,
      { pid: req.params.patientId }
    );
    for (const rec of records) {
      const [actions] = await pool.query('SELECT * FROM medical_actions WHERE medical_record_id = :id', { id: rec.id });
      const [prescriptions] = await pool.query('SELECT * FROM prescriptions WHERE medical_record_id = :id', { id: rec.id });
      for (const pr of prescriptions) {
        const [items] = await pool.query('SELECT * FROM prescription_items WHERE prescription_id = :id', { id: pr.id });
        pr.items = items;
      }
      rec.actions = actions;
      rec.prescriptions = prescriptions;
    }
    return success(res, { patient: patient[0], records });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, historyByPatient, fetchRecord };
