const { solarToLunar } = require('./lunar');
const { getFestivalLabel } = require('./festival');

const WEEK_CN = ['日','一','二','三','四','五','六'];

function pad2(n) { return n < 10 ? `0${n}` : `${n}`; }

function parseDate(dateStr) {
  // dateStr: YYYY-MM-DD
  const [y, m, d] = String(dateStr).split('-').map(n => parseInt(n, 10));
  if (!y || !m || !d) return new Date();
  return new Date(y, m - 1, d);
}

function formatSolarElegant(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  const w = WEEK_CN[date.getDay()];
  return `${y}年${m}月${d}日 · 周${w}`;
}

function formatLunarBrief(date) {
  try {
    const lunar = solarToLunar(date);
    if (lunar && lunar.lunarMonthText && lunar.lunarDayText) {
      return `${lunar.lunarMonthText}${lunar.lunarDayText}`;
    }
  } catch (e) {}
  return '';
}

function formatDateForPoster(dateStr) {
  const date = parseDate(dateStr);
  const solar = formatSolarElegant(date);
  let lunarText = '';
  let label = '';
  try {
    const r = getFestivalLabel(date);
    label = r.label || '';
    lunarText = r.lunar ? `${r.lunar.lunarMonthText}${r.lunar.lunarDayText}` : formatLunarBrief(date);
  } catch (e) {
    lunarText = formatLunarBrief(date);
  }

  const secondary = label ? `${label} · ${lunarText}` : lunarText;
  return { solar, lunar: secondary };
}

module.exports = {
  formatDateForPoster
};
