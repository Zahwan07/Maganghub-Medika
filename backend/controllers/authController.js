const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { success, error } = require('../utils/response');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const errors = {};
    if (!username) errors.username = 'Username wajib diisi';
    if (!password) errors.password = 'Password wajib diisi';
    if (Object.keys(errors).length) return error(res, 'Validation Error', errors, 422);

    const [rows] = await pool.query(
      'SELECT id, name, username, password_hash, role, poli_id, is_active FROM users WHERE username = :username',
      { username }
    );
    if (rows.length === 0) {
      return error(res, 'Username atau password salah', { credentials: 'Kredensial tidak valid' }, 401);
    }
    const user = rows[0];
    if (!user.is_active) {
      return error(res, 'Akun non-aktif', { account: 'Hubungi administrator' }, 403);
    }
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return error(res, 'Username atau password salah', { credentials: 'Kredensial tidak valid' }, 401);
    }

    const token = jwt.sign(
      { sub: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
    );

    delete user.password_hash;
    return success(res, { token, user }, 'Login berhasil');
  } catch (err) {
  console.error("LOGIN ERROR:", err);

  return res.status(500).json({
    success: false,
    message: err.message,
    stack: err.stack
  });
}
}

async function logout(req, res) {
  
  return success(res, {}, 'Logout berhasil');
}

async function me(req, res) {
  return success(res, { user: req.user }, 'Profil pengguna');
}

module.exports = { login, logout, me };
