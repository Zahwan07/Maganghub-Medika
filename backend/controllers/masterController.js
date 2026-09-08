const pool = require('../db/pool');
const { success } = require('../utils/response');

// GET /doctors -> daftar dokter
async function doctors(req, res, next) {
  try {
    const [rows] = await pool.query(
      `SELECT u.id, u.name, u.poli_id, pol.name AS poli_name
       FROM users u LEFT JOIN polis pol ON pol.id = u.poli_id
       WHERE u.role = 'dokter' AND u.is_active = 1 ORDER BY u.name`
    );
    return success(res, { items: rows });
  } catch (err) {
    next(err);
  }
}

// GET /polis -> daftar poli
async function polis(req, res, next) {
  try {
    const [rows] = await pool.query('SELECT * FROM polis ORDER BY name');
    return success(res, { items: rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { doctors, polis };
