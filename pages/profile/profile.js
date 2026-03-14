const storage = require('../../utils/storage.js');
const DateUtil = require('../../utils/dateUtil.js');
const SongStats = require('./profileSongStats.js');
const { solarToLunar } = require('../../utils/lunar.js');
const { getFestivalInfo } = require('../../utils/festival.js');

// 注：Storage / STORAGE_KEYS 用于直接落盘覆盖记录（例如按曲目批量删除）
const { UserManager, CheckinManager, StatsManager, Storage, STORAGE_KEYS } = storage;

function getDprSafe() {
  try {
    if (wx.getWindowInfo) {
      const win = wx.getWindowInfo();
      return win && win.pixelRatio ? Math.min(win.pixelRatio, 3) : 1;
    }
    if (wx.getSystemInfoSync) {
      const sys = wx.getSystemInfoSync();
      return sys && sys.pixelRatio ? Math.min(sys.pixelRatio, 3) : 1;
    }
  } catch (e) {
    // ignore
  }
  return 1;
}

function createCompatCtx(ctx) {
  // 将 Canvas 2D 新接口（标准 2d ctx）适配为旧的 wx CanvasContext 方法集合
  return {
    _ctx: ctx,
    drawImage(img, x, y, w, h) {
      // 标准 2d ctx.drawImage
      if (typeof w === 'number' && typeof h === 'number') ctx.drawImage(img, x, y, w, h);
      else ctx.drawImage(img, x, y);
    },
    setFillStyle(v) { ctx.fillStyle = v; },
    setStrokeStyle(v) { ctx.strokeStyle = v; },
    setLineWidth(v) { ctx.lineWidth = v; },
    setFontSize(px) { ctx.font = `${px}px sans-serif`; },
    setTextAlign(v) { ctx.textAlign = v; },
    fillRect(x, y, w, h) { ctx.fillRect(x, y, w, h); },
    strokeRect(x, y, w, h) { ctx.strokeRect(x, y, w, h); },
    fillText(t, x, y) { ctx.fillText(t, x, y); },
    beginPath() { ctx.beginPath(); },
    moveTo(x, y) { ctx.moveTo(x, y); },
    lineTo(x, y) { ctx.lineTo(x, y); },
    quadraticCurveTo(cpx, cpy, x, y) { ctx.quadraticCurveTo(cpx, cpy, x, y); },
    closePath() { ctx.closePath(); },
    fill() { ctx.fill(); },
    stroke() { ctx.stroke(); },
    drawImage(img, x, y, w, h) { ctx.drawImage(img, x, y, w, h); },
    measureText(t) { return ctx.measureText(t); }
  };
}

Page({
  data: {
    // 用户信息
    userInfo: {},
    showEditModal: false,
    editingField: '',
    editValue: '',
    
    // 统计数据
    totalDays: 0,
    totalHours: 0,
    continuousDays: 0,
    
    // 曲目统计
    songStats: [], // 新增：曲目统计数据
    showSongStats: false, // 新增：控制曲目统计显示
    
    // 日历数据
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    calendarCells: [],
    monthRecords: {},
    
    // 月度统计
    monthlyStats: {
      days: 0,
      totalHours: 0,
      avgDuration: 0
    },
    
    // 分享功能（单日）
    showShareModal: false,
    shareDate: '',
    shareStats: null,
    shareContent: '',
    
    // 图文分享
    showShareImageModal: false,
    shareImagePath: '',
    isGeneratingImage: false,
    
    // 赞赏功能
    showDonateModal: false,
    
    // 日历点选日期记录展示
    selectedDate: '',
    selectedDateRecords: [],
    selectedDateTotalDuration: 0,
    selectedDateSessions: 0,
    selectedDateCheckinTime: '--:--',
    selectedDateHasRecords: false,

    // canvas：用于图文分享，按设备像素比提升清晰度
    canvasDpr: 1,
    canvasCssWidth: 600,
    // 海报高度：包含趋势 + 二维码区 + 底部落款，避免底部裁切
    canvasCssHeight: 1120
  },

  onLoad(options) {
    this.initShareCanvas2D();

    this.loadAllData();
    
    if (options.tab === 'records') {
      this.showAllRecords();
    } else if (options.tab === 'songs') {
      this.showSongStatsPage();
    }
  },

  onShow() {
    this.loadAllData();
  },

  // 初始化 Canvas 2D（同层渲染）。可重复调用；内部会复用已创建的 canvas/ctx
  initShareCanvas2D(cb) {
    const dpr = getDprSafe();
    const cssW = 600;
    // 海报包含趋势 + 二维码区，需更高画布避免底部被裁切
    const cssH = 1120;

    // 先同步更新数据，确保 WXML 有正确的 CSS 尺寸
    this.setData({
      canvasDpr: dpr,
      canvasCssWidth: cssW,
      canvasCssHeight: cssH
    });

    // 已初始化则直接回调
    if (this._shareCanvas && this._shareCtxCompat) {
      if (typeof cb === 'function') cb(this._shareCanvas, this._shareCtxCompat);
      return;
    }

    // 通过 node 获取 Canvas 实例
    wx.createSelectorQuery()
      .in(this)
      .select('#shareCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res && res[0] && res[0].node;
        if (!canvas) {
          if (typeof cb === 'function') cb(null, null);
          return;
        }

        canvas.width = Math.floor(cssW * dpr);
        canvas.height = Math.floor(cssH * dpr);

        const rawCtx = canvas.getContext('2d');
        // 以 CSS 像素为绘制单位
        rawCtx.scale(dpr, dpr);

        this._shareCanvas = canvas;
        this._shareCtxCompat = createCompatCtx(rawCtx);

        if (typeof cb === 'function') cb(this._shareCanvas, this._shareCtxCompat);
      });
  },

  // 确保分享画布已就绪
  ensureShareCanvasReady(cb) {
    if (this._shareCanvas && this._shareCtxCompat) {
      cb(this._shareCanvas, this._shareCtxCompat);
      return;
    }
    this.initShareCanvas2D(cb);
  },

  // 加载画布图片资源（用于小程序码/公众号码等）
  loadCanvasImage(canvas, src) {
    return new Promise((resolve, reject) => {
      try {
        const img = canvas.createImage();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('image load failed'));
        img.src = src;
      } catch (e) {
        reject(e);
      }
    });
  },

  // 加载用户数据
  async loadUserData() {
    const userInfo = await UserManager.getUserInfoAsync();
    this.setData({ userInfo });
  },

  // 加载统计数据
  loadStats(records) {
    const sourceRecords = records || CheckinManager.getAllRecords();
    const totalDays = StatsManager.getTotalDaysFromRecords(sourceRecords);
    const totalHours = StatsManager.getTotalHoursFromRecords(sourceRecords);
    const continuousDays = StatsManager.getContinuousDaysFromRecords(sourceRecords);
    
    this.setData({
      totalDays,
      totalHours,
      continuousDays
    });
  },

  // 新增：加载曲目统计
  loadSongStats(records) {
    const sourceRecords = records || CheckinManager.getAllRecords();
    const songStats = SongStats.computeSongStats(sourceRecords);
    this.setData({ songStats });
  },

  // 异步统一加载用户与打卡数据
  async loadAllData() {
    const [userInfo, records] = await Promise.all([
      UserManager.getUserInfoAsync(),
      CheckinManager.getAllRecordsAsync()
    ]);

    this.setData({ userInfo });
    this.loadStats(records);
    this.loadCalendarData(records);
    this.loadSongStats(records);
  },

  // 显示曲目统计页面
  showSongStatsPage() {
    this.setData({
      showSongStats: true
    });
  },

  // 隐藏曲目统计
  hideSongStats() {
    this.setData({
      showSongStats: false
    });
  },

  // 查看某曲目的详细记录
  onViewSongDetail(e) {
    const songName = e.currentTarget.dataset.song;
    const songData = this.data.songStats.find(song => song.name === songName);
    
    if (!songData) return;

    const practiceCount = songData.count || 0;
    const totalDuration = songData.totalDuration || 0;
    const totalHours = songData.totalHours || 0;
    const recordDates = (songData.records || []).map(record => record.date);
    const checkinCount = new Set(recordDates).size;
    
    wx.showModal({
      title: `${songName} - 练习详情`,
      content: `练习次数: ${practiceCount}次\n练习总时长: ${totalDuration}分钟（${totalHours}小时）\n打卡次数: ${checkinCount}天\n平均时长: ${songData.avgDuration}分钟/次\n首次练习: ${songData.firstDate}\n最近练习: ${songData.lastDate}`,
      showCancel: false,
      confirmText: '关闭',
      success: (res) => {
        if (res.confirm) {
          this.showSongRecords(songName);
        }
      }
    });
  },

  // 显示某曲目的所有记录
  showSongRecords(songName) {
    const records = CheckinManager.getAllRecords()
      .filter(record => record.song === songName)
      .sort((a, b) => b.date.localeCompare(a.date));
    
    wx.showModal({
      title: `${songName} 的练习记录`,
      content: this.formatSongRecordsContent(records),
      showCancel: true,
      cancelText: '关闭',
      confirmText: '删除此曲目所有记录',
      success: (res) => {
        if (res.confirm) {
          this.deleteSongRecords(songName);
        }
      }
    });
  },

  // 格式化曲目记录内容
  formatSongRecordsContent(records) {
    return SongStats.formatSongRecordsContent(records);
  },

  // 删除某曲目的所有记录
  deleteSongRecords(songName) {
    wx.showModal({
      title: '确认删除',
      content: `确定要删除曲目"${songName}"的所有${this.data.songStats.find(s => s.name === songName)?.count || 0}次练习吗？此操作不可恢复。`,
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          const records = CheckinManager.getAllRecords();
          const newRecords = records.filter(record => record.song !== songName);
          
          Storage.setItem(STORAGE_KEYS.CHECKIN_RECORDS, newRecords);
          
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          
          // 重新加载数据
          this.loadAllData();
        }
      }
    });
  },

  // 加载日历数据
  loadCalendarData(records) {
    const { currentYear, currentMonth } = this.data;
    
    const monthStr = currentMonth.toString().padStart(2, '0');
    const startDate = `${currentYear}-${monthStr}-01`;
    const endDate = new Date(currentYear, currentMonth, 0);
    const endDateStr = `${currentYear}-${monthStr}-${endDate.getDate().toString().padStart(2, '0')}`;
    
    const sourceRecords = records || CheckinManager.getAllRecords();
    const monthRangeRecords = CheckinManager.getRecordsByRangeFromRecords(sourceRecords, startDate, endDateStr);
    
    // 按日期聚合，兼容“同一天多次打卡”的数据模型
    // monthRecords[date] = { count, totalDuration, records: [...] }
    const monthRecords = {};
    monthRangeRecords.forEach((record) => {
      if (!record || !record.date) return;
      if (!monthRecords[record.date]) {
        monthRecords[record.date] = {
          count: 0,
          totalDuration: 0,
          records: []
        };
      }
      monthRecords[record.date].count += (record.repeatCount || 1);
      monthRecords[record.date].totalDuration += (record.duration || 0);
      monthRecords[record.date].records.push(record);
    });
    
    const monthlyStats = StatsManager.getMonthlyStatsFromRecords(monthRangeRecords);
    const calendarCells = this.generateCalendarCells(currentYear, currentMonth, monthRecords);
    
    this.setData({
      calendarCells,
      monthRecords,
      monthlyStats
    });
  },

  // 生成日历单元格
  generateCalendarCells(year, month, monthRecords) {
    const today = DateUtil.getToday();
    const monthStr = month.toString().padStart(2, '0');
    
    const firstDay = new Date(year, month - 1, 1);
    const firstDayOfWeek = firstDay.getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    
    const cells = [];
    
    for (let i = 0; i < firstDayOfWeek; i++) {
      cells.push({
        type: 'empty',
        day: '',
        dateStr: '',
        isToday: false,
        hasRecord: false
      });
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      const dayStr = day.toString().padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      const hasRecord = !!monthRecords[dateStr];
      const isToday = dateStr === today;
      
      cells.push({
        type: 'current',
        day: day,
        dateStr: dateStr,
        isToday: isToday,
        hasRecord: hasRecord
      });
    }
    
    const totalCells = cells.length;
    const remaining = 42 - totalCells;
    
    if (remaining > 0) {
      for (let i = 0; i < remaining; i++) {
        cells.push({
          type: 'empty',
          day: '',
          dateStr: '',
          isToday: false,
          hasRecord: false
        });
      }
    }
    
    return cells;
  },

  // 切换月份
  onMonthChange(e) {
    const direction = e.currentTarget.dataset.direction;
    const { currentYear, currentMonth } = this.data;
    
    const newDate = DateUtil.addMonths(currentYear, currentMonth, direction === 'next' ? 1 : -1);
    
    this.setData({
      currentYear: newDate.year,
      currentMonth: newDate.month
    }, () => {
      this.loadCalendarData();
    });
  },

  // 点击日历日期
  onDateTap(e) {
    const dateStr = e.currentTarget.dataset.date;
    if (!dateStr) return;

    const records = CheckinManager.getRecordsByDate(dateStr);
    const normalizedRecords = records
      .slice()
      .sort((a, b) => (b.createTime || '').localeCompare(a.createTime || ''))
      .map((record) => ({
        ...record,
        durationLabel: `时长：${record.duration || 0} 分钟`,
        repeatLabel: `遍数：${record.repeatCount || 1} 遍`,
        checkinTimeLabel: `打卡：${this.formatClockTime(record.createTime)}`
      }));
    const totalDuration = CheckinManager.getTotalDurationByDate(dateStr);
    const totalSessions = records.reduce((sum, record) => sum + (record.repeatCount || 1), 0);
    const latestTime = normalizedRecords[0] ? this.formatClockTime(normalizedRecords[0].createTime) : '--:--';
    const earliestTime = normalizedRecords.length > 0
      ? this.formatClockTime(normalizedRecords[normalizedRecords.length - 1].createTime)
      : '--:--';
    const checkinTime = normalizedRecords.length > 1 ? `${earliestTime} - ${latestTime}` : latestTime;

    // 以“页面内展示”为主（避免频繁弹窗），点击日期后在日历下方展示当日记录
    this.setData({
      selectedDate: dateStr,
      selectedDateRecords: normalizedRecords,
      selectedDateTotalDuration: totalDuration,
      selectedDateSessions: totalSessions,
      selectedDateCheckinTime: checkinTime,
      selectedDateHasRecords: records.length > 0
    });
  },

  formatClockTime(timestamp) {
    if (!timestamp) return '--:--';
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '--:--';
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  },

  // 删除某天的所有记录
  deleteAllRecordsByDate(date) {
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复',
      success: (res) => {
        if (res.confirm) {
          CheckinManager.deleteAllRecordsByDate(date);
          wx.showToast({
            title: '删除成功',
            icon: 'success'
          });
          this.loadAllData();
        }
      }
    });
  },

  // 编辑用户信息
  onEditUserInfo(e) {
    const field = e.currentTarget.dataset.field;
    const value = this.data.userInfo[field];
    
    this.setData({
      showEditModal: true,
      editingField: field,
      editValue: value
    });
  },

  // 关闭编辑模态框
  closeEditModal() {
    this.setData({
      showEditModal: false
    });
  },

  // 编辑输入处理
  onEditInput(e) {
    this.setData({
      editValue: e.detail.value
    });
  },

  // 保存编辑
  onSaveEdit() {
    const { editingField, editValue, userInfo } = this.data;
    
    const newInfo = { ...userInfo };
    newInfo[editingField] = editValue;
    
    UserManager.updateUserInfo(newInfo);
    
    this.setData({
      showEditModal: false,
      userInfo: newInfo
    });
    
    wx.showToast({
      title: '更新成功',
      icon: 'success'
    });
  },

  // 更换头像
  onChangeAvatar() {
    // chooseMedia 在较新的基础库可用；用于同时支持相册与拍照
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        success: (res) => {
          const list = (res && res.tempFiles) ? res.tempFiles : [];
          const tempFilePath = list[0] && list[0].tempFilePath;
          if (tempFilePath) {
            this.persistAndSetAvatar(tempFilePath);
          } else {
            wx.showToast({ title: '未获取到图片', icon: 'none' });
          }
        },
        fail: () => {
          // 用户取消或系统失败
          // 不提示“失败”，避免用户体验割裂
        }
      });
      return;
    }

    // 兼容旧基础库
    wx.chooseImage({
      count: 1,
      sourceType: ['album', 'camera'],
      success: (res) => {
        const list = (res && res.tempFilePaths) ? res.tempFilePaths : [];
        const tempFilePath = list[0];
        if (tempFilePath) {
          this.persistAndSetAvatar(tempFilePath);
        } else {
          wx.showToast({ title: '未获取到图片', icon: 'none' });
        }
      },
      fail: () => {
        // 用户取消或系统失败
      }
    });
  },

  // 将临时头像保存为本地文件，避免重启后临时路径失效
  persistAndSetAvatar(tempFilePath) {
    wx.showLoading({ title: '更新中...' });

    wx.saveFile({
      tempFilePath,
      success: (res) => {
        const savedFilePath = res.savedFilePath || tempFilePath;
        UserManager.updateAvatar(savedFilePath);
        // 用整对象 setData，避免部分机型/版本对深层路径更新不稳定
        const userInfo = { ...this.data.userInfo, avatar: savedFilePath };
        this.setData({ userInfo });
        wx.hideLoading();
        wx.showToast({ title: '头像更新成功', icon: 'success' });
      },
      fail: () => {
        // saveFile 失败时仍可使用本次会话内的临时路径
        UserManager.updateAvatar(tempFilePath);
        const userInfo = { ...this.data.userInfo, avatar: tempFilePath };
        this.setData({ userInfo });
        wx.hideLoading();
        wx.showToast({ title: '头像更新成功', icon: 'success' });
      }
    });
  },

  // 显示所有记录
  showAllRecords() {
    wx.navigateTo({
      url: '/pages/records/records'
    });
  },


  goWeeklyReview() {
    wx.navigateTo({
      url: '/pages/review/review?mode=week'
    });
  },

  goMonthlyReview() {
    wx.navigateTo({
      url: '/pages/review/review?mode=month'
    });
  },


  // 分享功能
  onShowShareModal() {
    wx.showActionSheet({
      itemList: ['文字分享', '图文分享'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.showTextShareModal();
        } else if (res.tapIndex === 1) {
          this.showImageShareModal();
        }
      }
    });
  },

  // 显示文字分享模态框
  showTextShareModal() {
    const today = DateUtil.getToday();
    this.setData({
      showShareModal: true,
      shareDate: today
    }, () => {
      this.updateShareStats();
    });
  },

  // 显示图文分享模态框
  showImageShareModal() {
    const today = DateUtil.getToday();
    this.setData({
      shareDate: today
    }, () => {
      this.updateShareStats(() => {
        this.generateShareImage();
      });
    });
  },

  // 关闭分享模态框
  closeShareModal() {
    this.setData({
      showShareModal: false
    });
  },

  // 更新分享统计
  updateShareStats(callback = null) {
    const { shareDate } = this.data;

    if (!shareDate) return;

    // 当日数据
    const dayRecords = CheckinManager.getRecordsByDate(shareDate) || [];
    const dayTotalMinutes = dayRecords.reduce((s, r) => s + (r.duration || 0), 0);
    const daySessions = dayRecords.reduce((sum, r) => sum + (r.repeatCount || 1), 0);

    // 近 7 天（含当日）
    const weekStart = DateUtil.addDays(shareDate, -6);
    const weekStats = StatsManager.getRangeStats(weekStart, shareDate);

    // 近 7 天：按日汇总（用于趋势微图）
    const weekDailyMinutes = [];
    for (let i = 0; i < 7; i++) {
      const d = DateUtil.addDays(weekStart, i);
      const rec = CheckinManager.getRecordsByDate(d) || [];
      const m = rec.reduce((s, r) => s + (r.duration || 0), 0);
      const sessions = rec.reduce((s, r) => s + (r.repeatCount || 1), 0);
      weekDailyMinutes.push({ date: d, minutes: m, sessions });
    }
    const weekSessions = weekDailyMinutes.reduce((s, it) => s + (it.sessions || 0), 0);
    const weekAvgDailyMinutes = Math.round((weekStats.totalDuration / 7) * 10) / 10;

    // 为画布和页面汇总一个 shareStats 对象（字段更贴合单日分享）
    const stats = {
      date: shareDate,
      dayRecords,
      daySessions,
      dayTotalMinutes,
      dayTotalHours: Math.round((dayTotalMinutes / 60) * 10) / 10,
      weekStart,
      weekDays: weekStats.days,
      weekTotalMinutes: weekStats.totalDuration,
      weekTotalHours: weekStats.totalHours,
      weekSessions,
      weekAvgDailyMinutes,
      weekDailyMinutes
    };

    // 文本分享（克制、信息完整）
    let content = `练琴小记（${shareDate}）\n`;
    content += `当日：${dayTotalMinutes} 分钟 · ${daySessions} 次\n`;
    content += `近 7 天：累计 ${stats.weekTotalHours} 小时 · ${stats.weekDays} 天 · ${stats.weekSessions} 次\n`;
    if (daySessions > 0) {
      content += `\n当日明细：\n`;
      dayRecords
        .slice()
        .sort((a, b) => (a.createTime || '').localeCompare(b.createTime || ''))
        .slice(0, 5)
        .forEach(r => {
          const t = (r.createTime || '').slice(11, 16) || '--:--';
          const song = r.song || '未命名曲目';
          const repeatText = (r.repeatCount || 1) > 1 ? ` ×${r.repeatCount}` : '';
          content += `${t} · ${r.duration || 0} 分钟${repeatText} · ${song}\n`;
        });
      if (dayRecords.length > 5) content += `…共 ${daySessions} 次\n`;
    } else {
      content += `\n当日暂无练习记录。\n`;
    }
    content += `\n— 记录于「琴记」`;
    
    this.setData(
      {
        shareStats: stats,
        shareContent: content
      },
      () => {
        if (callback) callback();
      }
    );
  },

  // 复制分享内容
  onCopyShareContent() {
    wx.setClipboardData({
      data: this.data.shareContent,
      success: () => {
        wx.showToast({
          title: '已复制到剪贴板',
          icon: 'success'
        });
      }
    });
  },

  // 日期选择器变化
  onShareDateChange(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    
    this.setData({
      [field]: value
    }, () => {
      this.updateShareStats();
    });
  },

  // 生成分享图片（Canvas 2D 新接口，同层渲染）
  generateShareImage() {
    const { shareStats, isGeneratingImage } = this.data;

    if (!shareStats) {
      wx.showToast({ title: '请先选择日期', icon: 'none' });
      return;
    }

    if (isGeneratingImage) return;

    this.setData({ isGeneratingImage: true });
    wx.showLoading({ title: '生成图片中...', mask: true });

    this.ensureShareCanvasReady((canvas, ctx) => {
      if (!canvas || !ctx) {
        wx.hideLoading();
        wx.showToast({ title: '画布初始化失败', icon: 'none' });
        this.setData({ isGeneratingImage: false });
        return;
      }

      // 逻辑尺寸（绘制单位：CSS 像素）
      const width = this.data.canvasCssWidth || 600;
      const height = this.data.canvasCssHeight || 1040;

      // 预加载底部二维码资源（小程序码 + 公众号）
      const xchSrc = '/images/gh/xch.jpg';
      const ghSrc = '/images/gh/gh_qrc.jpg';

      Promise.all([
        this.loadCanvasImage(canvas, xchSrc).catch(() => null),
        this.loadCanvasImage(canvas, ghSrc).catch(() => null)
      ]).then(([xchImg, ghImg]) => {
        // 新版分享图：更克制、更美观、信息更完整
        const { userInfo, shareDate } = this.data;
        this.drawSharePosterV2(ctx, { width, height, shareDate, userInfo, shareStats, xchImg, ghImg });

        // 导出：使用真实像素尺寸
        const dpr = this.data.canvasDpr || getDprSafe();
        const destWidth = Math.floor(width * dpr);
        const destHeight = Math.floor(height * dpr);

        setTimeout(() => {
          wx.canvasToTempFilePath({
          canvas,
          x: 0,
          y: 0,
          width: canvas.width,
          height: canvas.height,
          destWidth,
          destHeight,
          success: (res) => {
            wx.hideLoading();
            this.setData({
              shareImagePath: res.tempFilePath,
              showShareImageModal: true,
              isGeneratingImage: false
            });
          },
          fail: () => {
            wx.hideLoading();
            wx.showToast({ title: '生成失败', icon: 'error' });
            this.setData({ isGeneratingImage: false });
          }
          }, this);
        }, 80);
      });
    });
  },

  // 新版分享图（单日小记）
  drawSharePosterV2(ctx, { width, height, shareDate, userInfo, shareStats, xchImg, ghImg }) {
    const pad = 40;
    const cardRadius = 14;

    const bg = '#fbf7f0';
    const ink = '#1f2937';
    const sub = 'rgba(0,0,0,0.55)';
    const line = 'rgba(0,0,0,0.08)';

    // 背景（宣纸感）
    ctx.setFillStyle(bg);
    ctx.fillRect(0, 0, width, height);

    // 顶部标题区（留白但不空白）
    ctx.setFillStyle(ink);
    ctx.setTextAlign('left');
    ctx.setFontSize(22);
    ctx.fillText('练琴小记', pad, 64);

    ctx.setFillStyle(sub);
    ctx.setFontSize(14);
    const name = (userInfo && (userInfo.nickname || userInfo.name)) ? (userInfo.nickname || userInfo.name) : '琴友';
    ctx.fillText(name, pad, 94);

    // 日期：更有气质的格式（公历 + 星期 + 农历/节气/节日）
    const dateObj = new Date(`${shareDate}T00:00:00`);
    const wk = ['日','一','二','三','四','五','六'][dateObj.getDay()];
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    const solarElegant = `${y}年${m}月${d}日 · 周${wk}`;
    const fest = getFestivalInfo(dateObj);
    const lunar = fest && fest.lunar ? fest.lunar : (solarToLunar ? solarToLunar(dateObj) : null);
    const lunarMd = lunar ? `${lunar.lunarMonthText}${lunar.lunarDayText}` : '';
    const lunarLabel = fest && fest.label ? `${fest.label} · ${lunarMd}` : lunarMd;

    ctx.setTextAlign('right');
    ctx.setFillStyle(sub);
    ctx.setFontSize(13);
    ctx.fillText(solarElegant, width - pad, 90);
    if (lunarLabel) {
      ctx.setFontSize(12);
      ctx.fillText(lunarLabel, width - pad, 110);
    }

    // 分割线
    ctx.setStrokeStyle(line);
    ctx.setLineWidth(1);
    ctx.beginPath();
    ctx.moveTo(pad, 128);
    ctx.lineTo(width - pad, 128);
    ctx.stroke();

    // 关键数字：当日练习时长
    const dayMin = shareStats.dayTotalMinutes || 0;
    const daySessions = shareStats.daySessions || 0;
    const dayHours = shareStats.dayTotalHours || 0;

    ctx.setTextAlign('left');
    ctx.setFillStyle(sub);
    ctx.setFontSize(14);
    ctx.fillText('当日练习', pad, 170);

    // 注意：measureText 需要在“数字字号”下测量，否则单位文本会与数字重叠。
    const dayMinText = `${dayMin}`;
    ctx.setFillStyle(ink);
    ctx.setFontSize(44);
    const dayMinWidth = ctx.measureText(dayMinText).width;
    ctx.fillText(dayMinText, pad, 226);

    ctx.setFillStyle(sub);
    ctx.setFontSize(16);
    ctx.fillText('分钟', pad + dayMinWidth + 8, 226);

    ctx.setFillStyle(sub);
    ctx.setFontSize(14);
    ctx.fillText(`${dayHours} 小时 · ${daySessions} 次`, pad, 256);

    // 两张小卡：当日/近7天
    const cardTop = 284;
    const cardW = (width - pad * 2 - 18) / 2;
    const cardH = 120;
    this.drawCard(ctx, pad, cardTop, cardW, cardH, cardRadius);
    this.drawCard(ctx, pad + cardW + 18, cardTop, cardW, cardH, cardRadius);

    // 卡片内容
    // 左：当日
    ctx.setTextAlign('left');
    ctx.setFillStyle(sub);
    ctx.setFontSize(13);
    ctx.fillText('当日概览', pad + 16, cardTop + 28);
    ctx.setFillStyle(ink);
    ctx.setFontSize(22);
    ctx.fillText(`${daySessions} 次`, pad + 16, cardTop + 62);
    ctx.setFillStyle(sub);
    ctx.setFontSize(13);
    ctx.fillText(`平均 ${daySessions > 0 ? Math.round(dayMin / daySessions) : 0} 分钟/次`, pad + 16, cardTop + 88);

    // 右：近 7 天
    const weekHours = shareStats.weekTotalHours || 0;
    const weekDays = shareStats.weekDays || 0;
    const weekSessions = shareStats.weekSessions || 0;
    const weekAvgMin = shareStats.weekAvgDailyMinutes || 0;
    const rightX = pad + cardW + 18;
    ctx.setFillStyle(sub);
    ctx.setFontSize(13);
    ctx.fillText('近 7 天', rightX + 16, cardTop + 28);
    ctx.setFillStyle(ink);
    ctx.setFontSize(22);
    ctx.fillText(`${weekHours} 小时`, rightX + 16, cardTop + 62);
    ctx.setFillStyle(sub);
    ctx.setFontSize(13);
    ctx.fillText(`${weekDays} 天 · ${weekSessions} 次`, rightX + 16, cardTop + 88);
    ctx.fillText(`日均 ${weekAvgMin} 分钟`, rightX + 16, cardTop + 110);

    // 练习曲目卡（按曲目聚合）
    const listTop = cardTop + cardH + 24;
    // 明细区域高度适当收敛，给底部二维码区留出空间
    const listH = 280;
    this.drawCard(ctx, pad, listTop, width - pad * 2, listH, cardRadius);
    ctx.setFillStyle(ink);
    ctx.setFontSize(18);
    ctx.setTextAlign('left');
    ctx.fillText('练习曲目', pad + 16, listTop + 34);
    ctx.setStrokeStyle(line);
    ctx.beginPath();
    ctx.moveTo(pad + 16, listTop + 52);
    ctx.lineTo(width - pad - 16, listTop + 52);
    ctx.stroke();

    // 聚合：按曲目统计（总分钟、次数、最近一次时间）
    const dayRecords = (shareStats.dayRecords || []).slice();
    const songMap = new Map();
    dayRecords.forEach(r => {
      const key = (r.song || '').trim() || '未命名曲目';
      const prev = songMap.get(key) || { song: key, minutes: 0, sessions: 0, lastTime: '' };
      prev.minutes += Number(r.duration || 0);
      prev.sessions += (r.repeatCount || 1);
      const ct = r.createTime || '';
      if (ct && (!prev.lastTime || ct > prev.lastTime)) prev.lastTime = ct;
      songMap.set(key, prev);
    });
    const rows = Array.from(songMap.values())
      .sort((a, b) => (b.minutes - a.minutes) || (b.lastTime || '').localeCompare(a.lastTime || ''))
      .slice(0, 6);

    if (rows.length === 0) {
      ctx.setFillStyle(sub);
      ctx.setFontSize(14);
      ctx.fillText('今天还没有记录。', pad + 16, listTop + 96);
    } else {
      let y = listTop + 90;
      rows.forEach((r, idx) => {
        const t = (r.lastTime || '').slice(11, 16) || '--:--';
        const dur = `${Math.round(r.minutes)} 分钟`;
        const song = r.song;

        // 最近一次时间（弱）
        ctx.setFillStyle(sub);
        ctx.setFontSize(13);
        ctx.fillText(t, pad + 16, y);

        // 右侧：总分钟 + 次数
        ctx.setTextAlign('right');
        ctx.setFillStyle(ink);
        ctx.setFontSize(13);
        ctx.fillText(`${dur} · ${r.sessions}次`, width - pad - 16, y);
        ctx.setTextAlign('left');

        // 曲目名（主体）
        ctx.setFillStyle(ink);
        ctx.setFontSize(15);
        y += 24;
        y = this.wrapText(ctx, song, pad + 16, y, width - pad * 2 - 32, 20, 2);

        // 分隔线
        if (idx !== rows.length - 1) {
          ctx.setStrokeStyle(line);
          ctx.beginPath();
          ctx.moveTo(pad + 16, y + 10);
          ctx.lineTo(width - pad - 16, y + 10);
          ctx.stroke();
        }
        y += 26;
      });

      const total = (shareStats.dayRecords || []).reduce((sum, r) => sum + (r.repeatCount || 1), 0);
      const uniqueSongs = songMap.size;
      if (uniqueSongs > rows.length) {
        ctx.setFillStyle(sub);
        ctx.setFontSize(13);
        ctx.fillText(`…共 ${uniqueSongs} 首曲目 / ${total} 次练习`, pad + 16, listTop + listH - 24);
      }
    }

    // 近 7 天趋势（微图）
    const trendTop = listTop + listH + 18;
    const trendH = 150;
    this.drawCard(ctx, pad, trendTop, width - pad * 2, trendH, cardRadius);
    ctx.setFillStyle(ink);
    ctx.setFontSize(18);
    ctx.setTextAlign('left');
    ctx.fillText('近 7 天时长趋势', pad + 16, trendTop + 34);
    this.drawMiniTrend(ctx, {
      x: pad + 16,
      y: trendTop + 54,
      w: width - pad * 2 - 32,
      h: trendH - 70,
      lineColor: line,
      ink,
      sub,
      data: shareStats.weekDailyMinutes || [],
      avgMinutes: weekAvgMin
    });

    // 底部：签名/格言位（默认留白；节日/节气时显示祝福）
    const festBlessing = (fest && fest.blessing) ? fest.blessing : '';
    const blessingGap = festBlessing ? 34 : 18;
    const qrTop = trendTop + trendH + blessingGap;
    if (festBlessing) {
      // 放在趋势卡片下方的留白区，避免遮挡趋势图与刻度
      ctx.setFillStyle('rgba(0,0,0,0.46)');
      ctx.setFontSize(14);
      ctx.setTextAlign('center');
      ctx.fillText(`「${festBlessing}」`, width / 2, trendTop + trendH + 18);
    }

    // 二维码卡片：小程序码 + 公众号二维码（更克制的两列布局，避免突兀）
    const qrH = 150;
    this.drawCard(ctx, pad, qrTop, width - pad * 2, qrH, cardRadius);

    const colW = (width - pad * 2) / 2;
    const imgSize = 72;
    const imgY = qrTop + 26;
    const leftCenterX = pad + colW / 2;
    const rightCenterX = pad + colW + colW / 2;
    const leftImgX = Math.round(leftCenterX - imgSize / 2);
    const rightImgX = Math.round(rightCenterX - imgSize / 2);

    // 轻分割线（降低二维码区域存在感，融入版式）
    ctx.setStrokeStyle('rgba(0,0,0,0.06)');
    ctx.setLineWidth(1);
    ctx.beginPath();
    ctx.moveTo(pad + colW, qrTop + 18);
    ctx.lineTo(pad + colW, qrTop + qrH - 18);
    ctx.stroke();

    // 背景占位（防止资源加载失败时空白）
    ctx.setFillStyle('rgba(0,0,0,0.03)');
    ctx.fillRect(leftImgX, imgY, imgSize, imgSize);
    ctx.fillRect(rightImgX, imgY, imgSize, imgSize);

    if (xchImg) ctx.drawImage(xchImg, leftImgX, imgY, imgSize, imgSize);
    if (ghImg) ctx.drawImage(ghImg, rightImgX, imgY, imgSize, imgSize);

    // 标签（居中、弱化，不与二维码“抢眼”）
    ctx.setTextAlign('center');
    ctx.setFillStyle('rgba(0,0,0,0.54)');
    ctx.setFontSize(12);
    ctx.fillText('小程序', leftCenterX, imgY + imgSize + 20);
    ctx.fillText('公众号', rightCenterX, imgY + imgSize + 20);
    ctx.setFillStyle('rgba(0,0,0,0.34)');
    ctx.setFontSize(11);
    ctx.fillText('扫码打卡', leftCenterX, imgY + imgSize + 40);
    ctx.fillText('关注更新', rightCenterX, imgY + imgSize + 40);

    // 最底部落款（始终存在，克制）
    ctx.setFillStyle('rgba(0,0,0,0.32)');
    ctx.setFontSize(11);
    ctx.setTextAlign('center');
    ctx.fillText('琴记 · 古琴习练助手', width / 2, height - 18);
  },

  // 近 7 天微趋势图：柱 + 平均线（分钟）
  drawMiniTrend(ctx, { x, y, w, h, lineColor, ink, sub, data, avgMinutes }) {
    const items = (data || []).slice(-7);
    const max = Math.max(1, ...items.map(it => it.minutes || 0));
    const barGap = 6;
    const barW = (w - barGap * (items.length - 1)) / items.length;

    // 平均线
    if (avgMinutes && avgMinutes > 0) {
      const ay = y + h - (avgMinutes / max) * h;
      ctx.setStrokeStyle('rgba(0,0,0,0.12)');
      ctx.setLineWidth(1);
      ctx.beginPath();
      ctx.moveTo(x, ay);
      ctx.lineTo(x + w, ay);
      ctx.stroke();

      ctx.setFillStyle(sub);
      ctx.setFontSize(12);
      ctx.setTextAlign('right');
      ctx.fillText(`均值 ${avgMinutes}m`, x + w, ay - 6);
      ctx.setTextAlign('left');
    }

    // 柱状
    for (let i = 0; i < items.length; i++) {
      const m = items[i].minutes || 0;
      const bh = (m / max) * h;
      const bx = x + i * (barW + barGap);
      const by = y + h - bh;

      // 柱体（使用浅墨色）
      ctx.setFillStyle('rgba(0,0,0,0.22)');
      ctx.fillRect(bx, by, barW, bh);

      // 日期标签（仅显示日）
      const d = (items[i].date || '').slice(8, 10);
      ctx.setFillStyle('rgba(0,0,0,0.35)');
      ctx.setFontSize(10);
      ctx.setTextAlign('center');
      // 日期标签放在图表内部下边缘上方，避免被卡片圆角/裁切
      ctx.fillText(d, bx + barW / 2, y + h + 10);
    }
    ctx.setTextAlign('left');
  },

  // 绘制圆角卡片
  drawCard(ctx, x, y, w, h, r) {
    ctx.setFillStyle('rgba(255,255,255,0.86)');
    ctx.setStrokeStyle('rgba(0,0,0,0.06)');
    ctx.setLineWidth(1);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  },

  // 文本换行（最多 maxLines 行，返回绘制结束 y）
  wrapText(ctx, text, x, y, maxWidth, lineHeight = 20, maxLines = 2) {
    if (!text) return y;
    const chars = String(text).split('');
    let line = '';
    let lines = 0;
    for (let i = 0; i < chars.length; i++) {
      const test = line + chars[i];
      if (ctx.measureText(test).width > maxWidth && line) {
        ctx.fillText(line, x, y);
        y += lineHeight;
        lines++;
        line = chars[i];
        if (lines >= maxLines - 1) {
          // 最后一行：加省略号
          let tail = line;
          while (ctx.measureText(tail + '…').width > maxWidth && tail.length > 0) {
            tail = tail.slice(0, -1);
          }
          ctx.fillText(tail + '…', x, y);
          return y;
        }
      } else {
        line = test;
      }
    }
    ctx.fillText(line, x, y);
    return y;
  },

  // 绘制统计卡片
  drawStatsCard(ctx, x, y, width, stats) {
    // 卡片背景
    ctx.setFillStyle('#f8f8f8');
    ctx.setStrokeStyle('#e0e0e0');
    ctx.setLineWidth(1);
    
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + width - 10, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + 10);
    ctx.lineTo(x + width, y + 180 - 10);
    ctx.quadraticCurveTo(x + width, y + 180, x + width - 10, y + 180);
    ctx.lineTo(x + 10, y + 180);
    ctx.quadraticCurveTo(x, y + 180, x, y + 180 - 10);
    ctx.lineTo(x, y + 10);
    ctx.quadraticCurveTo(x, y, x + 10, y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    // 卡片标题
    ctx.setFillStyle('#333333');
    ctx.setFontSize(22);
    ctx.setTextAlign('left');
    ctx.fillText('📊 练习统计', x + 20, y + 35);
    
    // 统计项
    const statsData = [
      { icon: '📅', label: '练习天数', value: `${stats.days}天` },
      { icon: '⏱️', label: '总时长', value: `${stats.totalHours}小时` },
      { icon: '📈', label: '平均时长', value: `${stats.avgDuration}分钟` },
      { icon: '🎵', label: '练习次数', value: `${stats.totalRecords}次` }
    ];
    
    const startX = x + 20;
    const startY = y + 70;
    const itemWidth = (width - 40) / 2;
    const itemHeight = 50;
    
    statsData.forEach((item, index) => {
      const row = Math.floor(index / 2);
      const col = index % 2;
      const itemX = startX + col * itemWidth;
      const itemY = startY + row * itemHeight;
      
      // 图标
      ctx.setFillStyle('#8B7355');
      ctx.setFontSize(24);
      ctx.setTextAlign('left');
      ctx.fillText(item.icon, itemX, itemY);
      
      // 数值
      ctx.setFillStyle('#333333');
      ctx.setFontSize(20);
      ctx.fillText(item.value, itemX + 35, itemY);
      
      // 标签
      ctx.setFillStyle('#666666');
      ctx.setFontSize(14);
      ctx.fillText(item.label, itemX + 35, itemY + 25);
    });
  },

  // 绘制记录列表
  drawRecordsList(ctx, x, y, width, records) {
    // 列表背景
    ctx.setFillStyle('#ffffff');
    ctx.setStrokeStyle('#e0e0e0');
    ctx.setLineWidth(1);
    
    ctx.beginPath();
    ctx.moveTo(x + 10, y);
    ctx.lineTo(x + width - 10, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + 10);
    ctx.lineTo(x + width, y + 280 - 10);
    ctx.quadraticCurveTo(x + width, y + 280, x + width - 10, y + 280);
    ctx.lineTo(x + 10, y + 280);
    ctx.quadraticCurveTo(x, y + 280, x, y + 280 - 10);
    ctx.lineTo(x, y + 10);
    ctx.quadraticCurveTo(x, y, x + 10, y);
    ctx.closePath();
    
    ctx.fill();
    ctx.stroke();
    
    if (!records || records.length === 0) {
      ctx.setFillStyle('#999999');
      ctx.setFontSize(18);
      ctx.setTextAlign('center');
      ctx.fillText('暂无练习记录', x + width / 2, y + 140);
      return;
    }
    
    const startY = y + 30;
    const maxRecords = 5;
    
    records.slice(0, maxRecords).forEach((record, index) => {
      const recordY = startY + index * 50;
      
      // 日期
      ctx.setFillStyle('#333333');
      ctx.setFontSize(16);
      ctx.setTextAlign('left');
      ctx.fillText(record.date, x + 20, recordY);
      
      // 曲目
      ctx.setFillStyle('#666666');
      ctx.setFontSize(14);
      let songText = record.song;
      const maxSongWidth = width - 150;
      const songWidth = ctx.measureText(songText).width;
      
      if (songWidth > maxSongWidth) {
        while (ctx.measureText(songText + '...').width > maxSongWidth && songText.length > 1) {
          songText = songText.substring(0, songText.length - 1);
        }
        songText = songText + '...';
      }
      ctx.fillText(songText, x + 120, recordY);
      
      // 时长
      ctx.setFillStyle('#8B7355');
      ctx.setFontSize(16);
      ctx.setTextAlign('right');
      ctx.fillText(`${record.duration}分钟`, x + width - 30, recordY);
      
      // 分割线
      if (index < Math.min(records.length, maxRecords) - 1) {
        ctx.setStrokeStyle('#f0f0f0');
        ctx.beginPath();
        ctx.moveTo(x + 20, recordY + 25);
        ctx.lineTo(x + width - 20, recordY + 25);
        ctx.stroke();
      }
    });
    
    // 如果记录超过5条，显示提示
    if (records.length > maxRecords) {
      ctx.setFillStyle('#999999');
      ctx.setFontSize(14);
      ctx.setTextAlign('center');
      ctx.fillText(`...等${records.length}条记录`, x + width / 2, y + 260);
    }
  },

  // 保存分享图片
  saveShareImage() {
    const { shareImagePath } = this.data;

    if (!shareImagePath) {
      wx.showToast({ title: '请先生成海报', icon: 'none' });
      return;
    }
    
    wx.saveImageToPhotosAlbum({
      filePath: shareImagePath,
      success: () => {
        wx.showToast({
          title: '图片已保存到相册',
          icon: 'success'
        });
      },
      fail: (err) => {
        const msg = (err && err.errMsg) ? err.errMsg : '';
        // 不同基础库/机型的错误文案不一致，这里做更鲁棒的判断。
        if (msg.includes('auth') || msg.includes('deny') || msg.includes('authorize') || msg.includes('permission') || msg.includes('scope')) {
          wx.showModal({
            title: '保存图片需要授权',
            content: '请允许访问相册以保存图片',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
        } else {
          wx.showToast({
            title: '保存失败',
            icon: 'error'
          });
        }
      }
    });
  },

  // 分享图片给朋友
  shareImageToFriend() {
    const { shareImagePath } = this.data;

    if (!shareImagePath) {
      wx.showToast({ title: '请先生成海报', icon: 'none' });
      return;
    }

    // 优先使用系统分享面板（更适合“图片分享”场景），旧版本再回退。
    if (typeof wx.showShareImageMenu === 'function') {
      wx.showShareImageMenu({
        path: shareImagePath,
        success: () => {},
        fail: () => {
          wx.showToast({ title: '分享失败', icon: 'error' });
        }
      });
      return;
    }
    
    if (typeof wx.shareFileMessage === 'function') {
      wx.shareFileMessage({
        filePath: shareImagePath,
        success: () => {
          wx.showToast({ title: '已发送给朋友', icon: 'success' });
        },
        fail: () => {
          wx.showModal({
            title: '无法直接分享图片',
            content: '请先保存到相册，再通过微信选择图片发送或分享到朋友圈。',
            showCancel: false
          });
        }
      });
      return;
    }

    wx.showModal({
      title: '当前版本不支持',
      content: '请先保存到相册，再通过微信选择图片发送或分享到朋友圈。',
      showCancel: false
    });
  },

  // 关闭分享图片模态框
  closeShareImageModal() {
    this.setData({
      showShareImageModal: false
    });
  },

  // 显示赞赏
  onShowDonate() {
    this.setData({ showDonateModal: true });
  },

  // 关闭赞赏模态框
  closeDonateModal() {
    this.setData({
      showDonateModal: false
    });
  },

  // 关注公众号文章
  onOpenOfficialArticle() {
    const targetUrl = 'https://mp.weixin.qq.com/s/li3f_Nb7CN9JjcsnOv717Q';
    const encoded = encodeURIComponent(targetUrl);
    wx.navigateTo({
      url: `/pages/webview/webview?url=${encoded}`
    });
  },

  // 清空所有数据
  onClearAllData() {
    wx.showModal({
      title: '警告',
      content: '这将删除所有练习记录和用户信息，操作不可恢复。确定要继续吗？',
      confirmColor: '#ff4444',
      success: (res) => {
        if (res.confirm) {
          wx.clearStorageSync();
          
          wx.showToast({
            title: '数据已清空',
            icon: 'success'
          });
          
          setTimeout(() => {
            wx.reLaunch({
              url: '/pages/checkin/checkin'
            });
          }, 1500);
        }
      }
    });
  },

  // 关于小程序
  onAbout() {
    wx.showModal({
      title: '关于小程序',
      content: '琴记 - 您的古琴练习打卡和学习工具助手，由个人爱好者开发。\n\n本小程序所有数据仅保存在本地，保护您的数据与隐私安全。\n\nversion: 1.2.3\n\n开发者:FY BA4SGP \n\ncopyright©sunli.2026',
      showCancel: false
    });
  }
});
