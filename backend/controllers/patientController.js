const pool = require('../db/pool');
const { success, created, error } = require('../utils/response');

const NIK_RE = /^\d{16}$/;

function validatePatient(body, { partial = false } = {}) {
  const errors = {};
  const { nik, name, gender, birth_date } = body;
  if (!partial || nik !== undefined) {
    if (!nik) errors.nik = 'NIK wajib diisi';
    else if (!NIK_RE.test(String(nik))) errors.nik = 'NIK harus 16 digit angka';
  }
  if (!partial || name !== undefined) {
    if (!name || !String(name).trim()) errors.name = 'Nama wajib diisi';
  }
  if (!partial || gender !== undefined) {
    if (!['L', 'P'].includes(gender)) errors.gender = 'Jenis kelamin harus L atau P';
  }
  if (!partial || birth_date !== undefined) {
    if (!birth_date) errors.birth_date = 'Tanggal lahir wajib diisi';
  }
  return errors;
}

async function nextMrn() {
  const [rows] = await pool.query('SELECT MAX(id) AS maxId FROM patients');
  const next = (rows[0].maxId || 0) + 1;
  return 'RM-' + String(next).padStart(6, '0');
}

async function list(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const gender = req.query.gender;

    const where = [];
    const params = {};
    if (search) {
      where.push('(name LIKE :s OR nik LIKE :s OR medical_record_no LIKE :s)');
      params.s = `%${search}%`;
    }
    if (gender && ['L', 'P'].includes(gender)) {
      where.push('gender = :gender');
      params.gender = gender;
    }
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [countRows] = await pool.query(`SELECT COUNT(*) AS total FROM patients ${whereSql}`, params);
    const total = countRows[0].total;

    const [rows] = await pool.query(
      `SELECT * FROM patients ${whereSql} ORDER BY id DESC LIMIT :limit OFFSET :offset`,
      { ...params, limit, offset }
    );

    return success(res, {
      items: rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
    });
  } catch (err) {
    next(err);
  }
}

async function detail(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = :id', { id: req.params.id });
    if (rows.length === 0) return error(res, 'Pasien tidak ditemukan', {}, 404);
    return success(res, { patient: rows[0] });
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const errors = validatePatient(req.body);
    if (Object.keys(errors).length) return error(res, 'Validation Error', errors, 422);

    const { nik, name, gender, birth_date, phone = null, address = null } = req.body;
    const [dup] = await pool.query('SELECT id FROM patients WHERE nik = :nik', { nik });
    if (dup.length) return error(res, 'Validation Error', { nik: 'NIK sudah terdaftar' }, 409);

    const medical_record_no = await nextMrn();
    const [result] = await pool.query(
      `INSERT INTO patients (medical_record_no, nik, name, gender, birth_date, phone, address)
       VALUES (:medical_record_no, :nik, :name, :gender, :birth_date, :phone, :address)`,
      { medical_record_no, nik, name, gender, birth_date, phone, address }
    );
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = :id', { id: result.insertId });
    return created(res, { patient: rows[0] }, 'Pasien berhasil ditambahkan');
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const [exist] = await pool.query('SELECT * FROM patients WHERE id = :id', { id: req.params.id });
    if (exist.length === 0) return error(res, 'Pasien tidak ditemukan', {}, 404);

    const errors = validatePatient(req.body, { partial: true });
    if (Object.keys(errors).length) return error(res, 'Validation Error', errors, 422);

    const { nik } = req.body;
    if (nik) {
      const [dup] = await pool.query('SELECT id FROM patients WHERE nik = :nik AND id <> :id', {
        nik, id: req.params.id,
      });
      if (dup.length) return error(res, 'Validation Error', { nik: 'NIK sudah terdaftar' }, 409);
    }

    const cur = exist[0];
    const merged = {
      nik: req.body.nik ?? cur.nik,
      name: req.body.name ?? cur.name,
      gender: req.body.gender ?? cur.gender,
      birth_date: req.body.birth_date ?? cur.birth_date,
      phone: req.body.phone ?? cur.phone,
      address: req.body.address ?? cur.address,
      id: req.params.id,
    };
    await pool.query(
      `UPDATE patients SET nik=:nik, name=:name, gender=:gender, birth_date=:birth_date,
       phone=:phone, address=:address WHERE id=:id`,
      merged
    );
    const [rows] = await pool.query('SELECT * FROM patients WHERE id = :id', { id: req.params.id });
    return success(res, { patient: rows[0] }, 'Pasien berhasil diperbarui');
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const [exist] = await pool.query('SELECT id FROM patients WHERE id = :id', { id: req.params.id });
    if (exist.length === 0) return error(res, 'Pasien tidak ditemukan', {}, 404);
    await pool.query('DELETE FROM patients WHERE id = :id', { id: req.params.id });
    return success(res, {}, 'Pasien berhasil dihapus');
  } catch (err) {
    next(err);
  }
}

module.exports = { list, detail, create, update, remove };
