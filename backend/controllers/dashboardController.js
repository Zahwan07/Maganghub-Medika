const pool = require('../db/pool');
const { success } = require('../utils/response');

// GET /dashboard/stats
async function stats(req, res, next) {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const [[totalPatients]] = await pool.query('SELECT COUNT(*) AS c FROM patients');
    const [[patientsToday]] = await pool.query(
      'SELECT COUNT(DISTINCT patient_id) AS c FROM registrations WHERE visit_date = :d', { d: today }
    );
    const [[queuesToday]] = await pool.query(
      'SELECT COUNT(*) AS c FROM queues WHERE queue_date = :d', { d: today }
    );
    const [[waiting]] = await pool.query(
      "SELECT COUNT(*) AS c FROM registrations WHERE visit_date = :d AND status IN ('menunggu','check_in','pemeriksaan')", { d: today }
    );
    const [[served]] = await pool.query(
      "SELECT COUNT(*) AS c FROM registrations WHERE visit_date = :d AND status = 'selesai'", { d: today }
    );

    // 7 hari terakhir untuk grafik
    const [chart] = await pool.query(
      `SELECT visit_date AS date, COUNT(*) AS total
       FROM registrations
       WHERE visit_date >= DATE_SUB(:d, INTERVAL 6 DAY)
       GROUP BY visit_date ORDER BY visit_date ASC`,
      { d: today }
    );

    return success(res, {
      total_patients: totalPatients.c,
      patients_today: patientsToday.c,
      queues_today: queuesToday.c,
      waiting: waiting.c,
      served: served.c,
      chart,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { stats };
