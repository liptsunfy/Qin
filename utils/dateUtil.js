// 日期工具类
const DateUtil = {
  // 获取今天日期字符串 YYYY-MM-DD
  getToday() {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  },

  // 格式化日期显示
  formatDate(dateStr, format = 'MM-DD') {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    switch (format) {
      case 'MM-DD':
        return `${month}-${day}`;
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'MM/DD':
        return `${month}/${day}`;
      case 'M月D日':
        return `${parseInt(month)}月${parseInt(day)}日`;
      default:
        return dateStr;
    }
  },

  // 获取星期几
  getWeekday(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    return weekdays[date.getDay()];
  },

  // 获取本周所有日期（从周一开始）
  getWeekDates(date = new Date()) {
    const today = new Date(date);
    const day = today.getDay();
    const diff = day === 0 ? 6 : day - 1; // 如果是周日，则向前6天到周一
    
    const monday = new Date(today);
    monday.setDate(today.getDate() - diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(monday);
      currentDate.setDate(monday.getDate() + i);
      
      const year = currentDate.getFullYear();
      const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
      const day = currentDate.getDate().toString().padStart(2, '0');
      
      weekDates.push(`${year}-${month}-${day}`);
    }
    
    return weekDates;
  },

  // 获取月份所有日期
  getMonthDates(year, month) {
    // 确保月份是两位数
    const monthStr = month.toString().padStart(2, '0');
    
    // 获取本月最后一天
    const lastDay = new Date(year, month, 0).getDate();
    
    const dates = [];
    for (let day = 1; day <= lastDay; day++) {
      const dayStr = day.toString().padStart(2, '0');
      dates.push(`${year}-${monthStr}-${dayStr}`);
    }
    
    return dates;
  },

  // 月份加减
  addMonths(year, month, months) {
    const date = new Date(year, month - 1 + months, 1);
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1
    };
  },

  // 判断是否为今天
  isToday(dateStr) {
    return dateStr === this.getToday();
  },

  // 判断是否为同一天
  isSameDay(date1, date2) {
    return date1 === date2;
  },

  // 日期加减天数
  addDays(dateStr, days) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    
    date.setDate(date.getDate() + days);
    
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  },

  // 获取日期差（天数）
  getDaysBetween(date1, date2) {
    if (!date1 || !date2) return 0;
    
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) return 0;
    
    const diffTime = Math.abs(d2 - d1);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  },

  // 获取月份第一天和最后一天
  getMonthRange(year, month) {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    const startYear = startDate.getFullYear();
    const startMonth = (startDate.getMonth() + 1).toString().padStart(2, '0');
    const startDay = startDate.getDate().toString().padStart(2, '0');
    
    const endYear = endDate.getFullYear();
    const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
    const endDay = endDate.getDate().toString().padStart(2, '0');
    
    return {
      start: `${startYear}-${startMonth}-${startDay}`,
      end: `${endYear}-${endMonth}-${endDay}`
    };
  },

  // 获取年份和月份（从日期字符串中）
  getYearMonth(dateStr) {
    if (!dateStr) return { year: 0, month: 0 };
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return { year: 0, month: 0 };
    
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1
    };
  },

  // 验证日期字符串是否有效
  isValidDate(dateStr) {
    if (!dateStr) return false;
    
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  },

  // 比较两个日期
  compareDates(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    if (d1 < d2) return -1;
    if (d1 > d2) return 1;
    return 0;
  },

  // 获取当前时间戳
  getTimestamp() {
    return new Date().getTime();
  },

  // 格式化时间为字符串
  formatTime(date, format = 'YYYY-MM-DD HH:mm:ss') {
    if (!date) return '';
    
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const seconds = d.getSeconds().toString().padStart(2, '0');
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds);
  },

  // 获取相对时间描述
  getRelativeTime(dateStr) {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 30) {
      const diffMonth = Math.floor(diffDay / 30);
      if (diffMonth > 12) {
        const diffYear = Math.floor(diffMonth / 12);
        return `${diffYear}年前`;
      }
      return `${diffMonth}个月前`;
    } else if (diffDay > 0) {
      return `${diffDay}天前`;
    } else if (diffHour > 0) {
      return `${diffHour}小时前`;
    } else if (diffMin > 0) {
      return `${diffMin}分钟前`;
    } else {
      return '刚刚';
    }
  },

  // 获取当前季度
  getCurrentQuarter() {
    const now = new Date();
    const month = now.getMonth() + 1;
    return Math.ceil(month / 3);
  },

  // 判断是否为闰年
  isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  },

  // 获取月份天数
  getDaysInMonth(year, month) {
    return new Date(year, month, 0).getDate();
  },

  // 获取日期是一年中的第几天
  getDayOfYear(dateStr) {
    const date = new Date(dateStr);
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  },

  // 获取日期是星期几（英文）
  getWeekdayEn(dateStr) {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date(dateStr);
    return weekdays[date.getDay()];
  },

  // 获取月份名称
  getMonthName(month, lang = 'zh') {
    const zhNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    const enNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    if (month < 1 || month > 12) return '';
    return lang === 'zh' ? zhNames[month - 1] : enNames[month - 1];
  },

  // 获取日期范围（用于分享等）
  getDateRangeDescription(startDate, endDate) {
    if (!startDate || !endDate) return '';
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return '';
    
    const daysDiff = this.getDaysBetween(startDate, endDate);
    
    if (daysDiff === 0) {
      return this.formatDate(startDate, 'M月D日');
    } else if (daysDiff === 6) {
      return '本周';
    } else if (daysDiff === 29 || daysDiff === 30) {
      return '最近30天';
    } else {
      return `${this.formatDate(startDate, 'M月D日')} 至 ${this.formatDate(endDate, 'M月D日')}`;
    }
  }
};

module.exports = DateUtil;