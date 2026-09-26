// Centralized error mapping — mirrors GlobalExceptionHandler:
// 404 {error} for missing resources, 500 {error} otherwise (incl. duplicate-email constraint violations).
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err && err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  if (err && err.code === '23505') {
    return res.status(500).json({ error: 'Duplicate value violates unique constraint' });
  }
  const message = (err && err.message) || 'Internal server error';
  return res.status(500).json({ error: message });
}

module.exports = errorHandler;
