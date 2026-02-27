const storage = require('../../utils/storage.js');
const DateUtil = require('../../utils/dateUtil.js');

const { CheckinManager, UserManager } = storage;

function round1(num) {
  return Math.round(num * 10) / 10;
}

Page({
  data: {
    rangeText: '',
    filterStart: '',
    filterEnd: '',
    filterHint: '',

    stats: {
      avgDailyHours: 0,
      totalHours: 0,
      totalSessions: 0,
      checkinDays: 0,
      avgSessionMinutes: 0,
      avgCheckinMinutes: 0,
      maxDailyMinutes: 0,
      songCount: 0,
      topSongs: [],
      timeBuckets: [],
      newSongs: []
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
    const totalSessions = records.reduce((sum, r) => sum + (r.repeatCount || 1), 0);
    const checkinDays = new Set(records.map(r => r.date)).size;
    const avgSessionMinutes = totalSessions > 0 ? Math.round(totalMinutes / totalSessions) : 0;
    const avgCheckinMinutes = checkinDays > 0 ? Math.round(totalMinutes / checkinDays) : 0;

    const dailyMinutesMap = {};
    records.forEach((r) => {
      dailyMinutesMap[r.date] = (dailyMinutesMap[r.date] || 0) + (r.duration || 0);
    });
    const maxDailyMinutes = Math.max(...Object.values(dailyMinutesMap), 0);

    const songSet = new Set(records.map(r => (r.song || '未命名曲目')));
    const songCountMap = {};
    records.forEach(r => {
      const s = r.song || '未命名曲目';
      songCountMap[s] = (songCountMap[s] || 0) + (r.repeatCount || 1);
    });

    const maxSongCount = Math.max(...Object.values(songCountMap), 0);
    const topSongs = Object.keys(songCountMap)
      .map(name => ({
        name,
        count: songCountMap[name],
        percent: maxSongCount > 0 ? Math.round((songCountMap[name] / maxSongCount) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const timeBuckets = this.buildTimeBuckets(records);
    const newSongs = this.buildNewSongs(records);

    const stats = {
      avgDailyHours,
      totalHours,
      totalSessions,
      checkinDays,
      avgSessionMinutes,
      avgCheckinMinutes,
      maxDailyMinutes,
      songCount: songSet.size,
      topSongs,
      timeBuckets,
      newSongs
    };

    const defaultFilterStart = this.data.filterStart && DateUtil.isValidDate(this.data.filterStart)
      ? this.data.filterStart
      : rangeStart;
    const defaultFilterEnd = this.data.filterEnd && DateUtil.isValidDate(this.data.filterEnd)
      ? this.data.filterEnd
      : today;
    const normalized = this.normalizeDateRange(defaultFilterStart, defaultFilterEnd);
    const filtered = this.buildRecordGroups(records, normalized.start, normalized.end);

    this.setData({
      rangeText,
      stats,
      recordGroups: filtered.recordGroups,
      filterStart: normalized.start,
      filterEnd: normalized.end,
      filterHint: filtered.filterHint
    });
  },

  buildRecordGroups(records, startDate, endDate) {
    const filteredRecords = records.filter(record => {
      if (startDate && record.date < startDate) return false;
      if (endDate && record.date > endDate) return false;
      return true;
    });

    const recordGroups = [];
    const groupMap = {};
    filteredRecords.forEach(record => {
      if (!groupMap[record.date]) {
        groupMap[record.date] = {
          date: record.date,
          itemMap: {},
          items: []
        };
        recordGroups.push(groupMap[record.date]);
      }

      const songName = (record.song || '未命名曲目').trim() || '未命名曲目';
      if (!groupMap[record.date].itemMap[songName]) {
        groupMap[record.date].itemMap[songName] = {
          id: `${record.date}_${songName}`,
          song: songName,
          duration: 0,
          sessions: 0,
          notes: '',
          noteCount: 0,
          createTimes: []
        };
        groupMap[record.date].items.push(groupMap[record.date].itemMap[songName]);
      }

      const agg = groupMap[record.date].itemMap[songName];
      agg.duration += (record.duration || 0);
      agg.sessions += (record.repeatCount || 1);
      if (record.notes) {
        agg.noteCount += 1;
        if (!agg.notes) {
          agg.notes = record.notes;
        }
      }
      if (record.createTime) {
        agg.createTimes.push(record.createTime);
      }
    });

    recordGroups.forEach(group => {
      group.items.forEach(item => {
        const sorted = (item.createTimes || []).slice().sort((a, b) => a.localeCompare(b));
        const first = sorted[0] ? this.formatRecordTime(sorted[0]) : '--:--';
        const last = sorted[sorted.length - 1] ? this.formatRecordTime(sorted[sorted.length - 1]) : '--:--';
        item.timeLabel = sorted.length > 1 ? `${first} - ${last}` : last;
        item.durationLabel = `时长 ${item.duration} 分钟`;
        item.repeatLabel = `遍数 ${item.sessions} 遍`;
        item.notesLabel = item.noteCount > 1 ? `等 ${item.noteCount} 条笔记` : '';
      });

      group.items.sort((a, b) => {
        const aLast = (a.createTimes || []).slice().sort((x, y) => y.localeCompare(x))[0] || '';
        const bLast = (b.createTimes || []).slice().sort((x, y) => y.localeCompare(x))[0] || '';
        return bLast.localeCompare(aLast);
      });

      delete group.itemMap;
    });

    const dayCount = new Set(filteredRecords.map(record => record.date)).size;
    const totalSessions = filteredRecords.reduce((sum, record) => sum + (record.repeatCount || 1), 0);
    const totalMinutes = filteredRecords.reduce((sum, record) => sum + (record.duration || 0), 0);
    const filterHint = filteredRecords.length === 0
      ? '当前范围内没有练习记录'
      : `筛选到 ${totalSessions} 次练习，覆盖 ${dayCount} 天，累计 ${totalMinutes} 分钟`;

    return { recordGroups, filterHint };
  },

  normalizeDateRange(startDate, endDate) {
    if (!startDate && !endDate) {
      return { start: '', end: '' };
    }
    if (startDate && !endDate) {
      return { start: startDate, end: startDate };
    }
    if (!startDate && endDate) {
      return { start: endDate, end: endDate };
    }
    if (DateUtil.compareDates(startDate, endDate) > 0) {
      return { start: endDate, end: startDate };
    }
    return { start: startDate, end: endDate };
  },

  onFilterStartChange(e) {
    const value = e.detail.value;
    const normalized = this.normalizeDateRange(value, this.data.filterEnd);
    const filtered = this.buildRecordGroups(CheckinManager.getAllRecords(), normalized.start, normalized.end);
    this.setData({
      filterStart: normalized.start,
      filterEnd: normalized.end,
      recordGroups: filtered.recordGroups,
      filterHint: filtered.filterHint
    });
  },

  onFilterEndChange(e) {
    const value = e.detail.value;
    const normalized = this.normalizeDateRange(this.data.filterStart, value);
    const filtered = this.buildRecordGroups(CheckinManager.getAllRecords(), normalized.start, normalized.end);
    this.setData({
      filterStart: normalized.start,
      filterEnd: normalized.end,
      recordGroups: filtered.recordGroups,
      filterHint: filtered.filterHint
    });
  },

  onResetFilter() {
    const today = DateUtil.getToday();
    const userInfo = UserManager.getUserInfo();
    const joinDate = userInfo && userInfo.joinDate ? userInfo.joinDate : today;
    const records = CheckinManager.getAllRecords();
    const startDate = records.length > 0 ? records[records.length - 1].date : joinDate;
    const rangeStart = startDate < joinDate ? startDate : joinDate;
    const filtered = this.buildRecordGroups(records, rangeStart, today);
    this.setData({
      filterStart: rangeStart,
      filterEnd: today,
      recordGroups: filtered.recordGroups,
      filterHint: filtered.filterHint
    });
  },

  buildTimeBuckets(records) {
    const buckets = [
      { label: '清晨 5-9点', start: 5, end: 9, count: 0 },
      { label: '上午 9-12点', start: 9, end: 12, count: 0 },
      { label: '下午 12-18点', start: 12, end: 18, count: 0 },
      { label: '晚上 18-23点', start: 18, end: 23, count: 0 },
      { label: '深夜 23-5点', start: 23, end: 29, count: 0 }
    ];

    records.forEach(record => {
      if (!record.createTime) return;
      const date = new Date(record.createTime);
      const hour = date.getHours();
      let normalizedHour = hour;
      if (hour < 5) {
        normalizedHour = hour + 24;
      }
      const bucket = buckets.find(item => normalizedHour >= item.start && normalizedHour < item.end);
      if (bucket) {
        bucket.count += (record.repeatCount || 1);
      }
    });

    const maxCount = Math.max(...buckets.map(item => item.count), 0);
    return buckets.map(item => ({
      ...item,
      percent: maxCount > 0 ? Math.round((item.count / maxCount) * 100) : 0
    }));
  },

  buildNewSongs(records) {
    const songFirstMap = {};
    records.forEach(record => {
      const name = record.song || '未命名曲目';
      if (!songFirstMap[name] || record.date < songFirstMap[name]) {
        songFirstMap[name] = record.date;
      }
    });

    return Object.keys(songFirstMap)
      .map(name => ({ name, date: songFirstMap[name] }))
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 3);
  },

  formatRecordTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }
});
