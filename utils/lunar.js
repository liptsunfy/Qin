/**
 * 农历（1900-2100）公历转农历：离线可用
 * 说明：该实现用于展示“农历日期文本”，不依赖网络。
 */

// 1900-2100 农历数据表（完整 201 项，1900..2100）
// 该表用于精确计算农历月份/闰月；如果使用不完整数据会导致月份溢出（如出现“13月/undefined月”）。
const lunarInfo = [
  0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2, // 1900-1909
  0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977, // 1910-1919
  0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970, // 1920-1929
  0x06566, 0x0d4a0, 0x0ea50, 0x16a95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950, // 1930-1939
  0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557, // 1940-1949
  0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5b0, 0x14573, 0x052b0, 0x0a9a8, 0x0e950, 0x06aa0, // 1950-1959
  0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0, // 1960-1969
  0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b6a0, 0x195a6, // 1970-1979
  0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570, // 1980-1989
  0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x05ac0, 0x0ab60, 0x096d5, 0x092e0, // 1990-1999
  0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5, // 2000-2009
  0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930, // 2010-2019
  0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530, // 2020-2029
  0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45, // 2030-2039
  0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0, // 2040-2049
  0x14b63, 0x09370, 0x049f8, 0x04970, 0x064b0, 0x168a6, 0x0ea50, 0x06b20, 0x1a6c4, 0x0aae0, // 2050-2059
  0x092e0, 0x0d2e3, 0x0c960, 0x0d557, 0x0d4a0, 0x0da50, 0x05d55, 0x056a0, 0x0a6d0, 0x055d4, // 2060-2069
  0x052d0, 0x0a9b8, 0x0a950, 0x0b4a0, 0x0b6a6, 0x0ad50, 0x055a0, 0x0aba4, 0x0a5b0, 0x052b0, // 2070-2079
  0x0b273, 0x06930, 0x07337, 0x06aa0, 0x0ad50, 0x14b55, 0x04b60, 0x0a570, 0x054e4, 0x0d160, // 2080-2089
  0x0e968, 0x0d520, 0x0daa0, 0x16aa6, 0x056d0, 0x04ae0, 0x0a9d4, 0x0a2d0, 0x0d150, 0x0f252, // 2090-2099
  0x0d520 // 2100
];

const chineseMonth = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
const chineseDayPrefix = ['初','十','廿','三'];
const chineseDayNum = ['一','二','三','四','五','六','七','八','九','十'];

// 天干地支与生肖（用于年份显示）
const gan = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const zhi = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const animals = ['鼠','牛','虎','兔','龙','蛇','马','羊','猴','鸡','狗','猪'];

function ganzhiYear(lunarYear) {
  // 以 4 年为甲子年起点（公历 4 年为甲子：甲子鼠）
  const idx = (lunarYear - 4) % 60;
  const g = gan[(idx + 60) % 10];
  const z = zhi[(idx + 60) % 12];
  return {
    gz: `${g}${z}`,
    animal: animals[(idx + 60) % 12]
  };
}

function leapMonth(y) {
  return lunarInfo[y - 1900] & 0xf;
}

function leapDays(y) {
  if (leapMonth(y)) {
    return (lunarInfo[y - 1900] & 0x10000) ? 30 : 29;
  }
  return 0;
}

function monthDays(y, m) {
  return (lunarInfo[y - 1900] & (0x10000 >> m)) ? 30 : 29;
}

function lYearDays(y) {
  let sum = 348;
  for (let i = 0x8000; i > 0x8; i >>= 1) {
    sum += (lunarInfo[y - 1900] & i) ? 1 : 0;
  }
  return sum + leapDays(y);
}

function formatLunarDay(d) {
  if (d === 10) return '初十';
  if (d === 20) return '二十';
  if (d === 30) return '三十';
  const prefix = chineseDayPrefix[Math.floor((d - 1) / 10)];
  const num = chineseDayNum[(d - 1) % 10];
  return prefix + num;
}

/**
 * 公历转农历
 * @param {Date} date
 * @returns {{lunarYear:number,lunarMonth:number,lunarDay:number,isLeap:boolean,lunarMonthText:string,lunarDayText:string,text:string}}
 */
function solarToLunar(date) {
  // 重要：使用 UTC 计算“相差天数”，避免不同时区/DST 造成的偏移累积。
  // 1900-01-31（公历）对应农历 1900 正月初一。
  const y = date.getFullYear();
  const m = date.getMonth();
  const d = date.getDate();
  const baseUTC = Date.UTC(1900, 0, 31);
  const targetUTC = Date.UTC(y, m, d);
  let offset = Math.floor((targetUTC - baseUTC) / 86400000);

  // 逐年扣减，直到定位到目标农历年
  // 注意：这里必须使用“for 循环自增 year”的标准写法，
  // 否则当 offset 首次变为负数时会出现 year 多减 1 的问题。
  let year = 1900;
  let temp = 0;
  for (; year < 2101 && offset > 0; year++) {
    temp = lYearDays(year);
    offset -= temp;
  }
  if (offset < 0) {
    offset += temp;
    year--;
  }

  const leap = leapMonth(year);
  let isLeap = false;

  // 农历月份定位：按 calendar.js 的成熟实现逻辑处理闰月
  let i = 1;
  for (i = 1; i < 13 && offset > 0; i++) {
    // 闰月：在 leap+1 位置插入一次“闰月”计算
    if (leap > 0 && i === (leap + 1) && !isLeap) {
      i--; // 复用当前 i 作为闰月月份
      isLeap = true;
      temp = leapDays(year);
    } else {
      temp = monthDays(year, i);
    }

    offset -= temp;

    // 解除闰月
    if (isLeap === true && i === (leap + 1)) {
      isLeap = false;
    }
  }

  // 闰月导致数组下标重叠取反
  if (offset === 0 && leap > 0 && i === leap + 1) {
    if (isLeap) {
      isLeap = false;
    } else {
      isLeap = true;
      --i;
    }
  }

  if (offset < 0) {
    offset += temp;
    --i;
  }

  const month = i;
  const day = offset + 1;
  const monthIndex = Math.max(1, Math.min(12, month || 1));
  const lunarMonthText = (isLeap ? '闰' : '') + chineseMonth[monthIndex - 1] + '月';
  const lunarDayText = formatLunarDay(day);

  const gz = ganzhiYear(year);

  return {
    lunarYear: year,
    lunarMonth: month,
    lunarDay: day,
    isLeap,
    gzYear: gz.gz,
    animal: gz.animal,
    lunarMonthText,
    lunarDayText,
    text: `${lunarMonthText}${lunarDayText}`
  };
}

module.exports = {
  solarToLunar
};
