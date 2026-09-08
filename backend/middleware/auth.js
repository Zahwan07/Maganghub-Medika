const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { error } = require('../utils/response');

/** Verifikasi JWT*/
async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) {
    return error(res, 'Unauthorized', { token: 'Token tidak ditemukan' }, 401);
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const [rows] = await pool.query(
      'SELECT id, name, username, role, poli_id, is_active FROM users WHERE id = :id',
      { id: payload.sub }
    );
    if (rows.length === 0 || !rows[0].is_active) {
      return error(res, 'Unauthorized', { user: 'User tidak ditemukan / non-aktif' }, 401);
    }
    req.user = rows[0];
    next();
  } catch (err) {
    return error(res, 'Unauthorized', { token: 'Token tidak valid atau kadaluarsa' }, 401);
  }
}

/** akses role */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return error(res, 'Forbidden', { role: 'Anda tidak memiliki akses ke resource ini' }, 403);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
