const DateUtil = require('../../utils/dateUtil');

Component({
  properties: {
    // 当前年份
    year: {
      type: Number,
      value: new Date().getFullYear()
    },
    // 当前月份
    month: {
      type: Number,
      value: new Date().getMonth() + 1
    },
    // 打卡记录数据 {date: 'YYYY-MM-DD', hasRecord: boolean, duration: number}
    records: {
      type: Array,
      value: []
    }
  },

  data: {
    monthDates: [],
    weekdays: ['日', '一', '二', '三', '四', '五', '六']
  },

  observers: {
    'year,month': function(year, month) {
      this.generateCalendar(year, month);
    }
  },

  methods: {
    // 生成日历数据
    generateCalendar(year, month) {
      const monthDates = DateUtil.getMonthDates(year, month);
      const firstDay = new Date(year, month - 1, 1).getDay();
      
      // 添加上个月的空格
      const calendarDates = [];
      for (let i = 0; i < firstDay; i++) {
        calendarDates.push({ type: 'prev', date: null });
      }
      
      // 添加本月日期
      monthDates.forEach(date => {
        calendarDates.push({
          type: 'current',
          date,
          isToday: DateUtil.isToday(date)
        });
      });
      
      // 补充下个月的空格，凑齐7的倍数
      const totalCells = Math.ceil(calendarDates.length / 7) * 7;
      const remaining = totalCells - calendarDates.length;
      for (let i = 0; i < remaining; i++) {
        calendarDates.push({ type: 'next', date: null });
      }
      
      this.setData({ monthDates: calendarDates });
    },

    // 点击日期
    onDateTap(e) {
      const { date, type } = e.currentTarget.dataset;
      if (date && type === 'current') {
        this.triggerEvent('dateTap', { date });
      }
    },

    // 切换月份
    onMonthChange(e) {
      const direction = e.currentTarget.dataset.direction;
      const { year, month } = this.data;
      
      const newDate = DateUtil.addMonths(year, month, direction === 'next' ? 1 : -1);
      
      this.triggerEvent('monthChange', newDate);
    }
  },

  lifetimes: {
    attached() {
      this.generateCalendar(this.data.year, this.data.month);
    }
  }
});