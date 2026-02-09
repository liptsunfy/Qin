/**
 * 工具页顶部“留白但不空白”的承载位
 * 默认：展示农历日期（可选附加公历），后期可扩展为节日祝福/公告。
 */

const { solarToLunar } = require('./lunar');

// 24 节气（离线计算，1900-2100 适用的经典算法）
const SOLAR_TERMS = [
  '小寒','大寒','立春','雨水','惊蛰','春分',
  '清明','谷雨','立夏','小满','芒种','夏至',
  '小暑','大暑','立秋','处暑','白露','秋分',
  '寒露','霜降','立冬','小雪','大雪','冬至'
];

// 节气常数（单位：分钟），配合公式推算当年节气日期
// 该数组是业内常用的 sTermInfo 常量。
const S_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014,
  128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494,
  397447, 419210, 440795, 462224, 483532, 504758
];

function getSolarTermName(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  // 每月两个节气：index = m*2, m*2+1
  for (let k = 0; k < 2; k++) {
    const idx = m * 2 + k;
    const termUTC = Date.UTC(1900, 0, 6, 2, 5) +
      (31556925974.7 * (y - 1900)) +
      (S_TERM_INFO[idx] * 60000);
    const termDate = new Date(termUTC);
    if (termDate.getUTCDate() === d && termDate.getUTCMonth() === m && termDate.getUTCFullYear() === y) {
      return SOLAR_TERMS[idx];
    }
  }
  return '';
}

// 公历节日（固定日期）
const SOLAR_FESTIVALS = {
  '0101': '元旦',
  '0214': '情人节',
  '0308': '妇女节',
  '0401': '愚人节',
  '0501': '劳动节',
  '0601': '儿童节',
  '0910': '教师节',
  '1001': '国庆',
  '1225': '圣诞节'
};

// 农历节日（按农历月日）
const LUNAR_FESTIVALS = {
  '0101': '春节',
  '0115': '元宵',
  '0202': '龙抬头',
  '0505': '端午',
  '0707': '七夕',
  '0815': '中秋',
  '0909': '重阳',
  '1208': '腊八'
};

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function getSolarFestival(date) {
  const key = `${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  return SOLAR_FESTIVALS[key] || '';
}

function getLunarFestival(lunar, date) {
  const key = `${pad2(lunar.lunarMonth)}${pad2(lunar.lunarDay)}`;
  // 除夕：腊月最后一天（非闰月）
  if (!lunar.isLeap && lunar.lunarMonth === 12) {
    // 简化：根据“腊月”天数判断是否最后一天
    // lunar.js 内部 monthDays 可算，但未导出；这里用经验：腊月通常 29/30。
    // 做法：如果日为 29 或 30 且次日为正月初一，则判为除夕。
    // 由于 header 显示只需要“是否除夕”，用一次前后日比较更可靠。
    try {
      const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + 86400000);
      const nextL = solarToLunar(next);
      if (nextL.lunarMonth === 1 && nextL.lunarDay === 1) return '除夕';
    } catch (e) {
      // ignore
    }
  }
  // 小年（北/南差异），这里用常见的腊月廿三/廿四双支持
  if (!lunar.isLeap && lunar.lunarMonth === 12 && (lunar.lunarDay === 23 || lunar.lunarDay === 24)) {
    return '小年';
  }
  return LUNAR_FESTIVALS[key] || '';
}

function formatSolar(date) {
  const y = date.getFullYear();
  const m = pad2(date.getMonth() + 1);
  const d = pad2(date.getDate());
  return `${y}-${m}-${d}`;
}

/**
 * 预留：低频公告/祝福覆盖
 * 返回 { primary, secondary } 或 null
 */
function getOverrideText(_date) {
  return null;
}

function getHeaderSlotText(date = new Date()) {
  const override = getOverrideText(date);
  if (override && override.primary) return override;

  let lunarText = '今日 · 习练';
  let lunarYearText = '';
  let label = '';
  try {
    const lunar = solarToLunar(date);
    if (lunar && lunar.text) lunarText = lunar.text;

    // 年份显示：天干地支年 + 生肖
    if (lunar && lunar.gzYear) {
      lunarYearText = `${lunar.gzYear}年${lunar.animal ? `（${lunar.animal}）` : ''}`;
    }

    // 节日/节气优先级：农历节日 > 公历节日 > 节气
    label = getLunarFestival(lunar, date) || getSolarFestival(date) || getSolarTermName(date);

    // 主行：节日/节气 + 农历月日；无 label 则仅农历月日
    if (label) {
      lunarText = `${label} · ${lunar.lunarMonthText}${lunar.lunarDayText}`;
    } else {
      lunarText = `${lunar.lunarMonthText}${lunar.lunarDayText}`;
    }
  } catch (e) {
    // ignore
  }

  return {
    primary: lunarText,
    secondary: lunarYearText ? `${lunarYearText} · ${formatSolar(date)}` : formatSolar(date)
  };
}

module.exports = {
  getHeaderSlotText
};
