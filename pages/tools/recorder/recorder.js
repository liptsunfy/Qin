const STORAGE_KEY = 'recorder_files';

Page({
  data: {
    isRecording: false,
    isPaused: false,
    duration: 0,
    durationText: '00:00',
    recordings: [],
    recorderMode: 'guqin'
  },

  onLoad() {
    this.initRecorder();
    this.loadRecordings();
  },

  onShow() {
    this.loadRecordings();
  },

  onUnload() {
    this.stopTimer();
    if (this.recorderManager && this.data.isRecording) {
      this.recorderManager.stop();
    }
  },

  onHide() {
    this.stopTimer();
    if (this.recorderManager && this.data.isRecording) {
      this.recorderManager.stop();
    }
  },

  initRecorder() {
    this.recorderManager = wx.getRecorderManager();
    this.recorderManager.onStart(() => {
      this.setData({ isRecording: true, isPaused: false });
      this.startTimer();
    });
    this.recorderManager.onPause(() => {
      this.setData({ isPaused: true });
      this.stopTimer();
    });
    this.recorderManager.onResume(() => {
      this.setData({ isPaused: false });
      this.startTimer();
    });
    this.recorderManager.onStop((res) => {
      this.handleRecordStop(res);
    });
    this.recorderManager.onError((err) => {
      const message = err && err.errMsg ? err.errMsg : '录音失败';
      wx.showToast({ title: message, icon: 'error' });
      this.resetRecorderState();
    });
  },

  loadRecordings() {
    const recordings = wx.getStorageSync(STORAGE_KEY) || [];
    const normalized = recordings.map((record) => ({
      ...record,
      durationText: record.durationText || this.formatDuration(record.duration || 0),
      createTimeText: record.createTimeText || this.formatDateTime(record.createTime || Date.now())
    }));
    this.setData({ recordings: normalized });
  },

  saveRecordings(recordings) {
    wx.setStorageSync(STORAGE_KEY, recordings);
    this.setData({ recordings });
  },

  requestPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          const permission = res.authSetting['scope.record'];
          if (permission) {
            resolve();
            return;
          }
          if (permission === false) {
            wx.showModal({
              title: '需要录音权限',
              content: '录音功能需要麦克风权限，请前往设置开启。',
              confirmText: '去设置',
              success: (modalRes) => {
                if (modalRes.confirm) {
                  wx.openSetting();
                }
              }
            });
            reject();
            return;
          }
          wx.authorize({
            scope: 'scope.record',
            success: () => resolve(),
            fail: () => {
              wx.showModal({
                title: '需要录音权限',
                content: '录音功能需要麦克风权限，请前往设置开启。',
                confirmText: '去设置',
                success: (modalRes) => {
                  if (modalRes.confirm) {
                    wx.openSetting();
                  }
                }
              });
              reject();
            }
          });
        },
        fail: () => reject()
      });
    });
  },

  startRecording() {
    if (this.data.isRecording) return;
    if (!this.recorderManager) {
      this.initRecorder();
    }
    this.requestPermission()
      .then(() => {
        this.setData({ duration: 0, durationText: '00:00' });
        this.recorderManager.start({
          duration: 10 * 60 * 1000,
          sampleRate: 48000,
          numberOfChannels: 2,
          encodeBitRate: 256000,
          format: 'mp3',
          frameSize: 8
        });
      })
      .catch(() => {
        wx.showToast({ title: '未授予权限', icon: 'none' });
      });
  },

  pauseRecording() {
    if (!this.data.isRecording || this.data.isPaused) return;
    this.recorderManager.pause();
  },

  resumeRecording() {
    if (!this.data.isRecording || !this.data.isPaused) return;
    this.recorderManager.resume();
  },

  stopRecording() {
    if (!this.data.isRecording) return;
    this.recorderManager.stop();
  },

  handleRecordStop(res) {
    this.stopTimer();
    const duration = this.data.duration;
    const tempFilePath = res.tempFilePath;
    if (!tempFilePath) {
      this.resetRecorderState();
      return;
    }

    wx.saveFile({
      tempFilePath,
      success: (saveRes) => {
        const record = {
          id: `rec_${Date.now()}`,
          name: this.generateName(),
          duration,
          durationText: this.formatDuration(duration),
          filePath: saveRes.savedFilePath,
          createTime: Date.now(),
          createTimeText: this.formatDateTime(Date.now())
        };
        const newRecords = [record, ...this.data.recordings];
        this.saveRecordings(newRecords);
        this.resetRecorderState();
      },
      fail: () => {
        wx.showToast({ title: '保存失败', icon: 'error' });
        this.resetRecorderState();
      }
    });
  },

  resetRecorderState() {
    this.setData({
      isRecording: false,
      isPaused: false,
      duration: 0,
      durationText: '00:00'
    });
  },

  startTimer() {
    this.stopTimer();
    this.timer = setInterval(() => {
      const duration = this.data.duration + 1;
      this.setData({
        duration,
        durationText: this.formatDuration(duration)
      });
    }, 1000);
  },

  stopTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  },

  generateName() {
    const date = new Date();
    const pad = (value) => value.toString().padStart(2, '0');
    return `录音 ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  formatDateTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const pad = (value) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  openRecordingDetail(e) {
    const recordId = e.currentTarget.dataset.id;
    if (!recordId) return;
    wx.navigateTo({
      url: `/pages/tools/recorder-detail/recorder-detail?id=${recordId}`
    });
  }
});
