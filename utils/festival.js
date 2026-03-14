const { solarToLunar } = require('./lunar');

// 24 节气（离线计算）
const SOLAR_TERMS = [
  '小寒','大寒','立春','雨水','惊蛰','春分',
  '清明','谷雨','立夏','小满','芒种','夏至',
  '小暑','大暑','立秋','处暑','白露','秋分',
  '寒露','霜降','立冬','小雪','大雪','冬至'
];

// 节气常数（分钟）
const S_TERM_INFO = [
  0, 21208, 42467, 63836, 85337, 107014,
  128867, 150921, 173149, 195551, 218072, 240693,
  263343, 285989, 308563, 331033, 353350, 375494,
  397447, 419210, 440795, 462224, 483532, 504758
];

function pad2(n) {
  return n < 10 ? `0${n}` : `${n}`;
}

function getSolarTermName(date) {
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();

  for (let k = 0; k < 2; k++) {
    const idx = m * 2 + k;
    const termUTC = Date.UTC(1900, 0, 6, 2, 5) +
      (31556925974.7 * (y - 1900)) +
      (S_TERM_INFO[idx] * 60000);
    const termDate = new Date(termUTC);
    if (
      termDate.getUTCFullYear() === y &&
      termDate.getUTCMonth() === m &&
      termDate.getUTCDate() === d
    ) {
      return SOLAR_TERMS[idx];
    }
  }
  return '';
}

// 公历节日（固定）
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

function getSolarFestival(date) {
  const key = `${pad2(date.getMonth() + 1)}${pad2(date.getDate())}`;
  return SOLAR_FESTIVALS[key] || '';
}

function getLunarFestival(lunar, date) {
  const key = `${pad2(lunar.lunarMonth)}${pad2(lunar.lunarDay)}`;

  // 除夕：判断次日是否正月初一
  if (!lunar.isLeap && lunar.lunarMonth === 12) {
    try {
      const next = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) + 86400000);
      const nextL = solarToLunar(next);
      if (nextL.lunarMonth === 1 && nextL.lunarDay === 1) return '除夕';
    } catch (e) {
      // ignore
    }
  }

  // 小年（腊月廿三/廿四）
  if (!lunar.isLeap && lunar.lunarMonth === 12 && (lunar.lunarDay === 23 || lunar.lunarDay === 24)) {
    return '小年';
  }

  return LUNAR_FESTIVALS[key] || '';
}

// 祝福文案（极简、偏雅）
const BLESSINGS = {
  '春节': '新岁安和',
  '除夕': '岁除安顺',
  '元宵': '灯火可亲',
  '端午': '端午安康',
  '中秋': '月明如水',
  '国庆': '山河锦绣',
  '冬至': '冬至安暖',
  '立春': '春启安然',
  '小寒': '寒尽有期',
  '大寒': '岁寒知暖'
};

function getBlessing(label) {
  return BLESSINGS[label] || '';
}

/**
 * 返回节日/节气信息。
 * 优先级：农历节日 > 公历节日 > 节气
 */
function getFestivalInfo(date) {
  const d = date instanceof Date ? date : new Date(date);
  let lunar = null;
  try {
    lunar = solarToLunar(d);
  } catch (e) {
    // ignore
  }

  const lunarFestival = lunar ? getLunarFestival(lunar, d) : '';
  const solarFestival = getSolarFestival(d);
  const solarTerm = getSolarTermName(d);

  const label = lunarFestival || solarFestival || solarTerm || '';
  return {
    label,
    blessing: getBlessing(label),
    lunar
  };
}

module.exports = {
  getFestivalInfo
};
