function normalizeDate(value) {
  const text = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function normalizeTime(value) {
  if (value === null || value === undefined || value === '') return null;
  const text = String(value).trim();
  if (!/^\d{2}:\d{2}$/.test(text)) return null;
  const [hour, minute] = text.split(':').map(Number);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return text;
}

function timeToMinutes(value) {
  const text = normalizeTime(value);
  if (!text) return null;
  const [hour, minute] = text.split(':').map(Number);
  return hour * 60 + minute;
}

function isValidTimeRange(startTime, endTime) {
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  if (start === null || end === null) return true;
  return end >= start;
}

function reminderOffsetMinutes(label) {
  const text = String(label || '').toLowerCase();
  if (!text) return null;
  if (text.includes('5')) return 5;
  if (text.includes('15')) return 15;
  if (text.includes('30')) return 30;
  if (text.includes('1小时前') || text.includes('1 час')) return 60;
  return null;
}

function normalizeLanguage(value) {
  const lang = String(value || '').trim().toLowerCase();
  return ['zh', 'ru'].includes(lang) ? lang : null;
}

module.exports = {
  normalizeDate,
  normalizeTime,
  timeToMinutes,
  isValidTimeRange,
  reminderOffsetMinutes,
  normalizeLanguage
};
