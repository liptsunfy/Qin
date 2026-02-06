/**
 * 顶部动态信息（公告/节日祝福）
 * 说明：不依赖网络，不引入业务状态；仅提供一个稳定的“动态文案入口”。
 */

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function getTodayKey(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

function dayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date - start;
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.floor(diff / oneDay);
}

/**
 * 基于公历日期做简单节日祝福（不做农历推算，避免引入复杂依赖）。
 */
function getFestivalNotice(date) {
  const m = date.getMonth() + 1;
  const d = date.getDate();

  // 可按需扩展：保持“提示/公告位”的性质，不改变业务逻辑。
  const fixed = {
    '01-01': { badge: '节日', text: '新年快乐。愿新的一年琴心更定，进步更快。' },
    '02-14': { badge: '祝福', text: '愿你在琴声里，遇见更好的自己。' },
    '05-01': { badge: '节日', text: '劳动节快乐。今天也别忘了给自己留一点练琴时间。' },
    '10-01': { badge: '节日', text: '国庆快乐。愿你假期练琴不荒废，手感常在线。' },
    '12-31': { badge: '祝福', text: '年末了。回顾这一年的练习，坚持就是胜利。' }
  };

  const key = `${pad2(m)}-${pad2(d)}`;
  return fixed[key] || null;
}

function getRotatingNotice(date) {
  const messages = [
    { badge: '公告', text: '小目标：今天练琴 10 分钟，胜过明天的 1 小时。' },
    { badge: '提示', text: '练习前先调弦，能让手感与音色稳定很多。' },
    { badge: '建议', text: '每次只抓一个问题点：节奏、音准、或手型，不要全都想。' },
    { badge: '推荐', text: '慢练是最快的练法。把速度降到“零失误”再逐步加速。' },
    { badge: '提醒', text: '如果手指疲劳，停一停。高质量练习比硬撑更重要。' }
  ];

  const idx = dayOfYear(date) % messages.length;
  return messages[idx];
}

function getDynamicNotice() {
  const now = new Date();
  const festival = getFestivalNotice(now);

  const base = festival || getRotatingNotice(now);
  return {
    badge: base.badge || '公告',
    text: base.text || '欢迎使用练习工具。',
    subtext: `更新于 ${getTodayKey(now)}`
  };
}

module.exports = {
  getDynamicNotice
};
