function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// pg DATE columns come back as JS Date (midnight UTC) — format as YYYY-MM-DD like Jackson did.
function toISODate(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    if (value.trim() === '') return null;
    return value.slice(0, 10);
  }
  return null;
}

function emptyToNull(value) {
  if (value === undefined || value === null) return null;
  if (typeof value === 'string' && value.trim() === '') return null;
  return value;
}

function toId(value) {
  const v = emptyToNull(value);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

function toNumberOrNull(value) {
  const v = emptyToNull(value);
  if (v === null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? v : n;
}

function isBlank(value) {
  return typeof value !== 'string' || value.trim() === '';
}

function isEmail(value) {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isDateString(value) {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())
    && !Number.isNaN(Date.parse(value));
}

function notFound(message) {
  const err = new Error(message);
  err.status = 404;
  return err;
}

const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = {
  todayISO,
  toISODate,
  emptyToNull,
  toId,
  toNumberOrNull,
  isBlank,
  isEmail,
  isDateString,
  notFound,
  asyncHandler,
};
