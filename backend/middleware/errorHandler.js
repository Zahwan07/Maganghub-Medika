const { error } = require('../utils/response');

/** 404 error */
function notFound(req, res) {
  return error(res, 'Not Found', { path: `Route ${req.method} ${req.originalUrl} tidak ditemukan` }, 404);
}

/** Global error */
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err);
  if (err && err.code === 'ER_DUP_ENTRY') {
    return error(res, 'Data duplikat', { detail: err.sqlMessage }, 409);
  }
  return error(res, 'Internal Server Error', { detail: err.message }, 500);
}

module.exports = { notFound, errorHandler };
