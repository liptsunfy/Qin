Page({
  data: {
    strings: [
      { id: 1, name: '一弦', note: 'D', tuned: false, frequency: 293.664 },
      { id: 2, name: '二弦', note: 'A', tuned: false, frequency: 440.000 },
      { id: 3, name: '三弦', note: 'E', tuned: false, frequency: 329.628 },
      { id: 4, name: '四弦', note: 'B', tuned: false, frequency: 246.942 },
      { id: 5, name: '五弦', note: 'F', tuned: false, frequency: 349.228 },
      { id: 6, name: '六弦', note: 'C', tuned: false, frequency: 261.626 },
      { id: 7, name: '七弦', note: 'G', tuned: false, frequency: 392.000 }
    ],
    currentStringIndex: 0,
    tuningValue: 0,
    autoTune: false,
    isListening: false,
    statusText: '未开始监听',
    statusLevel: 'idle'
  },

  onLoad() {
    this.updateTuningFeedback();
  },

  onStringTap(e) {
    const index = e.currentTarget.dataset.index;
    this.setData({
      currentStringIndex: index
    });
    this.updateTuningFeedback();
  },

  updateTuningFeedback() {
    const deviation = Number((Math.random() * 100 - 50).toFixed(1));
    const clamped = Math.max(-50, Math.min(50, deviation));
    const { statusText, statusLevel } = this.getStatusFromDeviation(clamped);

    this.setData({
      tuningValue: clamped,
      statusText,
      statusLevel
    });
  },

  getStatusFromDeviation(value) {
    const abs = Math.abs(value);
    if (abs <= 5) {
      return { statusText: '音准稳定', statusLevel: 'ok' };
    }
    if (value < 0) {
      return { statusText: '偏低，建议拧紧', statusLevel: 'low' };
    }
    return { statusText: '偏高，建议放松', statusLevel: 'high' };
  },

  onAutoTuneToggle() {
    this.setData({
      autoTune: !this.data.autoTune
    });
  },

  onToggleListen() {
    const nextState = !this.data.isListening;
    this.setData({ isListening: nextState });
    if (nextState) {
      this.startListening();
      return;
    }
    this.stopListening();
  },

  startListening() {
    this.stopListening();
    this.setData({
      statusText: '正在监听音高…',
      statusLevel: 'listening'
    });
    this.listenTimer = setInterval(() => {
      this.updateTuningFeedback();
      if (this.data.autoTune) {
        this.maybeAutoAdvance();
      }
    }, 800);
  },

  stopListening() {
    if (this.listenTimer) {
      clearInterval(this.listenTimer);
      this.listenTimer = null;
    }
    this.setData({
      statusText: '已停止监听',
      statusLevel: 'idle'
    });
  },

  maybeAutoAdvance() {
    if (Math.abs(this.data.tuningValue) > 5) return;
    const nextStrings = this.data.strings.map((item, index) => {
      if (index === this.data.currentStringIndex) {
        return { ...item, tuned: true };
      }
      return item;
    });
    const nextIndex = nextStrings.findIndex(item => !item.tuned);
    this.setData({
      strings: nextStrings,
      currentStringIndex: nextIndex === -1 ? this.data.currentStringIndex : nextIndex
    });
  },

  onMarkTuned() {
    const nextStrings = this.data.strings.map((item, index) => {
      if (index === this.data.currentStringIndex) {
        return { ...item, tuned: true };
      }
      return item;
    });
    this.setData({ strings: nextStrings });
  },

  onResetTuned() {
    const resetStrings = this.data.strings.map(item => ({ ...item, tuned: false }));
    this.setData({
      strings: resetStrings,
      currentStringIndex: 0
    });
  }
});
