const STORAGE_KEY = 'recorder_files';

Page({
  data: {
    record: {},
    waveformBars: [],
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    currentTimeText: '00:00',
    durationText: '00:00',
    progress: 0
  },

  onLoad(options) {
    const recordId = options.id;
    if (!recordId) {
      wx.showToast({ title: '未找到录音', icon: 'none' });
      wx.navigateBack();
      return;
    }
    this.recordId = recordId;
    this.loadRecord();
  },

  onUnload() {
    this.stopPlayback();
  },

  loadRecord() {
    const recordings = wx.getStorageSync(STORAGE_KEY) || [];
    const record = recordings.find(item => item.id === this.recordId);
    if (!record) {
      wx.showToast({ title: '录音已被删除', icon: 'none' });
      wx.navigateBack();
      return;
    }
    const normalized = {
      ...record,
      durationText: record.durationText || this.formatDuration(record.duration || 0),
      createTimeText: record.createTimeText || this.formatDateTime(record.createTime || Date.now())
    };
    const waveformBars = this.buildWaveformBars(record.id, 40);
    this.setData({
      record: normalized,
      waveformBars,
      durationText: normalized.durationText,
      currentTimeText: this.formatDuration(0)
    });
  },

  togglePlay() {
    if (!this.data.isPlaying) {
      this.startPlayback();
      return;
    }
    if (this.data.isPaused) {
      this.resumePlayback();
    } else {
      this.pausePlayback();
    }
  },

  startPlayback() {
    this.stopPlayback();
    this.audioContext = wx.createInnerAudioContext();
    this.audioContext.src = this.data.record.filePath;
    this.audioContext.onTimeUpdate(() => {
      const currentTime = this.audioContext.currentTime || 0;
      const duration = this.audioContext.duration || this.data.record.duration || 0;
      const progress = duration ? Math.floor((currentTime / duration) * 100) : 0;
      this.setData({
        currentTime,
        currentTimeText: this.formatDuration(Math.floor(currentTime)),
        progress
      });
    });
    this.audioContext.onEnded(() => {
      this.setData({ isPlaying: false, isPaused: false, progress: 0, currentTimeText: '00:00' });
    });
    this.audioContext.onStop(() => {
      this.setData({ isPlaying: false, isPaused: false });
    });
    this.audioContext.onError(() => {
      wx.showToast({ title: '播放失败', icon: 'error' });
      this.setData({ isPlaying: false, isPaused: false });
    });
    this.audioContext.play();
    this.setData({ isPlaying: true, isPaused: false });
  },

  pausePlayback() {
    if (!this.audioContext) return;
    this.audioContext.pause();
    this.setData({ isPaused: true });
  },

  resumePlayback() {
    if (!this.audioContext) return;
    this.audioContext.play();
    this.setData({ isPaused: false });
  },

  stopPlayback() {
    if (this.audioContext) {
      this.audioContext.stop();
      this.audioContext.destroy();
      this.audioContext = null;
    }
    this.setData({ isPlaying: false, isPaused: false, progress: 0, currentTimeText: '00:00' });
  },

  onSeek(e) {
    if (!this.audioContext) return;
    const progress = e.detail.value || 0;
    const duration = this.audioContext.duration || this.data.record.duration || 0;
    const target = duration ? (progress / 100) * duration : 0;
    this.audioContext.seek(target);
    this.setData({
      progress,
      currentTimeText: this.formatDuration(Math.floor(target))
    });
  },

  renameRecording() {
    const record = this.data.record;
    wx.showModal({
      title: '重命名录音',
      content: '请输入新的录音名称',
      editable: true,
      placeholderText: record.name,
      success: (res) => {
        if (!res.confirm) return;
        const name = (res.content || '').trim();
        if (!name) {
          wx.showToast({ title: '名称不能为空', icon: 'none' });
          return;
        }
        const recordings = wx.getStorageSync(STORAGE_KEY) || [];
        const updated = recordings.map(item => (
          item.id === record.id ? { ...item, name } : item
        ));
        wx.setStorageSync(STORAGE_KEY, updated);
        this.setData({ record: { ...record, name } });
      }
    });
  },

  shareRecording() {
    const record = this.data.record;
    if (wx.canIUse && wx.canIUse('shareFileMessage')) {
      wx.shareFileMessage({
        filePath: record.filePath,
        fileName: `${record.name}.mp3`,
        success: () => wx.showToast({ title: '已分享', icon: 'success' }),
        fail: () => wx.showToast({ title: '分享失败', icon: 'error' })
      });
      return;
    }
    wx.showToast({ title: '当前版本不支持分享音频', icon: 'none' });
  },

  saveToPhone() {
    const record = this.data.record;
    if (wx.saveFileToDisk) {
      wx.saveFileToDisk({
        filePath: record.filePath,
        success: () => wx.showToast({ title: '已保存到文件夹', icon: 'success' }),
        fail: () => wx.showToast({ title: '保存失败', icon: 'error' })
      });
      return;
    }
    wx.showModal({
      title: '暂不支持',
      content: '当前版本不支持直接保存到手机文件夹，可使用分享功能或系统文件管理器保存。',
      showCancel: false
    });
  },

  deleteRecording() {
    const record = this.data.record;
    wx.showModal({
      title: '删除录音',
      content: '确定要删除这条录音吗？',
      success: (res) => {
        if (!res.confirm) return;
        this.stopPlayback();
        const recordings = wx.getStorageSync(STORAGE_KEY) || [];
        const updated = recordings.filter(item => item.id !== record.id);
        wx.setStorageSync(STORAGE_KEY, updated);
        wx.removeSavedFile({
          filePath: record.filePath,
          complete: () => {}
        });
        wx.navigateBack();
      }
    });
  },

  formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const pad = (value) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  buildWaveformBars(seedValue, count) {
    let seed = 0;
    const seedStr = String(seedValue || '');
    for (let i = 0; i < seedStr.length; i += 1) {
      seed += seedStr.charCodeAt(i) * (i + 1);
    }
    const bars = [];
    for (let i = 0; i < count; i += 1) {
      seed = (seed * 9301 + 49297) % 233280;
      const ratio = seed / 233280;
      const height = Math.floor(30 + ratio * 80);
      bars.push(height);
    }
    return bars;
  }
});
