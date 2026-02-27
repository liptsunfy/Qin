const storage = require('../../utils/storage.js');
const DateUtil = require('../../utils/dateUtil.js');
const EncourageManager = require('../../utils/encourage.js');

const { CheckinManager, StatsManager } = storage;

Page({
  data: {
    // 当前日期信息
    today: '',
    weekday: '',
    encouragePhrase: '',
    
    // 打卡状态
    hasCheckedIn: false,
    todayRecords: [], // 今天的所有记录
    todayTotalDuration: 0,
    todayTotalSessions: 0,
    continuousDays: 0,
    
    // 打卡表单
    duration: 15,
    customDuration: '',
    repeatCount: 1,
    customRepeatCount: '',
    song: '',
    customSong: '',
    notes: '',
    selectedSongIndex: -1,
    frequentSongs: [], // 常用曲目（自动生成）,
    displaySongs: [],
    
    // 本周日历
    weekDates: [],
    weekRecords: [],
    
    // 预设数据
    presetSongs: ['基本功', '仙翁操', '秋风词', '阳关三叠', '酒狂', '平沙落雁'],
    presetDurations: [15, 30, 45]
  },

  onLoad() {
    this.loadData();
  },

  onShow() {
    this.loadData();
  },

  // 加载数据
  async loadData() {
    const today = DateUtil.getToday();
    const weekday = DateUtil.getWeekday(today);
    const encouragePhrase = EncourageManager.getRandomPhrase();

    const allRecords = await CheckinManager.getAllRecordsAsync();

    // 获取今天所有记录
    const todayRecords = CheckinManager.getRecordsByDateFromRecords(allRecords, today);
    const hasCheckedIn = todayRecords.length > 0;
    const todayTotalDuration = CheckinManager.getTotalDurationByDateFromRecords(allRecords, today);
    const todayTotalSessions = todayRecords.reduce((sum, r) => sum + (r.repeatCount || 1), 0);

    // 计算连续打卡天数
    const continuousDays = StatsManager.getContinuousDaysFromRecords(allRecords);
    
    // 获取本周数据
    const weekDates = DateUtil.getWeekDates();
    const weekRecords = weekDates.map(date => {
      const records = CheckinManager.getRecordsByDateFromRecords(allRecords, date);
      const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
      const totalSessions = records.reduce((sum, r) => sum + (r.repeatCount || 1), 0);
      return {
        date,
        hasRecord: records.length > 0,
        duration: totalDuration,
        recordCount: totalSessions,
        formattedDate: DateUtil.formatDate(date, 'MM-DD'),
        weekday: DateUtil.getWeekday(date)
      };
    });
    
    
    // 常用曲目：按历史记录次数排序（排除空曲目）
    const songCountMap = {};
    allRecords.forEach(r => {
      const name = (r.song || '').trim();
      if (!name) return;
      songCountMap[name] = (songCountMap[name] || 0) + (r.repeatCount || 1);
    });
    const frequentSongs = Object.keys(songCountMap)
      .map(name => ({ name, count: songCountMap[name] }))
      .sort((a, b) => b.count - a.count);

    const defaultSongs = (this.data.presetSongs || []).slice(0, 6);
    const displaySongs = [];
    frequentSongs.forEach((item) => {
      if (displaySongs.length < 6 && !displaySongs.includes(item.name)) {
        displaySongs.push(item.name);
      }
    });
    defaultSongs.forEach((name) => {
      if (displaySongs.length < 6 && !displaySongs.includes(name)) {
        displaySongs.push(name);
      }
    });

    this.setData({
      today,
      weekday,
      encouragePhrase,
      hasCheckedIn,
      todayRecords,
      todayTotalDuration,
      todayTotalSessions,
      continuousDays,
      weekDates,
      weekRecords,
      frequentSongs,
      displaySongs,
      duration: 15,
      customDuration: '',
      repeatCount: 1,
      customRepeatCount: ''
    });
  },

  // 选择预设时长
  onDurationTap(e) {
    const duration = parseInt(e.currentTarget.dataset.duration);
    this.setData({
      duration,
      customDuration: ''
    });
  },

  // 自定义时长输入
  onCustomDurationInput(e) {
    let value = e.detail.value;
    if (value) {
      let num = parseInt(value);
      if (isNaN(num)) num = 1;
      if (num < 1) num = 1;
      if (num > 999) num = 999;
      value = num.toString();
    }
    
    this.setData({
      customDuration: value,
      duration: value ? parseInt(value) : 15
    });
  },

  // 练习遍数输入
  onRepeatCountInput(e) {
    let value = e.detail.value;
    if (value) {
      let num = parseInt(value);
      if (isNaN(num)) num = 1;
      if (num < 1) num = 1;
      if (num > 99) num = 99;
      value = num.toString();
    }

    this.setData({
      customRepeatCount: value,
      repeatCount: value ? parseInt(value) : 1
    });
  },

  // 选择预设曲目
  onSongTap(e) {
    const song = e.currentTarget.dataset.song;
    if (!song) return;
    const idx = this.data.displaySongs ? this.data.displaySongs.indexOf(song) : -1;
    this.setData({
      song,
      customSong: '',
      selectedSongIndex: idx
    });
  },

  // 自定义曲目输入
  onCustomSongInput(e) {
    const song = e.detail.value;
    this.setData({
      song,
      customSong: song,
      selectedSongIndex: -1
    });
  },

  // 输入练习笔记
  onNotesInput(e) {
    let notes = e.detail.value;
    if (notes.length > 200) {
      notes = notes.substring(0, 200);
      wx.showToast({
        title: '最多200字',
        icon: 'none'
      });
    }
    this.setData({ notes });
  },

  // 提交打卡
  onCheckinSubmit() {
    const { duration, song, notes, repeatCount } = this.data;
    
    if (!duration || duration < 1) {
      wx.showToast({
        title: '请选择练习时长',
        icon: 'none'
      });
      return;
    }
    
    const record = {
      date: DateUtil.getToday(),
      duration: parseInt(duration),
      repeatCount: Math.max(1, parseInt(repeatCount) || 1),
      song: song || '未命名曲目',
      notes: notes || ''
    };
    
    const success = CheckinManager.saveRecord(record);
    
    if (success) {
      wx.showToast({
        title: '打卡成功！',
        icon: 'success'
      });
      
      // 显示鼓励语
      setTimeout(() => {
        const completionPhrase = EncourageManager.getCompletionPhrase(duration);
        wx.showModal({
          title: '🎉 完成打卡',
          content: completionPhrase,
          showCancel: false,
          confirmText: '继续努力'
        });
      }, 500);
      
      // 重新加载数据
      setTimeout(() => {
        this.loadData();
        // 重置表单
        this.setData({
          song: '',
          customSong: '',
          notes: '',
          selectedSongIndex: -1,
          repeatCount: 1,
          customRepeatCount: ''
        });
      }, 1000);
    } else {
      wx.showToast({
        title: '打卡失败',
        icon: 'error'
      });
    }
  },

  // 格式化记录时间
  formatRecordTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 滚动到表单
  scrollToForm() {
    wx.pageScrollTo({
      selector: '#checkinForm',
      duration: 300
    });
  },

  // 删除今日某条记录
  onDeleteTodayRecord(e) {
    const recordId = e.currentTarget.dataset.id;
    const record = this.data.todayRecords.find(item => item.id === recordId);
    
    if (!record) return;
    
    wx.showModal({
      title: '确认删除',
      content: `确定要删除这条练习记录吗？\n${record.song} - ${record.duration}分钟`,
      success: (res) => {
        if (res.confirm) {
          CheckinManager.deleteRecordById(recordId);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.loadData();
        }
      }
    });
  },

  // 查看详细记录
  onViewRecord() {
    wx.navigateTo({
      url: '/pages/profile/profile?tab=records'
    });
  }
});
