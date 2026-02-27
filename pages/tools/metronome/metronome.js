const BPM_MIN = 20;
const BPM_MAX = 300;

Page({
  data: {
    bpm: 80,
    beatsPerBar: 4,
    beatMode: 'metered',
    isRunning: false,
    currentBeat: 0,
    tapHint: '点击 4 次获取节拍',
    sliderBpm: 80,
    beatOptions: [
      { label: '2 拍', value: 2 },
      { label: '3 拍', value: 3 },
      { label: '4 拍', value: 4 },
      { label: '6 拍', value: 6 },
      { label: '散板', value: 'free' }
    ]
  },

  onLoad() {
    this.setupAudio();
  },

  onUnload() {
    this.stopMetronome();
    this.destroyAudio();
  },

  onBpmChange(e) {
    const bpm = Number(e.detail.value);
    this.setBpm(bpm);
  },

  onBpmAdjust(e) {
    const step = Number(e.currentTarget.dataset.step);
    const bpm = this.data.bpm + step;
    this.setBpm(bpm);
  },

  setBpm(value) {
    const bpm = Math.min(BPM_MAX, Math.max(BPM_MIN, Math.round(value)));
    this.setData({ bpm, sliderBpm: bpm });
    if (this.data.isRunning) {
      this.restartMetronome();
    }
  },

  onBeatOptionTap(e) {
    const value = e.currentTarget.dataset.value;
    if (value === 'free') {
      this.setData({ beatMode: 'free', beatsPerBar: 1, currentBeat: 0 });
      return;
    }
    const beatsPerBar = Number(value);
    this.setData({ beatsPerBar, beatMode: 'metered', currentBeat: 0 });
  },

  toggleMetronome() {
    if (this.data.isRunning) {
      this.stopMetronome();
    } else {
      this.startMetronome();
    }
  },

  startMetronome() {
    if (this.data.isRunning) return;
    this.setData({ isRunning: true, currentBeat: 0 });
    this.startTicker();
  },

  restartMetronome() {
    this.stopTicker();
    if (this.data.isRunning) {
      this.startTicker();
    }
  },

  stopMetronome() {
    this.stopTicker();
    this.setData({ isRunning: false, currentBeat: 0 });
  },

  startTicker() {
    const interval = Math.round(60000 / this.data.bpm);
    this.tick();
    this.timer = setInterval(() => {
      this.tick();
    }, interval);
  },

  stopTicker() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  },

  tick() {
    const isFreeMode = this.data.beatMode === 'free';
    const beatsPerBar = isFreeMode ? 1 : this.data.beatsPerBar;
    const nextBeat = (this.data.currentBeat % beatsPerBar) + 1;
    this.setData({ currentBeat: nextBeat });
    this.playClick(isFreeMode || nextBeat === 1);
    if (wx.vibrateShort) {
      wx.vibrateShort({ type: isFreeMode || nextBeat === 1 ? 'heavy' : 'light' });
    }
  },

  onTapTempo() {
    const now = Date.now();
    if (!this.tapTimes) {
      this.tapTimes = [];
    }
    this.tapTimes.push(now);
    if (this.tapTimes.length > 5) {
      this.tapTimes.shift();
    }

    if (this.tapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < this.tapTimes.length; i += 1) {
        intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, value) => sum + value, 0) / intervals.length;
      const bpm = Math.round(60000 / avgInterval);
      this.setBpm(bpm);
      this.setData({
        tapHint: `已识别 ${this.data.bpm} BPM`
      });
    }
  },
  setupAudio() {
    if (!wx.createWebAudioContext) {
      this.audioContext = null;
      return;
    }
    this.audioContext = wx.createWebAudioContext();
    if (this.audioContext && this.audioContext.resume) {
      this.audioContext.resume();
    }
  },

  destroyAudio() {
    if (this.audioContext && this.audioContext.close) {
      this.audioContext.close();
    }
    this.audioContext = null;
  },

  playClick(isDownbeat) {
    const ctx = this.audioContext;
    if (!ctx || !ctx.createOscillator || !ctx.createGain) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = isDownbeat ? 1200 : 800;
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    const now = ctx.currentTime || 0;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    oscillator.start(now);
    oscillator.stop(now + 0.09);
  }
});
