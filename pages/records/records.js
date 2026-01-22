const storage = require('../../utils/storage.js');
const DateUtil = require('../../utils/dateUtil.js');

const { CheckinManager, UserManager } = storage;

function round1(num) {
  return Math.round(num * 10) / 10;
}

Page({
  data: {
    rangeText: '',

    stats: {
      avgDailyHours: 0,
      totalHours: 0,
      songCount: 0,
      topSongs: []
    },

    recordGroups: []
  },

  onLoad() {
    this.refresh();
  },

  onShow() {
    this.refresh();
  },

  refresh() {
    const today = DateUtil.getToday();
    const userInfo = UserManager.getUserInfo();
    const joinDate = userInfo && userInfo.joinDate ? userInfo.joinDate : today;

    const records = CheckinManager.getAllRecords();
    const startDate = records.length > 0 ? records[records.length - 1].date : joinDate;
    const rangeStart = startDate < joinDate ? startDate : joinDate;
    const rangeText = `${rangeStart} 至 ${today}`;

    const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalHours = round1(totalMinutes / 60);
    const totalDays = DateUtil.getDaysBetween(rangeStart, today) + 1;
    const avgDailyHours = round1(totalDays > 0 ? (totalMinutes / 60) / totalDays : 0);

    const songSet = new Set(records.map(r => (r.song || '未命名曲目')));
    const songCountMap = {};
    records.forEach(r => {
      const s = r.song || '未命名曲目';
      songCountMap[s] = (songCountMap[s] || 0) + 1;
    });

    const topSongs = Object.keys(songCountMap)
      .map(name => ({ name, count: songCountMap[name] }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    const stats = {
      avgDailyHours,
      totalHours,
      songCount: songSet.size,
      topSongs
    };

    const recordGroups = [];
    const groupMap = {};
    records.forEach(record => {
      if (!groupMap[record.date]) {
        groupMap[record.date] = { date: record.date, items: [] };
        recordGroups.push(groupMap[record.date]);
      }
      groupMap[record.date].items.push({
        ...record,
        timeText: this.formatRecordTime(record.createTime)
      });
    });

    this.setData({
      rangeText,
      stats,
      recordGroups
    });
  },

  formatRecordTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
});
