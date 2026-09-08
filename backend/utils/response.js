/** bantu format response API*/

function success(res, data = {}, message = 'Success', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function created(res, data = {}, message = 'Created') {
  return success(res, data, message, 201);
}

function error(res, message = 'Error', errors = {}, status = 400) {
  return res.status(status).json({ success: false, message, errors });
}

module.exports = { success, created, error };
