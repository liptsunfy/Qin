const DateUtil = require('./dateUtil.js');
const Logger = require('./logger.js');

// 存储键名常量（保持对外导出不变）
const STORAGE_KEYS = {
  CHECKIN_RECORDS: 'checkin_records',
  USER_INFO: 'user_info'
};

// 基础存储方法
const Storage = {
  // 保存数据
  setItem(key, data) {
    try {
      wx.setStorageSync(key, data);
      return true;
    } catch (e) {
      Logger.error('Storage.setItem', '保存数据失败:', key, e);
      return false;
    }
  },

  // 读取数据
  getItem(key, defaultValue = null) {
    try {
      const value = wx.getStorageSync(key);
      // wx.getStorageSync 在 key 不存在时返回 ''
      return value !== '' ? value : defaultValue;
    } catch (e) {
      Logger.error('Storage.getItem', '读取数据失败:', key, e);
      return defaultValue;
    }
  },

  // 异步读取数据
  getItemAsync(key, defaultValue = null) {
    return new Promise((resolve) => {
      try {
        wx.getStorage({
          key,
          success: (res) => {
            const value = res && Object.prototype.hasOwnProperty.call(res, 'data') ? res.data : '';
            resolve(value !== '' ? value : defaultValue);
          },
          fail: () => resolve(defaultValue)
        });
      } catch (e) {
        Logger.error('Storage.getItemAsync', '读取数据失败:', key, e);
        resolve(defaultValue);
      }
    });
  },

  // 删除数据
  removeItem(key) {
    try {
      wx.removeStorageSync(key);
      return true;
    } catch (e) {
      Logger.error('Storage.removeItem', '删除数据失败:', key, e);
      return false;
    }
  },

  // 清空所有数据
  clearAll() {
    try {
      wx.clearStorageSync();
      return true;
    } catch (e) {
      Logger.error('Storage.clearAll', '清空数据失败:', e);
      return false;
    }
  }
};

// 打卡记录管理
const CheckinManager = {
  // 保存打卡记录 - 支持多次打卡
  saveRecord(record) {
    const records = this.getAllRecords();
    
    // 为记录生成唯一ID
    const recordWithId = {
      ...record,
      id: this.generateRecordId(record.date),
      createTime: new Date().toISOString(),
      updateTime: new Date().toISOString()
    };
    
    // 添加到记录数组
    records.push(recordWithId);
    
    // 按日期和时间倒序排序
    records.sort((a, b) => {
      if (a.date !== b.date) {
        return b.date.localeCompare(a.date);
      }
      return b.createTime.localeCompare(a.createTime);
    });
    
    return Storage.setItem(STORAGE_KEYS.CHECKIN_RECORDS, records);
  },

  // 生成记录ID
  generateRecordId(date) {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 10000);
    return `${date}_${timestamp}_${random}`;
  },

  // 获取所有打卡记录
  getAllRecords() {
    return Storage.getItem(STORAGE_KEYS.CHECKIN_RECORDS, []);
  },

  // 异步获取所有打卡记录
  getAllRecordsAsync() {
    return Storage.getItemAsync(STORAGE_KEYS.CHECKIN_RECORDS, []);
  },

  // 从已有记录中过滤指定日期
  getRecordsByDateFromRecords(records, date) {
    if (!Array.isArray(records)) return [];
    return records.filter(record => record.date === date);
  },

  // 从已有记录中过滤指定日期范围
  getRecordsByRangeFromRecords(records, startDate, endDate) {
    if (!Array.isArray(records)) return [];
    return records.filter(record => record.date >= startDate && record.date <= endDate);
  },

  // 从已有记录中计算指定日期的总练习时长
  getTotalDurationByDateFromRecords(records, date) {
    const dayRecords = this.getRecordsByDateFromRecords(records, date);
    return dayRecords.reduce((total, record) => total + (record.duration || 0), 0);
  },

  // 获取指定日期的所有记录
  getRecordsByDate(date) {
    const records = this.getAllRecords();
    return this.getRecordsByDateFromRecords(records, date);
  },

  // 获取指定日期的最后一条记录（保持兼容性）
  getRecordByDate(date) {
    const records = this.getRecordsByDate(date);
    return records.length > 0 ? records[0] : null;
  },

  // 获取指定日期的总练习时长
  getTotalDurationByDate(date) {
    const records = this.getAllRecords();
    return this.getTotalDurationByDateFromRecords(records, date);
  },

  // 获取日期范围内的记录
  getRecordsByRange(startDate, endDate) {
    const records = this.getAllRecords();
    return this.getRecordsByRangeFromRecords(records, startDate, endDate);
  },

  // 获取最近N天的记录
  getRecentRecords(days = 30) {
    const endDate = this.getToday();
    const startDate = this.getDateDaysAgo(days - 1);
    
    return this.getRecordsByRange(startDate, endDate);
  },

  // 删除指定记录
  deleteRecordById(recordId) {
    const records = this.getAllRecords();
    const newRecords = records.filter(record => record.id !== recordId);
    return Storage.setItem(STORAGE_KEYS.CHECKIN_RECORDS, newRecords);
  },

  // 删除指定日期的所有记录
  deleteAllRecordsByDate(date) {
    const records = this.getAllRecords();
    const newRecords = records.filter(record => record.date !== date);
    return Storage.setItem(STORAGE_KEYS.CHECKIN_RECORDS, newRecords);
  },

  // 获取今天日期
  getToday() {
    return DateUtil.getToday();
  },

  // 获取N天前的日期
  getDateDaysAgo(days) {
    return DateUtil.addDays(DateUtil.getToday(), -days);
  }
};

// 用户信息管理
const UserManager = {
  // 获取用户信息
  getUserInfo() {
    const defaultInfo = {
      nickname: '古琴爱好者',
      avatar: '/images/default-avatar.png',
      joinDate: CheckinManager.getToday(),
      signature: '日习一操，功不唐捐'
    };
    
    return Storage.getItem(STORAGE_KEYS.USER_INFO, defaultInfo);
  },

  // 异步获取用户信息
  async getUserInfoAsync() {
    const defaultInfo = {
      nickname: '古琴爱好者',
      avatar: '/images/default-avatar.png',
      joinDate: CheckinManager.getToday(),
      signature: '日习一操，功不唐捐'
    };

    return Storage.getItemAsync(STORAGE_KEYS.USER_INFO, defaultInfo);
  },

  // 更新用户信息
  updateUserInfo(info) {
    const currentInfo = this.getUserInfo();
    const newInfo = { ...currentInfo, ...info };
    return Storage.setItem(STORAGE_KEYS.USER_INFO, newInfo);
  },

  // 更新头像
  updateAvatar(avatarPath) {
    const currentInfo = this.getUserInfo();

    // 若新旧一致，直接返回，避免重复写入
    if (currentInfo.avatar === avatarPath) {
      return true;
    }

    // 仅在旧头像为 saveFile 产生的 wxfile:// 路径时尝试清理
    const oldAvatar = currentInfo.avatar;
    if (oldAvatar && typeof oldAvatar === 'string' && oldAvatar.startsWith('wxfile://') && oldAvatar !== avatarPath) {
      try {
        wx.removeSavedFile({
          filePath: oldAvatar,
          // 删除失败不影响主流程（例如文件不存在、权限问题等）
          fail: () => {}
        });
      } catch (e) {
        // ignore
      }
    }

    currentInfo.avatar = avatarPath;
    return Storage.setItem(STORAGE_KEYS.USER_INFO, currentInfo);
  }
};

// 统计计算功能
const StatsManager = {
  // 计算总天数（有练习的天数）
  getTotalDays() {
    const records = CheckinManager.getAllRecords();
    return this.getTotalDaysFromRecords(records);
  },

  getTotalDaysFromRecords(records) {
    const uniqueDates = new Set((records || []).map(r => r.date));
    return uniqueDates.size;
  },

  // 计算总时长（分钟）
  getTotalDuration() {
    const records = CheckinManager.getAllRecords();
    return this.getTotalDurationFromRecords(records);
  },

  getTotalDurationFromRecords(records) {
    return (records || []).reduce((total, record) => total + (record.duration || 0), 0);
  },

  // 计算总小时数
  getTotalHours() {
    const totalMinutes = this.getTotalDuration();
    return Math.round(totalMinutes / 60 * 10) / 10;
  },

  getTotalHoursFromRecords(records) {
    const totalMinutes = this.getTotalDurationFromRecords(records);
    return Math.round(totalMinutes / 60 * 10) / 10;
  },

  // 计算连续打卡天数
  getContinuousDays() {
    const records = CheckinManager.getAllRecords();
    return this.getContinuousDaysFromRecords(records);
  },

  getContinuousDaysFromRecords(records) {
    // 用 Set 做 membership 判断，避免 dates.includes 导致 O(n^2)
    const uniqueDates = [...new Set((records || []).map(r => r.date))];
    const dateSet = new Set(uniqueDates);
    
    if (dateSet.size === 0) return 0;
    
    const today = CheckinManager.getToday();
    let continuous = 0;
    let checkDate = today;
    
    const getPrevDate = (dateStr) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() - 1);
      const y = d.getFullYear();
      const m = (d.getMonth() + 1).toString().padStart(2, '0');
      const dd = d.getDate().toString().padStart(2, '0');
      return `${y}-${m}-${dd}`;
    };

    while (dateSet.has(checkDate)) {
      continuous += 1;
      checkDate = getPrevDate(checkDate);
    }
    
    return continuous;
  },

  // 获取月度统计数据 - 支持多次打卡
  getMonthlyStats(year, month) {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0);
    const endDateStr = `${year}-${month.toString().padStart(2, '0')}-${endDate.getDate().toString().padStart(2, '0')}`;
    
    const records = CheckinManager.getRecordsByRange(startDate, endDateStr);
    return this.getMonthlyStatsFromRecords(records);
  },

  getMonthlyStatsFromRecords(records) {
    const days = new Set((records || []).map(r => r.date)).size; // 有练习的天数
    const totalDuration = (records || []).reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalRecords = (records || []).reduce((sum, r) => sum + (r.repeatCount || 1), 0); // 总练习次数
    const avgDuration = days > 0 ? Math.round(totalDuration / days * 10) / 10 : 0;

    return {
      days,
      totalDuration,
      totalHours: Math.round(totalDuration / 60 * 10) / 10,
      totalRecords,
      avgDuration
    };
  },

  // 获取时间段统计数据 - 支持多次打卡
  getRangeStats(startDate, endDate) {
    const records = CheckinManager.getRecordsByRange(startDate, endDate);
    const days = new Set(records.map(r => r.date)).size; // 有练习的天数
    const totalDuration = records.reduce((sum, r) => sum + (r.duration || 0), 0);
    const totalHours = Math.round(totalDuration / 60 * 10) / 10;
    const totalRecords = records.reduce((sum, r) => sum + (r.repeatCount || 1), 0); // 总练习次数
    const avgDuration = days > 0 ? Math.round(totalDuration / days * 10) / 10 : 0;
    
    return {
      startDate,
      endDate,
      days,
      totalDuration,
      totalHours,
      totalRecords,
      avgDuration,
      records
    };
  },

  // 获取曲目统计
  getSongStats() {
    const records = CheckinManager.getAllRecords();
    const songStats = {};
    
    records.forEach(record => {
      const song = record.song || '未命名曲目';
      if (!songStats[song]) {
        songStats[song] = {
          name: song,
          count: 0,
          totalDuration: 0,
          lastPractice: ''
        };
      }
      
      songStats[song].count += (record.repeatCount || 1);
      songStats[song].totalDuration += record.duration || 0;
      
      // 更新最后练习时间
      if (!songStats[song].lastPractice || record.date > songStats[song].lastPractice) {
        songStats[song].lastPractice = record.date;
      }
    });
    
    // 转换为数组并排序
    const statsArray = Object.values(songStats);
    
    // 按练习次数降序排序
    statsArray.sort((a, b) => {
      if (b.count !== a.count) {
        return b.count - a.count;
      }
      return b.totalDuration - a.totalDuration;
    });
    
    return statsArray;
  },

  // 获取最常练习的曲目（前5名）
  getTopSongs(limit = 5) {
    const allSongs = this.getSongStats();
    return allSongs.slice(0, limit);
  },

  // 获取总练习过的曲目数量
  getTotalSongsCount() {
    const records = CheckinManager.getAllRecords();
    const uniqueSongs = new Set(records.map(r => r.song || '未命名曲目'));
    return uniqueSongs.size;
  },

  // 获取练习时间最长的曲目
  getLongestPracticeSongs(limit = 3) {
    const allSongs = this.getSongStats();
    
    // 按总时长降序排序
    const sortedByDuration = [...allSongs].sort((a, b) => b.totalDuration - a.totalDuration);
    
    return sortedByDuration.slice(0, limit);
  },

  // 获取最近练习的曲目
  getRecentSongs(days = 7, limit = 5) {
    const records = CheckinManager.getRecentRecords(days);
    const recentSongs = {};
    
    records.forEach(record => {
      const song = record.song || '未命名曲目';
      if (!recentSongs[song]) {
        recentSongs[song] = {
          name: song,
          count: 0,
          totalDuration: 0,
          lastPractice: record.date
        };
      }
      
      recentSongs[song].count += (record.repeatCount || 1);
      recentSongs[song].totalDuration += record.duration || 0;
    });
    
    const statsArray = Object.values(recentSongs);
    
    // 按最后练习时间降序排序
    statsArray.sort((a, b) => b.lastPractice.localeCompare(a.lastPractice));
    
    return statsArray.slice(0, limit);
  }
};

module.exports = {
  Storage,
  CheckinManager,
  UserManager,
  StatsManager,
  STORAGE_KEYS
};
