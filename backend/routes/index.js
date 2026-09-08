const express = require('express');
const router = express.Router();

const { authenticate, authorize } = require('../middleware/auth');
const auth = require('../controllers/authController');
const patients = require('../controllers/patientController');
const registrations = require('../controllers/registrationController');
const queues = require('../controllers/queueController');
const medicalRecords = require('../controllers/medicalRecordController');
const prescriptions = require('../controllers/prescriptionController');
const dashboard = require('../controllers/dashboardController');
const master = require('../controllers/masterController');

// Health
router.get('/', (req, res) => res.json({ success: true, message: 'Mini Clinic API', data: { status: 'ok' } }));
router.get('/health', (req, res) => res.json({ success: true, message: 'OK', data: { status: 'ok' } }));

// ---------- Authentication ----------
router.post('/login', auth.login);
router.post('/logout', authenticate, auth.logout);
router.get('/me', authenticate, auth.me);

// ---------- Master (dropdown) ----------
router.get('/doctors', authenticate, master.doctors);
router.get('/polis', authenticate, master.polis);

// ---------- Dashboard ----------
router.get('/dashboard/stats', authenticate, dashboard.stats);

// ---------- Patients ----------
router.get('/patients', authenticate, patients.list);
router.get('/patients/:id', authenticate, patients.detail);
router.post('/patients', authenticate, authorize('admin', 'petugas'), patients.create);
router.put('/patients/:id', authenticate, authorize('admin', 'petugas'), patients.update);
router.delete('/patients/:id', authenticate, authorize('admin'), patients.remove);

// ---------- Registrations ----------
router.get('/registrations', authenticate, registrations.list);
router.get('/registrations/:id', authenticate, registrations.detail);
router.post('/registrations', authenticate, authorize('admin', 'petugas'), registrations.create);
router.put('/registrations/:id', authenticate, authorize('admin', 'petugas', 'dokter'), registrations.update);

// ---------- Queues ----------
router.get('/queues', authenticate, queues.list);
router.post('/queues', authenticate, authorize('admin', 'petugas'), queues.create);
router.put('/queues/:id/call', authenticate, authorize('admin', 'petugas', 'dokter'), queues.call);
router.put('/queues/:id/status', authenticate, authorize('admin', 'petugas', 'dokter'), queues.updateStatus);

// ---------- Medical Records (SOAP) ----------
router.post('/medical-records', authenticate, authorize('admin', 'dokter'), medicalRecords.create);
router.get('/medical-records/:patientId', authenticate, medicalRecords.historyByPatient);

// ---------- Prescriptions ----------
router.post('/prescriptions', authenticate, authorize('admin', 'dokter'), prescriptions.create);
router.get('/prescriptions/:id', authenticate, prescriptions.detail);

module.exports = router;
